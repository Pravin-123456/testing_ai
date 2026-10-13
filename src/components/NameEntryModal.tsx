import { useMemo, type FormEvent } from 'react';
import type { FindYourNameConfigV1 } from '../types';
import { Icon } from './Icon';
import { Modal } from './Modal';

interface NameEntryModalProps {
  config: FindYourNameConfigV1;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (value: string) => void;
}

export function NameEntryModal({ config, value, onChange, onClose, onSubmit }: NameEntryModalProps) {
  const normalized = value.trim();
  const characterCount = useMemo(() => Array.from(normalized).length, [normalized]);
  const error = characterCount > 32 ? 'Please use 32 characters or fewer.' : '';
  const disabled = normalized.length === 0 || Boolean(error);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disabled) return;
    onSubmit(normalized);
  };

  return (
    <Modal onClose={onClose} labelledBy="name-entry-title" describedBy="name-entry-description" className="name-modal">
      <div className="modal-topline"><span className="modal-icon"><Icon name="search" size={19} /></span><span className="eyebrow">Before the search begins</span></div>
      <h2 id="name-entry-title">What should we look for?</h2>
      <p id="name-entry-description" className="modal-copy">Tell us the name to find. It stays in this game session and won’t appear in your shared link.</p>
      <form onSubmit={handleSubmit} noValidate>
        <label className="field-label" htmlFor="visitor-name">Your name</label>
        <div className={`name-input-wrap${error ? ' has-error' : ''}`}>
          <input
            id="visitor-name"
            name="visitor-name"
            type="text"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="e.g. Alex"
            autoComplete="given-name"
            autoCapitalize="words"
            enterKeyHint="go"
            maxLength={64}
            data-modal-autofocus
            aria-describedby={error ? 'name-error' : 'name-input-note'}
            aria-invalid={Boolean(error)}
          />
          <span className="input-sparkle"><Icon name="sparkle" size={17} /></span>
        </div>
        {error ? (
          <p className="field-error" id="name-error" role="alert">{error}</p>
        ) : (
          <p className="field-note" id="name-input-note">A first name or nickname works beautifully.</p>
        )}
        <button className="button button-primary button-full" type="submit" disabled={disabled}>
          {config.story.startLabel || 'Start searching'} <Icon name="arrow" size={18} />
        </button>
      </form>
      <div className="privacy-note"><Icon name="lock" size={14} /> Your name stays on this device.</div>
    </Modal>
  );
}
