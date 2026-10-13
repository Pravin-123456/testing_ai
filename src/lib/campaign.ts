import { parseFindYourNameConfig, SceneConfigError } from '../config/sceneConfig';
import { safeHttpUrl } from './safeUrls';
import { defaultNormalizeHostname, getFindYourNamePlatform } from './platform';
import type { FindYourNameConfigV1, LoadedCampaign, ProductOffer } from '../types';

function record(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function firstText(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return undefined;
}

function unwrapTemplate(value: unknown): Record<string, unknown> | undefined {
  if (Array.isArray(value)) return unwrapTemplate(value[0]);
  const root = record(value);
  if (!root) return undefined;
  for (const key of ['template', 'campaignTemplate', 'campaign_template', 'activeTemplate', 'active_template']) {
    const nested = root[key];
    if (record(nested) || Array.isArray(nested)) return unwrapTemplate(nested);
  }
  if (root.data && (record(root.data) || Array.isArray(root.data))) return unwrapTemplate(root.data);
  return root;
}

function unwrapOffers(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  const root = record(value);
  if (!root) return [];
  for (const key of ['offers', 'products', 'assignedProducts', 'assigned_products', 'data']) {
    const nested = root[key];
    if (Array.isArray(nested)) return nested;
    const nestedRecord = record(nested);
    if (nestedRecord) {
      for (const rows of Object.values(nestedRecord)) if (Array.isArray(rows)) return rows;
    }
  }
  return [];
}

export function mapOfferRow(value: unknown): ProductOffer | undefined {
  const row = record(value);
  if (!row) return undefined;
  const nestedProduct = record(row.product) ?? record(row.products) ?? {};
  const originalId = row.product_id ?? row.productId ?? row.id ?? row.offer_id ?? row.offerId ??
    nestedProduct.product_id ?? nestedProduct.id;
  if (originalId === undefined || originalId === null || String(originalId).trim() === '') return undefined;
  const id = String(originalId).trim();

  const rawImage = firstText(
    row.image_url, row.imageUrl, row.product_image, row.product_image_url, row.image, row.thumbnail_url,
    nestedProduct.image_url, nestedProduct.imageUrl, nestedProduct.image, nestedProduct.thumbnail_url,
  );
  const rawCta = firstText(
    row.cta_url, row.ctaUrl, row.product_url, row.destination_url, row.link_url, row.url, row.link,
    nestedProduct.cta_url, nestedProduct.product_url, nestedProduct.url,
  );

  return {
    id,
    sourceId: originalId,
    title: firstText(row.product_name, row.title, row.name, row.display_name, nestedProduct.product_name, nestedProduct.title, nestedProduct.name),
    description: firstText(row.description, row.product_description, row.short_description, nestedProduct.description, nestedProduct.product_description),
    imageUrl: safeHttpUrl(rawImage) || undefined,
    category: firstText(row.category, row.category_name, nestedProduct.category, nestedProduct.category_name),
    brand: firstText(row.brand, row.brand_name, nestedProduct.brand, nestedProduct.brand_name),
    couponCode: firstText(row.coupon_code, row.couponCode, row.promo_code, row.promoCode, row.code),
    offerValue: firstText(row.offer_value, row.offerValue, row.discount, row.discount_value, row.value, row.coupon_value),
    ctaLabel: firstText(row.cta_label, row.ctaLabel, row.button_text, row.button_label),
    ctaUrl: safeHttpUrl(rawCta) || undefined,
    sourceRecord: row,
  };
}

function createDemoConfig(): FindYourNameConfigV1 {
  return {
    version: 1,
    campaign: {
      title: 'A Night at the Lantern Market',
      brandName: 'Find Your Name',
    },
    story: {
      title: 'A little wonder is waiting.',
      subtitle: 'Your name is tucked somewhere into this lantern-lit world. Take a closer look and see what the night has saved for you.',
      instructions: 'Move the magnifying glass through the market. Find your name and uncover a few hidden treats along the way.',
      startLabel: 'Find my name',
      completionHeading: 'You found your name!',
      completionMessage: 'The market was full of little secrets — and one of them was yours.',
      challengeHeading: 'Now it’s their turn.',
      challengeMessage: 'Send a little mystery to someone you like. They’ll search for their own name when they arrive.',
      playAgainLabel: 'Play again',
    },
    theme: {
      colors: {
        ink: '#202b26',
        title: '#202b26',
        text: '#202b26',
        muted: '#6d7169',
        paper: '#f4f0e7',
        accent: '#b8533d',
        accentInk: '#fffaf2',
        forest: '#243b34',
        soft: '#eee7d9',
        line: '#ded5c4',
      },
      typography: {
        titleFamily: 'Georgia',
        bodyFamily: 'system-ui',
      },
      buttonRadius: 14,
    },
    scene: {
      backgroundImage: '/images/lantern-market-demo.jpg',
      backgroundColor: '#27342d',
      width: 1586,
      height: 992,
      target: {
        x: 0.5,
        y: 0.38,
        radius: 0.085,
        hint: 'Try the broad, glowing awning at the heart of the market.',
        rotation: -2,
        fontSize: 2.7,
        maxWidth: 0.45,
      },
      hotspots: [
        { productId: 'demo-cocoa', x: 0.81, y: 0.79, radius: 0.095, symbol: '☕', rotation: -8, hint: 'Look around a little table where the market pauses.' },
        { productId: 'demo-preserve', x: 0.93, y: 0.84, radius: 0.09, symbol: '🍊', rotation: 8, hint: 'Something sweet is close to the fruit stall.' },
        { productId: 'demo-tote', x: 0.09, y: 0.88, radius: 0.09, symbol: '✦', rotation: -6, hint: 'Check the baskets and bundles near the old bicycle.' },
      ],
      zoom: 2.05,
      lensSize: 178,
      mobileLensSize: 126,
      difficulty: 'gentle',
      hintButtonLabel: 'A little hint',
      panOnMobile: true,
    },
    productModal: {
      presentation: 'bottom-sheet',
      continueLabel: 'Back to the market',
    },
    sharing: {
      message: 'I found my name in this mystery game! 🎉 Can you find yours? Try it here: {campaign_url}',
      challengeLabel: 'Challenge your friends',
      whatsappLabel: 'WhatsApp',
      copyLabel: 'Copy challenge link',
    },
  };
}

const demoOffers: ProductOffer[] = [
  {
    id: 'demo-cocoa',
    sourceId: 'demo-cocoa',
    title: 'Moonlit Spiced Cocoa',
    description: 'A cozy cup of cocoa with a little cinnamon warmth for the walk home.',
    category: 'A market treat',
    brand: 'Lantern Pantry',
    offerValue: '15% off',
    couponCode: 'NIGHT15',
    ctaLabel: 'Explore the offer',
    ctaUrl: 'https://example.com/',
    sourceRecord: { demo: true },
  },
  {
    id: 'demo-preserve',
    sourceId: 'demo-preserve',
    title: 'Golden Orchard Preserve',
    description: 'A small-batch citrus preserve made for slow breakfasts and warm toast.',
    category: 'A market treat',
    brand: 'Lantern Pantry',
    offerValue: 'A little something extra',
    couponCode: 'ORCHARD10',
    ctaLabel: 'Explore the offer',
    ctaUrl: 'https://example.com/',
    sourceRecord: { demo: true },
  },
  {
    id: 'demo-tote',
    sourceId: 'demo-tote',
    title: 'Market Day Tote',
    description: 'A sturdy canvas carryall for the treasures you find along the way.',
    category: 'A market find',
    brand: 'Lantern Goods',
    offerValue: 'Complimentary gift wrap',
    couponCode: 'MARKETDAY',
    ctaLabel: 'Explore the offer',
    ctaUrl: 'https://example.com/',
    sourceRecord: { demo: true },
  },
];

export function createDemoCampaign(domain = defaultNormalizeHostname()): LoadedCampaign {
  const config = createDemoConfig();
  return {
    id: 'local-preview-only',
    domain,
    title: config.campaign.title ?? 'Find Your Name',
    templateRecord: { demo: true },
    config,
    offers: demoOffers,
    isDemo: true,
  };
}

export class CampaignLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CampaignLoadError';
  }
}

export async function fetchCampaignForCurrentDomain(host?: string): Promise<LoadedCampaign> {
  const platform = getFindYourNamePlatform();
  const explicitlyDemo = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('demo') === '1';
  if (import.meta.env.DEV && (explicitlyDemo || !platform)) return createDemoCampaign(defaultNormalizeHostname(host));

  if (!platform) {
    throw new CampaignLoadError('This template is not connected to the host campaign loader. Register the existing campaign APIs before launching it.');
  }

  const domain = platform.normalizeHostname(host);
  if (!domain) throw new CampaignLoadError('The current domain could not be normalized.');

  // Scheduling, setup status, template ordering and campaign date boundaries
  // remain owned by the platform's existing API, not reimplemented here.
  const [rawTemplate, rawOffers] = await Promise.all([
    platform.fetchActiveCampaignTemplate(domain),
    platform.fetchActiveOffers(domain),
  ]);
  const template = unwrapTemplate(rawTemplate);
  if (!template) {
    throw new CampaignLoadError(`No active campaign template is configured for ${domain}.`);
  }

  const offers = unwrapOffers(rawOffers).map(mapOfferRow).filter((offer): offer is ProductOffer => Boolean(offer));
  const defaultConfig = template.default_config ?? template.defaultConfig ?? template.config;
  const title = firstText(
    template.campaign_title,
    template.title,
    template.name,
    template.template_name,
    record(template.campaign)?.title,
  ) ?? 'Find Your Name';
  let config: FindYourNameConfigV1;
  try {
    config = parseFindYourNameConfig(defaultConfig, offers, title);
  } catch (error) {
    if (error instanceof SceneConfigError) {
      throw new CampaignLoadError(`Campaign setup needs attention: ${error.issues.join(' ')}`);
    }
    throw error;
  }

  const rawCampaignId = template.campaign_id ?? record(template.campaign)?.id ?? record(template.setup)?.campaign_id;
  return {
    id: rawCampaignId === undefined || rawCampaignId === null ? undefined : String(rawCampaignId),
    domain,
    title: config.campaign.title ?? title,
    templateRecord: template,
    config,
    offers,
    isDemo: false,
  };
}
