import type { FindYourNameConfigV1 } from '../types';
import { Icon } from './Icon';
import { BrandMark } from './BrandMark';

interface VictoryScreenProps {
  config: FindYourNameConfigV1;
  visitorName: string;
  onChallenge: () => void;
  onPlayAgain: () => void;
}

export function VictoryScreen({ config, visitorName, onChallenge, onPlayAgain }: VictoryScreenProps) {
  return (
    <main className="victory-page">
      <header className="victory-header"><BrandMark config={config} compact /><span className="victory-header-note"><Icon name="sparkle" size={15} /> A little mystery solved</span></header>
      <section className="victory-panel">
        <div className="victory-art">
          <img src={config.scene.backgroundImage} alt="" />
          <div className="victory-art-shade" />
          <div className="victory-confetti" aria-hidden="true">
            {Array.from({ length: 16 }, (_, index) => (
              <i key={index} style={{
                '--i': index,
                '--x': `${(index * 37 + 5) % 100}%`,
                '--y': `${(index * 23 + 7) % 86}%`,
              } as React.CSSProperties} />
            ))}
          </div>
          <div className="victory-word-card">
            <span>Your name was waiting here</span>
            <strong>{visitorName}</strong>
            <Icon name="sparkle" size={17} />
          </div>
          <div className="victory-seal"><Icon name="check" size={16} /> FOUND</div>
        </div>
        <div className="victory-copy">
          <span className="success-badge"><Icon name="sparkle" size={15} /> Mystery solved</span>
          <h1 aria-live="polite" aria-atomic="true">{config.story.completionHeading || 'You found your name!'}</h1>
          <p>{config.story.completionMessage || 'You solved the mystery. Think your friends can find their own names?'}</p>
          <div className="victory-highlight"><span>Found in the story</span><strong>{visitorName}</strong></div>
          <button className="button button-primary victory-cta" type="button" onClick={onChallenge}>
            Challenge your friends <Icon name="arrow" size={18} />
          </button>
          <button className="victory-secondary" type="button" onClick={onPlayAgain}>
            <Icon name="refresh" size={16} /> {config.story.playAgainLabel || 'Play again'}
          </button>
          <p className="victory-privacy"><Icon name="lock" size={14} /> Your name stays private and never goes in the challenge link.</p>
        </div>
      </section>
    </main>
  );
}
