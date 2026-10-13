export type TrackableEvent =
  | 'rub_started'
  | 'rub_abandoned'
  | 'energy_milestone'
  | 'reveal_shown'
  | 'cta_click'
  | 'coupon_copy'
  | 'share';

export interface ProductOffer {
  /** Normalized ID used by the scene mapping. */
  id: string;
  /** Original campaign/product identifier; do not replace with a display slug. */
  sourceId: unknown;
  title?: string;
  description?: string;
  imageUrl?: string;
  category?: string;
  brand?: string;
  couponCode?: string;
  offerValue?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  /** Original row is retained for a host adapter that needs additional fields. */
  sourceRecord: Record<string, unknown>;
}

export interface NameTargetConfig {
  x: number;
  y: number;
  radius: number;
  hint?: string;
  rotation?: number;
  fontSize?: number;
  maxWidth?: number;
}

export interface ProductHotspotConfig {
  productId: string;
  x: number;
  y: number;
  radius: number;
  hint?: string;
  /** Optional campaign-supplied art that blends with the scene. */
  artworkUrl?: string;
  symbol?: string;
  rotation?: number;
}

export interface FindYourNameConfigV1 {
  version: 1;
  campaign: {
    title?: string;
    brandName?: string;
    logoUrl?: string;
  };
  story: {
    title?: string;
    subtitle?: string;
    instructions?: string;
    startLabel?: string;
    completionHeading?: string;
    completionMessage?: string;
    challengeHeading?: string;
    challengeMessage?: string;
    playAgainLabel?: string;
  };
  theme: {
    colors: {
      ink: string;
      title: string;
      text: string;
      muted: string;
      paper: string;
      accent: string;
      accentInk: string;
      forest: string;
      soft: string;
      line: string;
    };
    typography: {
      titleFamily: string;
      bodyFamily: string;
      googleFontsUrl?: string;
    };
    buttonRadius?: number;
  };
  scene: {
    backgroundImage: string;
    backgroundColor?: string;
    width: number;
    height: number;
    target: NameTargetConfig;
    hotspots: ProductHotspotConfig[];
    zoom: number;
    lensSize: number;
    mobileLensSize: number;
    difficulty?: 'gentle' | 'standard' | 'expert';
    discoveryAnimation?: 'sparkle' | 'pulse' | 'none';
    hintButtonLabel?: string;
    panOnMobile?: boolean;
  };
  productModal?: {
    presentation?: 'centered' | 'bottom-sheet';
    continueLabel?: string;
  };
  sharing?: {
    message?: string;
    canonicalUrl?: string;
    challengeLabel?: string;
    whatsappLabel?: string;
    copyLabel?: string;
  };
}

export interface LoadedCampaign {
  id?: string;
  domain: string;
  title: string;
  templateRecord: Record<string, unknown>;
  config: FindYourNameConfigV1;
  offers: ProductOffer[];
  isDemo: boolean;
}

export interface SearchPoint {
  x: number;
  y: number;
}

export interface SceneMetrics {
  viewportWidth: number;
  viewportHeight: number;
  artLeft: number;
  artTop: number;
  artWidth: number;
  artHeight: number;
  scale: number;
}

export interface AnalyticsContext {
  campaignId?: string;
  offerId?: unknown;
  milestone?: number;
}
