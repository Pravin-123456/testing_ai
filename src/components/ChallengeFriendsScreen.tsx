import type { FindYourNameConfigV1 } from '../types';
import type { ShareContent } from '../lib/sharing';
import { getWhatsAppUrl } from '../lib/sharing';
import { Icon } from './Icon';
import { BrandMark } from './BrandMark';

interface ChallengeFriendsScreenProps {
  config: FindYourNameConfigV1;
  visitorName: string;
  shareContent: ShareContent;
  status: string;
  canNativeShare: boolean;
  onPrimaryShare: () => void;
  onCopyLink: () => void;
  onWhatsAppClick: () => void;
  onPlayAgain: () => void;
}

const confettiPieces = ['confetti-coral', 'confetti-gold', 'confetti-sage', 'confetti-cream', 'confetti-rose', 'confetti-blue'];

export function ChallengeFriendsScreen({
  config,
  visitorName,
  shareContent,
  status,
  canNativeShare,
  onPrimaryShare,
  onCopyLink,
  onWhatsAppClick,
  onPlayAgain,
}: ChallengeFriendsScreenProps) {
  const title = config.campaign.title || 'Find Your Name';
  const configuredChallengeText = shareContent.message.replace(shareContent.url, '').trim();
  return (
    <main className="challenge-page">
      <header className="challenge-header">
        <BrandMark config={config} compact />
        <div className="challenge-header-right">
          <span className="challenge-campaign-name">{title}</span>
          <button className="text-button replay-top" type="button" onClick={onPlayAgain}>
            <Icon name="refresh" size={16} /> Play again
          </button>
        </div>
      </header>
      <div className="challenge-layout">
        <section className="challenge-illustration" aria-label="Your solved mystery">
          <img src={config.scene.backgroundImage} alt="" />
          <div className="challenge-image-shade" />
          <div className="celebration-spark celebration-spark-one"><Icon name="sparkle" size={24} /></div>
          <div className="celebration-spark celebration-spark-two"><Icon name="sparkle" size={18} /></div>
          <div className="confetti-field" aria-hidden="true">
            {confettiPieces.concat(confettiPieces).map((name, index) => (
              <i key={`${name}-${index}`} className={`confetti-piece ${name}`} style={{
                '--i': index,
                '--x': `${(index * 31 + 7) % 100}%`,
                '--y': `${(index * 19 + 9) % 86}%`,
              } as React.CSSProperties} />
            ))}
          </div>
          <div className="solved-stamp"><Icon name="check" size={15} /> Mystery solved</div>
          <div className="found-name-plaque">
            <span>found by the lantern light</span>
            <strong>{visitorName}</strong>
            <i aria-hidden="true"><Icon name="sparkle" size={14} /></i>
          </div>
          <p className="illustration-caption">One small discovery can start a lovely story.</p>
        </section>

        <section className="challenge-content" aria-labelledby="challenge-heading">
          <span className="completion-kicker"><Icon name="sparkle" size={15} /> You did it</span>
          <h1 id="challenge-heading" aria-live="polite" aria-atomic="true">{config.story.challengeHeading || 'Now it’s their turn.'}</h1>
          <p className="challenge-description">
            {config.story.challengeMessage || 'Send a little mystery to someone you like. They’ll search for their own name when they arrive.'}
          </p>

          <div className="challenge-card">
            <div className="challenge-card-topline">
              <span className="challenge-card-icon"><Icon name="share" size={18} /></span>
              <span className="eyebrow">Pass the mystery along</span>
            </div>
            <p className="challenge-quote">“{configuredChallengeText}”</p>
            <p className="challenge-card-note">Your friend will get a fresh search and look for their own name.</p>
          </div>

          <div className="message-preview">
            <div className="preview-heading">
              <span>Message preview</span>
              <span className="preview-live"><i /> Ready to share</span>
            </div>
            <p>{shareContent.message}</p>
            <div className="preview-url"><Icon name="link" size={14} /><span>{shareContent.url}</span></div>
          </div>

          <button className="button button-primary challenge-primary" type="button" onClick={onPrimaryShare}>
            <Icon name="share" size={18} />
            {config.sharing?.challengeLabel || 'Challenge your friends'}
            <span className="button-arrow"><Icon name="arrow" size={17} /></span>
          </button>
          <p className="share-helper">
            {canNativeShare ? 'Opens your device’s sharing options. Choose any app you like.' : 'Copy the link, then send it wherever your friends are.'}
          </p>

          <div className="share-options" aria-label="Other ways to share">
            <a className="share-option whatsapp-option" href={getWhatsAppUrl(shareContent)} target="_blank" rel="noopener noreferrer" onClick={onWhatsAppClick} aria-label="Prepare a WhatsApp challenge in a new tab">
              <span className="share-option-icon"><Icon name="whatsapp" size={19} /></span>
              <span>{config.sharing?.whatsappLabel || 'WhatsApp'}</span>
              <Icon name="arrow-up-right" size={15} />
            </a>
            <button className="share-option" type="button" onClick={onCopyLink}>
              <span className="share-option-icon"><Icon name="copy" size={18} /></span>
              <span>{config.sharing?.copyLabel || 'Copy challenge link'}</span>
              <Icon name="arrow" size={15} />
            </button>
          </div>
          {status && <p className="share-status" role="status" aria-live="polite">{status}</p>}

          <div className="privacy-footnote"><Icon name="lock" size={14} /> Your name isn’t included in the link.</div>
          <button className="play-again-link" type="button" onClick={onPlayAgain}>
            <Icon name="refresh" size={15} /> {config.story.playAgainLabel || 'Play again'}
          </button>
        </section>
      </div>
    </main>
  );
}
