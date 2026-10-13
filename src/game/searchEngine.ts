import type { FindYourNameConfigV1, ProductHotspotConfig, SceneMetrics, SearchPoint } from '../types';

export function calculateSceneMetrics(
  viewportWidth: number,
  viewportHeight: number,
  sceneWidth: number,
  sceneHeight: number,
  panX = 0,
  panY = 0,
): SceneMetrics {
  const safeWidth = Math.max(1, viewportWidth);
  const safeHeight = Math.max(1, viewportHeight);
  const scale = Math.max(safeWidth / sceneWidth, safeHeight / sceneHeight);
  const artWidth = sceneWidth * scale;
  const artHeight = sceneHeight * scale;
  return {
    viewportWidth: safeWidth,
    viewportHeight: safeHeight,
    artWidth,
    artHeight,
    artLeft: (safeWidth - artWidth) / 2 + panX,
    artTop: (safeHeight - artHeight) / 2 + panY,
    scale,
  };
}

export function clampPan(
  requestedX: number,
  requestedY: number,
  metrics: SceneMetrics,
): SearchPoint {
  const maxX = Math.max(0, (metrics.artWidth - metrics.viewportWidth) / 2);
  const maxY = Math.max(0, (metrics.artHeight - metrics.viewportHeight) / 2);
  return {
    x: Math.max(-maxX, Math.min(maxX, requestedX)),
    y: Math.max(-maxY, Math.min(maxY, requestedY)),
  };
}

function withinRadius(
  point: SearchPoint,
  normalizedX: number,
  normalizedY: number,
  radius: number,
  metrics: SceneMetrics,
  extraHitRadiusPx = 0,
): boolean {
  const x = normalizedX * metrics.artWidth + metrics.artLeft;
  const y = normalizedY * metrics.artHeight + metrics.artTop;
  const tolerance = radius * Math.min(metrics.artWidth, metrics.artHeight) + extraHitRadiusPx;
  return Math.hypot(point.x - x, point.y - y) <= tolerance;
}

export type SearchHit =
  | { type: 'name' }
  | { type: 'product'; hotspot: ProductHotspotConfig }
  | undefined;

/** Pure, normalized hit test; visual styling/artwork is intentionally separate. */
export function findSearchHit(
  point: SearchPoint,
  metrics: SceneMetrics,
  config: FindYourNameConfigV1,
  discoveredIds: ReadonlySet<string>,
  lensRadiusPx = 0,
): SearchHit {
  const radiusFactor = config.scene.difficulty === 'gentle' ? 1.24 : config.scene.difficulty === 'expert' ? 0.82 : 1;
  const lensFactor = config.scene.difficulty === 'gentle' ? 0.72 : config.scene.difficulty === 'expert' ? 0.46 : 0.6;
  if (withinRadius(point, config.scene.target.x, config.scene.target.y, config.scene.target.radius * radiusFactor, metrics, lensRadiusPx * lensFactor)) {
    return { type: 'name' };
  }
  for (const hotspot of config.scene.hotspots) {
    if (discoveredIds.has(hotspot.productId)) continue;
    if (withinRadius(point, hotspot.x, hotspot.y, hotspot.radius * radiusFactor, metrics, lensRadiusPx * lensFactor)) {
      return { type: 'product', hotspot };
    }
  }
  return undefined;
}
