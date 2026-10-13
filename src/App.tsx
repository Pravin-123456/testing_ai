import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import type { LoadedCampaign, ProductOffer } from './types';
import { CampaignLoader } from './components/CampaignLoader';
import { BrandMark } from './components/BrandMark';

import { NameEntryModal } from './components/NameEntryModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { SearchScene } from './components/SearchScene';
import { ProductRevealModal } from './components/ProductRevealModal';
import { VictoryScreen } from './components/VictoryScreen';
import { ChallengeFriendsScreen } from './components/ChallengeFriendsScreen';
import { Icon } from './components/Icon';
import { useSearchGame } from './hooks/useSearchGame';
import { buildShareContent, copyText } from './lib/sharing';
import { safeHttpUrl } from './lib/safeUrls';

export function App() {
  return (
    <CampaignLoader>
      {(campaign) => <CampaignExperience campaign={campaign} />}
    </CampaignLoader>
  );
}

function CampaignExperience({ campaign }: { campaign: LoadedCampaign }) {
  const { config } = campaign;
  const [phase, setPhase] = useState<'landing' | 'search' | 'victory' | 'challenge'>('landing');
  const [nameEntryOpen, setNameEntryOpen] = useState(false);
  const [howToPlayOpen, setHowToPlayOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [shareStatus, setShareStatus] = useState('');

  const onNameFound = useCallback(() => setPhase('victory'), []);
  const game = useSearchGame({
    campaignId: campaign.id,
    config,
    offers: campaign.offers,
    onNameFound,
  });
  const shareContent = useMemo(() => buildShareContent(config), [config]);
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  useEffect(() => {
    document.title = config.campaign.title ? `${config.campaign.title} · Find Your Name` : 'Find Your Name';
  }, [config.campaign.title]);

  useEffect(() => {
    const url = config.theme.typography.googleFontsUrl;
    if (!url) return;
    const existing = document.querySelector<HTMLLinkElement>('link[data-campaign-fonts="true"]');
    const link = existing ?? document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.dataset.campaignFonts = 'true';
    if (!existing) document.head.append(link);
    return () => {
      if (!existing) link.remove();
    };
  }, [config.theme.typography.googleFontsUrl]);

  const themeStyle = {
    '--color-ink': config.theme.colors.ink,
    '--color-title': config.theme.colors.title,
    '--color-text': config.theme.colors.text,
    '--color-muted': config.theme.colors.muted,
    '--color-paper': config.theme.colors.paper,
    '--color-accent': config.theme.colors.accent,
    '--color-accent-ink': config.theme.colors.accentInk,
    '--color-forest': config.theme.colors.forest,
    '--color-soft': config.theme.colors.soft,
    '--color-line': config.theme.colors.line,
    '--font-title': `"${config.theme.typography.titleFamily}", Georgia, serif`,
    '--font-body': `"${config.theme.typography.bodyFamily}", system-ui, sans-serif`,
    '--button-radius': `${config.theme.buttonRadius ?? 14}px`,
  } as CSSProperties;

  const openNameEntry = useCallback(() => setNameEntryOpen(true), []);
  const closeNameEntry = useCallback(() => setNameEntryOpen(false), []);
  const closeHowToPlay = useCallback(() => setHowToPlayOpen(false), []);
  const closeProduct = game.closeOffer;

  const beginSearch = useCallback((name: string) => {
    const normalizedName = name.trim();
    if (!normalizedName) return;
    setVisitorName(normalizedName);
    setNameEntryOpen(false);
    setShareStatus('');
    game.start();
    setPhase('search');
  }, [game]);

  const exitSearch = useCallback(() => {
    game.abandon();
    game.reset();
    setVisitorName('');
    setNameDraft('');
    setPhase('landing');
  }, [game]);

  const playAgain = useCallback(() => {
    game.reset();
    setVisitorName('');
    setNameDraft('');
    setShareStatus('');
    setNameEntryOpen(false);
    setHowToPlayOpen(false);
    setPhase('landing');
  }, [game]);

  const copyChallengeLink = useCallback(async (recordShare = true) => {
    if (recordShare) game.trackShare();
    try {
      await copyText(shareContent.url);
      setShareStatus('Challenge link copied. It’s ready to send to a friend.');
    } catch {
      setShareStatus('The link could not be copied here. You can select it from the message preview above.');
    }
  }, [game, shareContent.url]);

  const shareChallenge = useCallback(async () => {
    game.trackShare();
    if (!canNativeShare) {
      await copyChallengeLink(false);
      return;
    }
    const messageWithoutUrl = shareContent.message.replace(shareContent.url, '').trim();
    try {
      const shareData: ShareData = {
        title: shareContent.title,
        text: messageWithoutUrl || shareContent.title,
        url: shareContent.url,
      };
      if (navigator.canShare && !navigator.canShare(shareData)) {
        await copyChallengeLink(false);
        return;
      }
      await navigator.share(shareData);
      setShareStatus('Share sheet closed. Thank you for passing the mystery along.');
    } catch (error) {
      const name = error instanceof Error ? error.name : '';
      if (name === 'AbortError') {
        setShareStatus('Share sheet closed. Your challenge link is still ready below.');
      } else {
        setShareStatus('Sharing is not available right now. Choose WhatsApp or copy the link instead.');
      }
    }
  }, [canNativeShare, copyChallengeLink, game, shareContent]);

  const onWhatsAppClick = useCallback(() => {
    game.trackShare();
    setShareStatus('WhatsApp share text prepared. Review it before sending.');
  }, [game]);

  const openChallenge = useCallback(() => {
    setShareStatus('');
    setPhase('challenge');
  }, []);

  const foundOffers = campaign.offers.filter((offer) => game.discoveredIds.includes(offer.id));
  const discoveredTotal = game.discoveredIds.length;
  const totalHotspots = config.scene.hotspots.length;
  const imageUrl = safeHttpUrl(config.scene.backgroundImage);

  return (
    <div className={`app-shell${campaign.isDemo ? ' is-demo' : ''}`} style={themeStyle}>
      {campaign.isDemo && (
        <div className="demo-ribbon"><span>Local preview</span><i /> Sample campaign content · not connected to live offers</div>
      )}

      {phase === 'landing' && (
        <>
          <header className="site-header">
            <BrandMark config={config} />
            <div className="landing-header-center">{config.campaign.title || campaign.title}</div>
            <button className="header-howto" type="button" onClick={() => setHowToPlayOpen(true)}>
              <span className="howto-dot"><Icon name="lightbulb" size={15} /></span> How to play
            </button>
          </header>
          <main className="landing-page">
            <section className="landing-hero" aria-labelledby="landing-title">
              {imageUrl && <img className="landing-art" src={imageUrl} alt="" fetchPriority="high" />}
              <div className="landing-overlay" />
              <div className="landing-content">
                <span className="landing-overline"><i /> An illustrated little escape <i /></span>
                <h1 id="landing-title">{config.story.title || 'A little wonder is waiting.'}</h1>
                <p className="landing-subtitle">{config.story.subtitle || 'Your name is hiding somewhere in this world. Take a closer look and see if you can find it.'}</p>
                <button className="button button-primary landing-cta" type="button" onClick={openNameEntry}>
                  {config.story.startLabel || 'Find my name'} <span className="button-arrow"><Icon name="arrow" size={19} /></span>
                </button>
                <div className="landing-privacy"><span><Icon name="search" size={15} /> A name-finding adventure</span><i /> <span>About 2 minutes</span></div>
              </div>
              <div className="landing-scene-note"><span className="scene-note-star"><Icon name="sparkle" size={15} /></span><span>Somewhere in here,<br />a name is waiting.</span></div>
              <div className="landing-index">01 <span>/</span> 04</div>
            </section>
            <section className="landing-underbar" aria-label="How the game works">
              <div className="underbar-step"><span>01</span><p>Tell us who to find</p></div>
              <div className="underbar-divider" />
              <div className="underbar-step"><span>02</span><p>Explore with your lens</p></div>
              <div className="underbar-divider" />
              <div className="underbar-step"><span>03</span><p>Send the mystery to a friend</p></div>
              <button className="underbar-link" type="button" onClick={() => setHowToPlayOpen(true)}>How it works <Icon name="arrow-up-right" size={15} /></button>
            </section>
          </main>
        </>
      )}

      {phase === 'search' && (
        <>
          <header className="game-header">
            <BrandMark config={config} compact />
            <div className="game-target-chip">
              <span>Looking for</span><strong>{visitorName}</strong>
            </div>
            <div className="game-header-actions">
              <button className="icon-text-button" type="button" onClick={() => setHowToPlayOpen(true)}><Icon name="info" size={16} /><span>How to play</span></button>
              <button className="icon-text-button leave-button" type="button" onClick={exitSearch}><Icon name="arrow-left" size={16} /><span>Take a break</span></button>
            </div>
          </header>
          <main className="game-page">
            <div className="game-intro-row">
              <div className="game-intro-copy">
                <p className="eyebrow"><span className="eyebrow-flower"><Icon name="sparkle" size={13} /></span> A quiet search in {config.campaign.title || campaign.title}</p>
                <h1>Look a little closer.</h1>
                <p className="game-intro-text">The market keeps its best things in the details. Let the glass lead you.</p>
              </div>
              <div className="game-progress-card" aria-label={`${discoveredTotal} of ${totalHotspots} hidden products found`}>
                <div className="progress-card-top"><span>Little finds</span><strong><b>{String(discoveredTotal).padStart(2, '0')}</b><i>/</i>{String(totalHotspots).padStart(2, '0')}</strong></div>
                <div className="progress-track"><span style={{ width: `${totalHotspots ? Math.min(100, (discoveredTotal / totalHotspots) * 100) : 0}%` }} /></div>
                <span className="progress-card-caption">Your name is the real treasure.</span>
              </div>
            </div>
            <div className="game-layout">
              <div className="game-board">
                <SearchScene
                  config={config}
                  targetName={visitorName}
                  discoveredIds={game.discoveredIds}
                  onExplore={game.handlePointerPoint}
                />
              </div>
              <aside className="game-sidebar" aria-label="Search progress">
                <section className="sidebar-card mystery-card">
                  <div className="sidebar-card-head"><span className="sidebar-icon"><Icon name="compass" size={18} /></span><span className="eyebrow">Tonight’s mystery</span></div>
                  <h2>Can you spot<br />your name?</h2>
                  <p>It’s woven into the market, just waiting for a closer look.</p>
                  <div className="search-target-note"><span>Search for</span><strong>{visitorName}</strong><Icon name="sparkle" size={16} /></div>
                </section>
                <section className="sidebar-card discoveries-card">
                  <div className="found-list-heading"><div><span className="eyebrow">Along the way</span><h3>Little discoveries</h3></div><span className="found-count">{discoveredTotal}</span></div>
                  {foundOffers.length === 0 ? (
                    <div className="empty-finds">
                      <span className="empty-finds-icon"><Icon name="gift" size={20} /></span>
                      <p>The market is full of small surprises. Your first find is out there.</p>
                    </div>
                  ) : (
                    <ul className="found-offer-list">
                      {foundOffers.map((offer: ProductOffer) => (
                        <li key={offer.id}>
                          <span className="found-check"><Icon name="check" size={13} /></span>
                          <span><strong>{offer.title || 'A hidden find'}</strong><small>{offer.category || offer.brand || 'Discovered in the scene'}</small></span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="sidebar-hint"><Icon name="lightbulb" size={15} /><span>You can explore every corner — nothing is timed.</span></div>
                </section>
                <button className="sidebar-exit" type="button" onClick={exitSearch}><Icon name="arrow-left" size={15} /> Step away from the search</button>
              </aside>
            </div>
          </main>
        </>
      )}

      {phase === 'victory' && (
        <VictoryScreen config={config} visitorName={visitorName} onChallenge={openChallenge} onPlayAgain={playAgain} />
      )}

      {phase === 'challenge' && (
        <ChallengeFriendsScreen
          config={config}
          visitorName={visitorName}
          shareContent={shareContent}
          status={shareStatus}
          canNativeShare={canNativeShare}
          onPrimaryShare={() => void shareChallenge()}
          onCopyLink={() => void copyChallengeLink(true)}
          onWhatsAppClick={onWhatsAppClick}
          onPlayAgain={playAgain}
        />
      )}

      {nameEntryOpen && (
        <NameEntryModal
          config={config}
          value={nameDraft}
          onChange={setNameDraft}
          onClose={closeNameEntry}
          onSubmit={beginSearch}
        />
      )}
      {howToPlayOpen && <HowToPlayModal config={config} onClose={closeHowToPlay} />}
      {game.activeOffer && (
        <ProductRevealModal
          config={config}
          offer={game.activeOffer}
          onClose={closeProduct}
          onCopyCoupon={game.copyCoupon}
          onCtaClick={game.trackOfferCta}
        />
      )}
      {campaign.isDemo && <span className="demo-watermark" aria-hidden="true">PREVIEW CAMPAIGN</span>}
    </div>
  );
}

export default App;
