import type {
  FindYourNameConfigV1,
  NameTargetConfig,
  ProductHotspotConfig,
  ProductOffer,
} from '../types';
import { safeColor, safeFontFamily, safeHttpUrl } from '../lib/safeUrls';

export class SceneConfigError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(issues[0] ?? 'The Find Your Name configuration is invalid.');
    this.name = 'SceneConfigError';
    this.issues = issues;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function readNumber(value: unknown, fallback: number): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback;
}

function readRadius(value: unknown, fallback = 0.075): number {
  const parsed = readNumber(value, fallback);
  return Math.min(0.32, Math.max(0.018, parsed));
}

function parseTarget(value: unknown, issues: string[]): NameTargetConfig | undefined {
  if (!isRecord(value)) {
    issues.push('Scene target placement is missing. Add scene.target with normalized x/y coordinates.');
    return undefined;
  }
  const x = Number(value.x);
  const y = Number(value.y);
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 1 || y < 0 || y > 1) {
    issues.push('scene.target.x and scene.target.y must be numbers from 0 to 1.');
    return undefined;
  }
  return {
    x,
    y,
    radius: readRadius(value.radius ?? value.hitRadius),
    hint: readText(value.hint) || undefined,
    rotation: Math.min(45, Math.max(-45, readNumber(value.rotation, 0))),
    fontSize: Math.min(8, Math.max(1, readNumber(value.fontSize, 2.7))),
    maxWidth: Math.min(0.9, Math.max(0.12, readNumber(value.maxWidth, 0.42))),
  };
}

function parseHotspots(value: unknown, offers: ProductOffer[], issues: string[]): ProductHotspotConfig[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    issues.push('scene.hotspots must be an array.');
    return [];
  }
  if (value.length > 48) {
    issues.push('A scene can contain at most 48 product hotspots.');
    return [];
  }

  const offerIds = new Set(offers.map((offer) => offer.id));
  const seen = new Set<string>();
  const hotspots: ProductHotspotConfig[] = [];
  value.forEach((entry, index) => {
    if (!isRecord(entry)) {
      issues.push(`scene.hotspots[${index}] must be an object.`);
      return;
    }
    const productId = entry.productId ?? entry.product_id;
    const id = productId === undefined || productId === null ? '' : String(productId).trim();
    const x = Number(entry.x);
    const y = Number(entry.y);
    if (!id || !Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 1 || y < 0 || y > 1) {
      issues.push(`scene.hotspots[${index}] needs a mapped productId and normalized x/y coordinates.`);
      return;
    }
    if (!offerIds.has(id)) {
      issues.push(`Scene hotspot productId “${id}” does not match an active campaign offer.`);
      return;
    }
    if (seen.has(id)) {
      issues.push(`Product “${id}” is assigned to more than one hotspot.`);
      return;
    }
    seen.add(id);
    const artworkUrl = entry.artworkUrl ?? entry.artwork_url;
    hotspots.push({
      productId: id,
      x,
      y,
      radius: readRadius(entry.radius ?? entry.hitRadius),
      hint: readText(entry.hint) || undefined,
      artworkUrl: safeHttpUrl(artworkUrl) || undefined,
      symbol: readText(entry.symbol).slice(0, 4) || undefined,
      rotation: Math.min(45, Math.max(-45, readNumber(entry.rotation, 0))),
    });
  });
  return hotspots;
}

function parseColors(value: unknown): FindYourNameConfigV1['theme']['colors'] {
  const colors = isRecord(value) ? value : {};
  const ink = safeColor(colors.ink, '#202b26');
  return {
    ink,
    title: safeColor(colors.title, ink),
    text: safeColor(colors.text, ink),
    muted: safeColor(colors.muted, '#6d7169'),
    paper: safeColor(colors.paper, '#f4f0e7'),
    accent: safeColor(colors.accent, '#b8533d'),
    accentInk: safeColor(colors.accentInk ?? colors.accent_ink, '#fffaf2'),
    forest: safeColor(colors.forest, '#243b34'),
    soft: safeColor(colors.soft, '#eee7d9'),
    line: safeColor(colors.line, '#ded5c4'),
  };
}

function parseStory(value: unknown): FindYourNameConfigV1['story'] {
  const story = isRecord(value) ? value : {};
  return {
    title: readText(story.title) || undefined,
    subtitle: readText(story.subtitle) || undefined,
    instructions: readText(story.instructions) || undefined,
    startLabel: readText(story.startLabel ?? story.start_label) || undefined,
    completionHeading: readText(story.completionHeading ?? story.completion_heading) || undefined,
    completionMessage: readText(story.completionMessage ?? story.completion_message) || undefined,
    challengeHeading: readText(story.challengeHeading ?? story.challenge_heading) || undefined,
    challengeMessage: readText(story.challengeMessage ?? story.challenge_message) || undefined,
    playAgainLabel: readText(story.playAgainLabel ?? story.play_again_label) || undefined,
  };
}

export function parseFindYourNameConfig(
  rawDefaultConfig: unknown,
  offers: ProductOffer[],
  campaignTitle = '',
): FindYourNameConfigV1 {
  let parsed: unknown = rawDefaultConfig;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed) as unknown;
    } catch {
      throw new SceneConfigError(['default_config is not valid JSON.']);
    }
  }
  if (!isRecord(parsed)) {
    throw new SceneConfigError(['The active template has no default_config object.']);
  }

  // Namespaced extension keeps other templates' default_config fields intact.
  const raw = isRecord(parsed.findYourName)
    ? parsed.findYourName
    : isRecord(parsed.find_your_name)
      ? parsed.find_your_name
      : parsed;
  const issues: string[] = [];
  if (Number(raw.version) !== 1) {
    issues.push('Unsupported or missing Find Your Name scene version. Use findYourName.version = 1.');
  }
  const scene = isRecord(raw.scene) ? raw.scene : {};
  const campaign = isRecord(raw.campaign) ? raw.campaign : {};
  const theme = isRecord(raw.theme) ? raw.theme : {};
  const typography = isRecord(theme.typography) ? theme.typography : {};
  const target = parseTarget(scene.target ?? raw.target, issues);
  const backgroundValue = scene.backgroundImage ?? scene.background_image ?? raw.backgroundImage;
  const backgroundImage = safeHttpUrl(backgroundValue);
  if (!backgroundImage) issues.push('scene.backgroundImage must be a valid http(s) image URL or a same-origin path.');

  const width = readNumber(scene.width, 1600);
  const height = readNumber(scene.height, 1000);
  if (width < 200 || width > 10000 || height < 200 || height > 10000) {
    issues.push('scene.width and scene.height must be between 200 and 10000 pixels.');
  }
  const hotspots = parseHotspots(scene.hotspots, offers, issues);
  if (issues.length > 0 || !target || !backgroundImage) throw new SceneConfigError(issues);

  const logoUrl = safeHttpUrl(campaign.logoUrl ?? campaign.logo_url);
  const googleFontsUrl = typography.googleFontsUrl ?? typography.google_fonts_url;
  const safeGoogleFontsUrl = typeof googleFontsUrl === 'string' &&
    /^https:\/\/fonts\.googleapis\.com\//i.test(googleFontsUrl)
    ? googleFontsUrl
    : undefined;
  const buttonRadius = Math.min(36, Math.max(6, readNumber(theme.buttonRadius ?? theme.button_radius, 14)));
  const modal = isRecord(raw.productModal ?? raw.product_modal) ? (raw.productModal ?? raw.product_modal) as Record<string, unknown> : {};
  const sharing = isRecord(raw.sharing) ? raw.sharing : {};
  const difficulty = scene.difficulty;

  return {
    version: 1,
    campaign: {
      title: readText(campaign.title) || campaignTitle || undefined,
      brandName: readText(campaign.brandName ?? campaign.brand_name) || undefined,
      logoUrl,
    },
    story: parseStory(raw.story),
    theme: {
      colors: parseColors(theme.colors),
      typography: {
        titleFamily: safeFontFamily(typography.titleFamily ?? typography.title_family, 'Georgia'),
        bodyFamily: safeFontFamily(typography.bodyFamily ?? typography.body_family, 'system-ui'),
        googleFontsUrl: safeGoogleFontsUrl,
      },
      buttonRadius,
    },
    scene: {
      backgroundImage,
      backgroundColor: safeColor(scene.backgroundColor ?? scene.background_color, '#27342d'),
      width,
      height,
      target,
      hotspots,
      zoom: Math.min(3.2, Math.max(1.25, readNumber(scene.zoom, 2.05))),
      lensSize: Math.min(260, Math.max(100, readNumber(scene.lensSize ?? scene.lens_size, 176))),
      mobileLensSize: Math.min(200, Math.max(88, readNumber(scene.mobileLensSize ?? scene.mobile_lens_size, 132))),
      difficulty: difficulty === 'gentle' || difficulty === 'expert' ? difficulty : 'standard',
      discoveryAnimation: scene.discoveryAnimation === 'none' || scene.discoveryAnimation === 'pulse' ? scene.discoveryAnimation : 'sparkle',
      hintButtonLabel: readText(scene.hintButtonLabel ?? scene.hint_button_label) || undefined,
      panOnMobile: scene.panOnMobile === undefined ? true : Boolean(scene.panOnMobile),
    },
    productModal: {
      presentation: modal.presentation === 'centered' ? 'centered' : 'bottom-sheet',
      continueLabel: readText(modal.continueLabel ?? modal.continue_label) || undefined,
    },
    sharing: {
      message: readText(sharing.message) || undefined,
      canonicalUrl: readText(sharing.canonicalUrl ?? sharing.canonical_url) || undefined,
      challengeLabel: readText(sharing.challengeLabel ?? sharing.challenge_label) || undefined,
      whatsappLabel: readText(sharing.whatsappLabel ?? sharing.whatsapp_label) || undefined,
      copyLabel: readText(sharing.copyLabel ?? sharing.copy_label) || undefined,
    },
  };
}
