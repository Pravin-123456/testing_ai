import { useState } from 'react';
import type { FindYourNameConfigV1, ProductOffer } from '../types';
import { safeHttpUrl } from '../lib/safeUrls';
import { Icon } from './Icon';
import { Modal } from './Modal';

interface ProductRevealModalProps {
  config: FindYourNameConfigV1;
  offer: ProductOffer;
  onClose: () => void;
  onCopyCoupon: (offer: ProductOffer) => Promise<boolean>;
  onCtaClick: (offer: ProductOffer) => void;
}

export function ProductRevealModal({ config, offer, onClose, onCopyCoupon, onCtaClick }: ProductRevealModalProps) {
  const [copyMessage, setCopyMessage] = useState('');
  const safeImage = safeHttpUrl(offer.imageUrl);
  const safeCta = safeHttpUrl(offer.ctaUrl);
  const presentation = config.productModal?.presentation || 'centered';
  const title = offer.title || 'A hidden find';

  const copyCode = async () => {
    const copied = await onCopyCoupon(offer);
    setCopyMessage(copied ? 'Code copied to your clipboard.' : 'Copy didn’t work. You can select the code and copy it instead.');
  };

  return (
    <Modal
      onClose={onClose}
      labelledBy="product-reveal-title"
      describedBy={offer.description ? 'product-reveal-description' : undefined}
      className={`product-modal product-modal-${presentation}`}
      backdropClassName={`product-modal-backdrop product-modal-backdrop-${presentation}`}
    >
      <div className="product-reveal-layout">
        <div className="product-art-panel">
          {safeImage ? (
            <img src={safeImage} alt={offer.title ? `${offer.title} product` : 'Campaign product'} />
          ) : (
            <div className="product-art-fallback" aria-hidden="true">
              <div className="fallback-sun" />
              <div className="fallback-package"><Icon name="gift" size={48} /></div>
              <span className="fallback-leaf">✦</span>
            </div>
          )}
          <span className="discovery-stamp"><Icon name="sparkle" size={14} /> Little find</span>
        </div>
        <div className="product-copy-panel">
          <p className="eyebrow">You uncovered something</p>
          {offer.category && <span className="product-category">{offer.category}</span>}
          <h2 id="product-reveal-title">{title}</h2>
          {offer.brand && <p className="product-brand">from {offer.brand}</p>}
          {offer.description && <p id="product-reveal-description" className="product-description">{offer.description}</p>}

          {offer.offerValue && (
            <div className="offer-value-card">
              <span className="offer-value-label">A little offer for you</span>
              <strong>{offer.offerValue}</strong>
            </div>
          )}
          {offer.couponCode && (
            <div className="coupon-card">
              <div><span className="coupon-label">Your code</span><strong>{offer.couponCode}</strong></div>
              <button className="coupon-copy-button" type="button" onClick={() => void copyCode()}>
                <Icon name="copy" size={16} /> Copy
              </button>
            </div>
          )}
          <p className="copy-feedback" aria-live="polite">{copyMessage}</p>

          <div className="product-actions">
            {safeCta && (
              <a
                className="button button-primary button-full"
                href={safeCta}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onCtaClick(offer)}
              >
                {offer.ctaLabel || 'Explore offer'} <Icon name="external" size={17} />
              </a>
            )}
            <button className={`button ${safeCta ? 'button-secondary' : 'button-primary'} button-full`} type="button" onClick={onClose}>
              {config.productModal?.continueLabel || 'Continue exploring'}
              {!safeCta && <Icon name="arrow" size={18} />}
            </button>
          </div>
          <p className="product-fine-print">Offers and availability are managed by the campaign.</p>
        </div>
      </div>
    </Modal>
  );
}
