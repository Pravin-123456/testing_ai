import type { AnalyticsContext, TrackableEvent } from '../types';
import { getFindYourNamePlatform } from './platform';

/**
 * Fire-and-forget adapter. It never receives a visitor name, and the host owns
 * event serialization so the template cannot accidentally drift from the
 * platform's existing analytics payload schema.
 */
export function trackCampaignEvent(
  event: TrackableEvent,
  context: AnalyticsContext = {},
): void {
  const platform = getFindYourNamePlatform();
  if (!platform) return;

  try {
    const payload = platform.createAnalyticsPayload(event, context);
    if (payload === undefined || payload === null) return;
    void Promise.resolve(platform.trackEvent(payload)).catch((error: unknown) => {
      if (import.meta.env.DEV) console.warn(`[Find Your Name] ${event} analytics failed`, error);
    });
  } catch (error) {
    if (import.meta.env.DEV) console.warn(`[Find Your Name] ${event} analytics failed`, error);
  }
}
