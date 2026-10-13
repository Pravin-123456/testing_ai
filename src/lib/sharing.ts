import type { FindYourNameConfigV1 } from '../types';

export interface ShareContent {
  title: string;
  message: string;
  url: string;
}

export function getCanonicalCampaignUrl(config: FindYourNameConfigV1): string {
  const currentUrl = new URL(window.location.href);
  // Query strings and fragments may contain private/session state. Domain-based
  // campaign routing uses the canonical path; never propagate name/session data.
  const currentCanonical = `${currentUrl.origin}${currentUrl.pathname}`;
  const configured = config.sharing?.canonicalUrl?.trim();
  if (!configured) return currentCanonical;

  try {
    const candidate = new URL(configured, currentUrl.origin);
    if (candidate.protocol !== 'https:' && candidate.protocol !== 'http:') return currentCanonical;
    if (candidate.origin !== currentUrl.origin) return currentCanonical;
    return `${candidate.origin}${candidate.pathname}`;
  } catch {
    return currentCanonical;
  }
}

export function buildShareContent(config: FindYourNameConfigV1): ShareContent {
  const url = getCanonicalCampaignUrl(config);
  const title = config.campaign.title?.trim() || 'Find Your Name';
  const template = config.sharing?.message?.trim() ||
    'I found my name in this mystery game! 🎉 Can you find yours? Try it here: {campaign_url}';
  let message = template
    .replaceAll('{campaign_title}', title)
    .replaceAll('{campaign_url}', url)
    .trim();
  if (!template.includes('{campaign_url}')) message = `${message} ${url}`.trim();
  return { title, message, url };
}

export async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const field = document.createElement('textarea');
  field.value = text;
  field.setAttribute('readonly', '');
  field.style.position = 'fixed';
  field.style.opacity = '0';
  field.style.pointerEvents = 'none';
  document.body.append(field);
  field.select();
  field.setSelectionRange(0, field.value.length);
  const copied = document.execCommand('copy');
  field.remove();
  if (!copied) throw new Error('Clipboard permission was not granted.');
}

export function getWhatsAppUrl(content: ShareContent): string {
  return `https://wa.me/?text=${encodeURIComponent(content.message)}`;
}
