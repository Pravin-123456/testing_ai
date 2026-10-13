import { memo, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent, type KeyboardEvent } from 'react';
import type { FindYourNameConfigV1, ProductHotspotConfig, SceneMetrics, SearchPoint } from '../types';
import { calculateSceneMetrics, clampPan } from '../game/searchEngine';
import { Icon } from './Icon';

interface SearchSceneProps {
  config: FindYourNameConfigV1;
  targetName: string;
  discoveredIds: string[];
  onExplore: (point: SearchPoint, metrics: SceneMetrics, lensRadiusPx?: number) => void;
  onHint?: (hint: string) => void;
}

const SceneArtwork = memo(function SceneArtwork({
  config,
  targetName,
  discoveredIds,
  metrics,
  isMagnified = false,
}: {
  config: FindYourNameConfigV1;
  targetName: string;
  discoveredIds: string[];
  metrics: SceneMetrics;
  isMagnified?: boolean;
}) {
  const target = config.scene.target;
  const artStyle: CSSProperties = {
    width: metrics.artWidth,
    height: metrics.artHeight,
    left: metrics.artLeft,
    top: metrics.artTop,
    backgroundColor: config.scene.backgroundColor,
  };
  const targetFontSize = Math.max(
    1.35,
    (target.fontSize ?? 2.7) * Math.min(1, 18 / Math.max(18, Array.from(targetName).length)),
  );
  const targetStyle: CSSProperties = {
    left: `${target.x * 100}%`,
    top: `${target.y * 100}%`,
    width: `${(target.maxWidth ?? 0.42) * 100}%`,
    transform: `translate(-50%, -50%) rotate(${target.rotation ?? 0}deg)`,
    fontSize: `${targetFontSize}cqw`,
  };

  return (
    <div className={`scene-artwork${isMagnified ? ' scene-artwork-magnified' : ''}`} style={artStyle}>
      <img className="scene-art-image" src={config.scene.backgroundImage} alt="" draggable={false} />
      <div className="scene-grain" aria-hidden="true" />
      <div className="scene-name-target" style={targetStyle} aria-hidden="true">
        <span>{targetName}</span>
      </div>
      {config.scene.hotspots.map((hotspot: ProductHotspotConfig) => {
        const found = discoveredIds.includes(hotspot.productId);
        return (
          <div
            key={hotspot.productId}
            className={`scene-hidden-object${found ? ` is-found is-animation-${config.scene.discoveryAnimation || 'sparkle'}` : ''}`}
            style={{
              left: `${hotspot.x * 100}%`,
              top: `${hotspot.y * 100}%`,
              transform: `translate(-50%, -50%) rotate(${hotspot.rotation ?? 0}deg)`,
            }}
            aria-hidden="true"
          >
            {hotspot.artworkUrl ? (
              <img src={hotspot.artworkUrl} alt="" draggable={false} />
            ) : (
              <span>{hotspot.symbol || '✦'}</span>
            )}
            {found && config.scene.discoveryAnimation !== 'none' && <i className="found-orbit" />}
          </div>
        );
      })}
      <div className="scene-edge-light" aria-hidden="true" />
    </div>
  );
});

export function SearchScene({ config, targetName, discoveredIds, onExplore, onHint }: SearchSceneProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const pointerDownRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const queuedExploreRef = useRef<{ point: SearchPoint; metrics: SceneMetrics; radius: number } | null>(null);
  const lensFrameRef = useRef<number | null>(null);
  const keyboardPointRef = useRef<SearchPoint | null>(null);
  const touchSearchingRef = useRef(false);
  const [viewport, setViewport] = useState({ width: 800, height: 500 });
  const [lensPoint, setLensPoint] = useState<SearchPoint>({ x: 0, y: 0 });
  const [lensVisible, setLensVisible] = useState(false);
  const [pan, setPan] = useState<SearchPoint>({ x: 0, y: 0 });
  const [panMode, setPanMode] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const [visibleHint, setVisibleHint] = useState('');

  const baseMetrics = useMemo(
    () => calculateSceneMetrics(viewport.width, viewport.height, config.scene.width, config.scene.height),
    [config.scene.height, config.scene.width, viewport.height, viewport.width],
  );
  const metrics = useMemo(
    () => calculateSceneMetrics(viewport.width, viewport.height, config.scene.width, config.scene.height, pan.x, pan.y),
    [config.scene.height, config.scene.width, pan.x, pan.y, viewport.height, viewport.width],
  );

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;
    const update = () => {
      const rect = element.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setViewport((previous) => previous.width === rect.width && previous.height === rect.height
          ? previous
          : { width: rect.width, height: rect.height });
      }
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setPan((previous) => clampPan(previous.x, previous.y, baseMetrics));
  }, [baseMetrics]);

  useEffect(() => () => {
    if (lensFrameRef.current !== null) window.cancelAnimationFrame(lensFrameRef.current);
  }, []);

  const localPoint = useCallback((event: PointerEvent<HTMLDivElement>): SearchPoint => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: Math.max(0, Math.min(rect.width, event.clientX - rect.left)),
      y: Math.max(0, Math.min(rect.height, event.clientY - rect.top)),
    };
  }, []);

  const queueExplore = useCallback((point: SearchPoint, currentMetrics: SceneMetrics, radius: number) => {
    queuedExploreRef.current = { point, metrics: currentMetrics, radius };
    if (lensFrameRef.current !== null) return;
    lensFrameRef.current = window.requestAnimationFrame(() => {
      lensFrameRef.current = null;
      const queued = queuedExploreRef.current;
      if (!queued) return;
      setLensPoint(queued.point);
      setLensVisible(true);
      onExplore(queued.point, queued.metrics, queued.radius);
    });
  }, [onExplore]);

  const moveLens = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const point = localPoint(event);
    const currentMetrics = calculateSceneMetrics(
      viewport.width,
      viewport.height,
      config.scene.width,
      config.scene.height,
      pan.x,
      pan.y,
    );
    const currentLensSize = viewport.width < 560 ? config.scene.mobileLensSize : config.scene.lensSize;
    queueExplore(point, currentMetrics, currentLensSize / 2);
  }, [config.scene.height, config.scene.lensSize, config.scene.mobileLensSize, config.scene.width, localPoint, pan.x, pan.y, queueExplore, viewport.height, viewport.width]);

  const onPointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (panMode) {
      event.currentTarget.setPointerCapture(event.pointerId);
      const point = localPoint(event);
      pointerDownRef.current = { x: point.x, y: point.y, panX: pan.x, panY: pan.y };
      touchSearchingRef.current = false;
      return;
    }
    if (event.pointerType === 'mouse') return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = localPoint(event);
    pointerDownRef.current = { x: point.x, y: point.y, panX: pan.x, panY: pan.y };
    touchSearchingRef.current = true;
    moveLens(event);
  }, [localPoint, moveLens, pan.x, pan.y, panMode]);

  const onPointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (panMode) {
      if (pointerDownRef.current) {
        const point = localPoint(event);
        const start = pointerDownRef.current;
        const desired = { x: start.panX + point.x - start.x, y: start.panY + point.y - start.y };
        setPan(clampPan(desired.x, desired.y, baseMetrics));
      }
      return;
    }
    if (event.pointerType === 'mouse' || touchSearchingRef.current) moveLens(event);
  }, [baseMetrics, localPoint, moveLens, panMode]);

  const onPointerUp = useCallback((event: PointerEvent<HTMLDivElement>) => {
    pointerDownRef.current = null;
    touchSearchingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  const onKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    const vector: Record<string, SearchPoint> = {
      ArrowLeft: { x: -24, y: 0 },
      ArrowRight: { x: 24, y: 0 },
      ArrowUp: { x: 0, y: -24 },
      ArrowDown: { x: 0, y: 24 },
    };
    const step = vector[event.key];
    if (!step) return;
    event.preventDefault();
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;
    const previous = keyboardPointRef.current ?? { x: rect.width / 2, y: rect.height / 2 };
    const point = {
      x: Math.max(0, Math.min(rect.width, previous.x + step.x)),
      y: Math.max(0, Math.min(rect.height, previous.y + step.y)),
    };
    keyboardPointRef.current = point;
    const currentLensSize = viewport.width < 560 ? config.scene.mobileLensSize : config.scene.lensSize;
    queueExplore(point, metrics, currentLensSize / 2);
  }, [config.scene.lensSize, config.scene.mobileLensSize, metrics, queueExplore, viewport.width]);
  const hintOptions = [
    config.scene.target.hint,
    ...config.scene.hotspots
      .filter((hotspot) => !discoveredIds.includes(hotspot.productId))
      .map((hotspot) => hotspot.hint),
  ].filter((entry): entry is string => Boolean(entry));
  const hint = hintOptions.length > 0
    ? hintOptions[hintIndex % hintOptions.length]
    : 'Look closely where the warm light gathers.';
  const lensSize = viewport.width < 560 ? config.scene.mobileLensSize : config.scene.lensSize;
  const clippedLensStyle: CSSProperties = {
    clipPath: `circle(${lensSize / 2}px at ${lensPoint.x}px ${lensPoint.y}px)`,
    WebkitClipPath: `circle(${lensSize / 2}px at ${lensPoint.x}px ${lensPoint.y}px)`,
  };
  const zoomStyle: CSSProperties = {
    transform: `scale(${config.scene.zoom})`,
    transformOrigin: `${lensPoint.x}px ${lensPoint.y}px`,
  };
  const lensFrameStyle: CSSProperties = {
    left: lensPoint.x,
    top: lensPoint.y,
    width: lensSize,
    height: lensSize,
  };
  const sceneStyle = {
    '--lens-size': `${lensSize}px`,
    '--scene-ratio': `${config.scene.width} / ${config.scene.height}`,
  } as CSSProperties;

  const panAvailable = viewport.width >= 560 || config.scene.panOnMobile;

  return (
    <div className={`search-scene-shell${panMode ? ' is-pan-mode' : ''}${viewport.width < 560 && !config.scene.panOnMobile ? ' pan-disabled' : ''}`}>
      <div className="scene-toolbar">
        <div className="scene-guidance">
          <span className="guidance-icon"><Icon name={panMode ? 'hand' : 'search'} size={15} /></span>
          <span>{panMode ? 'Drag to move around the market' : 'Move the glass slowly through the scene'}</span>
        </div>
        <div className="scene-tools">
          {panAvailable && (
            <button
              className={`scene-tool-button${panMode ? ' is-active' : ''}`}
              type="button"
              onClick={() => setPanMode((current) => !current)}
              aria-pressed={panMode}
              aria-label={panMode ? 'Switch to magnifying mode' : 'Pan around the scene'}
            >
              <Icon name={panMode ? 'search' : 'hand'} size={16} />
              <span>{panMode ? 'Search' : 'Move scene'}</span>
            </button>
          )}
          <button
            className={`scene-tool-button${hintVisible ? ' is-active' : ''}`}
            type="button"
            onClick={() => {
              if (hintVisible) {
                setHintVisible(false);
                return;
              }
              const selectedHint = hintOptions.length > 0
                ? hintOptions[hintIndex % hintOptions.length]
                : 'Look closely where the warm light gathers.';
              setHintIndex((index) => index + 1);
              setVisibleHint(selectedHint);
              setHintVisible(true);
              onHint?.(selectedHint);
            }}
            aria-expanded={hintVisible}
            aria-label={hintVisible ? 'Hide hint' : config.scene.hintButtonLabel || 'Get a hint'}
          >
            <Icon name="lightbulb" size={16} />
            <span>{hintVisible ? 'Hide hint' : config.scene.hintButtonLabel || 'A little hint'}</span>
          </button>
        </div>
      </div>
      {hintVisible && <p className="scene-hint" role="status"><Icon name="sparkle" size={15} />{visibleHint || hint}</p>}
      <div
        className="scene-viewport"
        ref={viewportRef}
        style={sceneStyle}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        tabIndex={0}
        role="group"
        aria-label={`Search scene for ${targetName}. Use the arrow keys to move the magnifying glass.`}
      >
        <SceneArtwork config={config} targetName={targetName} discoveredIds={discoveredIds} metrics={metrics} />
        {lensVisible && !panMode && (
          <div className="magnification-layer" style={clippedLensStyle} aria-hidden="true">
            <div className="magnification-zoom" style={zoomStyle}>
              <SceneArtwork config={config} targetName={targetName} discoveredIds={discoveredIds} metrics={metrics} isMagnified />
            </div>
          </div>
        )}
        {lensVisible && !panMode && (
          <div className="magnifier-lens" style={lensFrameStyle} aria-hidden="true">
            <div className="magnifier-handle" />
            <div className="lens-highlight" />
          </div>
        )}
        <div className="scene-vignette" aria-hidden="true" />
      </div>
      <div className="scene-caption-row">
        <span><Icon name="info" size={15} /> Your name is softly hidden in the illustration.</span>
        <span className="keyboard-cue">Tip: use ← ↑ → ↓ when the scene is focused</span>
      </div>
    </div>
  );
}

