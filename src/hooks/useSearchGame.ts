import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AnalyticsContext, FindYourNameConfigV1, ProductOffer, SceneMetrics, SearchPoint, TrackableEvent } from '../types';
import { trackCampaignEvent } from '../lib/analyticsAdapter';
import { copyText } from '../lib/sharing';
import { findSearchHit } from '../game/searchEngine';

interface UseSearchGameOptions {
  campaignId?: string;
  config: FindYourNameConfigV1;
  offers: ProductOffer[];
  onNameFound: () => void;
}

export function useSearchGame({ campaignId, config, offers, onNameFound }: UseSearchGameOptions) {
  const [discoveredIds, setDiscoveredIds] = useState<string[]>([]);
  const [activeOffer, setActiveOffer] = useState<ProductOffer | null>(null);
  const discoveredRef = useRef(new Set<string>());
  const nameFoundRef = useRef(false);
  const startedRef = useRef(false);
  const abandonedRef = useRef(false);
  const activeOfferRef = useRef<ProductOffer | null>(null);
  const eventLedgerRef = useRef(new Set<string>());
  const offersById = useMemo(() => new Map(offers.map((offer) => [offer.id, offer])), [offers]);
  const context = useMemo<AnalyticsContext>(() => ({ campaignId }), [campaignId]);

  const emitOnce = useCallback((key: string, event: TrackableEvent, extra: AnalyticsContext = {}) => {
    if (eventLedgerRef.current.has(key)) return;
    eventLedgerRef.current.add(key);
    trackCampaignEvent(event, { ...context, ...extra });
  }, [context]);

  const start = useCallback(() => {
    discoveredRef.current = new Set();
    nameFoundRef.current = false;
    startedRef.current = true;
    abandonedRef.current = false;
    activeOfferRef.current = null;
    eventLedgerRef.current = new Set();
    setDiscoveredIds([]);
    setActiveOffer(null);
    emitOnce('session-started', 'rub_started');
  }, [emitOnce]);

  const abandon = useCallback(() => {
    if (!startedRef.current || nameFoundRef.current || abandonedRef.current) return;
    abandonedRef.current = true;
    startedRef.current = false;
    emitOnce('session-abandoned', 'rub_abandoned');
  }, [emitOnce]);

  const updateProgress = useCallback((nextIds: string[]) => {
    const total = config.scene.hotspots.length;
    if (total === 0) return;
    const count = nextIds.length;
    const milestoneCounts = Array.from(new Set([
      Math.ceil(total * 0.25),
      Math.ceil(total * 0.5),
      Math.ceil(total * 0.75),
      total,
    ])).filter((milestoneCount) => milestoneCount > 0);
    for (const milestoneCount of milestoneCounts) {
      if (count >= milestoneCount) {
        const percentage = Math.round((milestoneCount / total) * 100);
        emitOnce(`energy-${percentage}`, 'energy_milestone', { milestone: percentage });
      }
    }
  }, [config.scene.hotspots.length, emitOnce]);

  const handlePointerPoint = useCallback((point: SearchPoint, metrics: SceneMetrics, lensRadiusPx = 0) => {
    if (!startedRef.current || nameFoundRef.current || activeOfferRef.current) return;
    const hit = findSearchHit(point, metrics, config, discoveredRef.current, lensRadiusPx);
    if (!hit) return;
    if (hit.type === 'name') {
      nameFoundRef.current = true;
      startedRef.current = false;
      onNameFound();
      return;
    }
    const offer = offersById.get(hit.hotspot.productId);
    if (!offer || discoveredRef.current.has(offer.id)) return;
    discoveredRef.current.add(offer.id);
    activeOfferRef.current = offer;
    const nextIds = Array.from(discoveredRef.current);
    setDiscoveredIds(nextIds);
    setActiveOffer(offer);
    emitOnce(`reveal-${offer.id}`, 'reveal_shown', { offerId: offer.sourceId });
    updateProgress(nextIds);
  }, [config, emitOnce, offersById, onNameFound, updateProgress]);

  const closeOffer = useCallback(() => {
    activeOfferRef.current = null;
    setActiveOffer(null);
  }, []);

  const reset = useCallback(() => {
    startedRef.current = false;
    abandonedRef.current = false;
    nameFoundRef.current = false;
    activeOfferRef.current = null;
    discoveredRef.current = new Set();
    setDiscoveredIds([]);
    setActiveOffer(null);
  }, []);

  const trackOfferCta = useCallback((offer: ProductOffer) => {
    trackCampaignEvent('cta_click', { ...context, offerId: offer.sourceId });
  }, [context]);

  const copyCoupon = useCallback(async (offer: ProductOffer) => {
    if (!offer.couponCode) return false;
    try {
      await copyText(offer.couponCode);
      trackCampaignEvent('coupon_copy', { ...context, offerId: offer.sourceId });
      return true;
    } catch (error) {
      if (import.meta.env.DEV) console.warn('[Find Your Name] Coupon copy failed', error);
      return false;
    }
  }, [context]);

  const trackShare = useCallback(() => {
    trackCampaignEvent('share', context);
  }, [context]);

  useEffect(() => {
    const handlePageHide = () => {
      if (!startedRef.current || nameFoundRef.current || abandonedRef.current) return;
      abandonedRef.current = true;
      startedRef.current = false;
      emitOnce('session-abandoned', 'rub_abandoned');
    };
    window.addEventListener('pagehide', handlePageHide);
    return () => window.removeEventListener('pagehide', handlePageHide);
  }, [emitOnce]);

  return {
    discoveredIds,
    activeOffer,
    handlePointerPoint,
    start,
    abandon,
    reset,
    closeOffer,
    trackOfferCta,
    copyCoupon,
    trackShare,
  };
}
