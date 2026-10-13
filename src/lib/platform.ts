import type { AnalyticsContext, TrackableEvent } from '../types';

/**
 * Narrow adapter around the APIs already owned by the Surprise Campaign host.
 * The host registers its existing functions before mounting this template.
 * Raw database row types intentionally remain unknown because no host schema or
 * API implementation was present in this repository checkout.
 */
export interface ExistingCampaignPlatform {
  normalizeHostname: (host?: string) => string;
  fetchActiveCampaignTemplate: (domain?: string) => Promise<unknown>;
  fetchActiveOffers: (domain?: string) => Promise<unknown>;
  /** Existing analytics API; payload construction belongs to the host. */
  trackEvent: (payload: unknown) => Promise<unknown> | unknown;
  /** Adapts a supported event to the host's established payload/schema. */
  createAnalyticsPayload: (event: TrackableEvent, context?: AnalyticsContext) => unknown;
}

declare global {
  interface Window {
    __FIND_YOUR_NAME_PLATFORM__?: ExistingCampaignPlatform;
  }
}

let registeredPlatform: ExistingCampaignPlatform | undefined;

export function registerFindYourNamePlatform(platform: ExistingCampaignPlatform): void {
  registeredPlatform = platform;
}

export function getFindYourNamePlatform(): ExistingCampaignPlatform | undefined {
  return registeredPlatform ?? window.__FIND_YOUR_NAME_PLATFORM__;
}

export function defaultNormalizeHostname(host?: string): string {
  const candidate = host?.trim() || (typeof window !== 'undefined' ? window.location.hostname : '');
  if (!candidate) return '';

  try {
    const parsed = new URL(candidate.includes('://') ? candidate : `https://${candidate}`);
    return parsed.hostname.toLowerCase().replace(/^www\./, '').replace(/\.$/, '');
  } catch {
    return candidate.toLowerCase().replace(/^www\./, '').replace(/:\d+$/, '').replace(/\.$/, '');
  }
}
