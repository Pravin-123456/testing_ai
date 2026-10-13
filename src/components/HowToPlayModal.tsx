import type { FindYourNameConfigV1 } from '../types';
import { Icon } from './Icon';
import { Modal } from './Modal';

export function HowToPlayModal({ config, onClose }: { config: FindYourNameConfigV1; onClose: () => void }) {
  return (
    <Modal onClose={onClose} labelledBy="how-to-play-title" className="howto-modal">
      <div className="modal-topline"><span className="modal-icon"><Icon name="compass" size={20} /></span><span className="eyebrow">A tiny field guide</span></div>
      <h2 id="how-to-play-title">How to find your name</h2>
      <p className="modal-copy">{config.story.instructions || 'Explore the illustration with your magnifying glass. Your name is woven into the scene.'}</p>
      <ol className="howto-steps">
        <li><span>01</span><div><strong>Take a closer look</strong><p>Move your pointer or drag the magnifying glass across the scene.</p></div></li>
        <li><span>02</span><div><strong>Notice the little details</strong><p>Hidden finds reveal themselves when the lens gets close.</p></div></li>
        <li><span>03</span><div><strong>Spot your name</strong><p>Look carefully, take your time, and enjoy the small discoveries.</p></div></li>
      </ol>
      <button className="button button-primary button-full" type="button" onClick={onClose}>Got it <Icon name="arrow" size={18} /></button>
    </Modal>
  );
}
