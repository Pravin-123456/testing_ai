import { useEffect, useState } from 'react';
import { fetchCampaignForCurrentDomain } from '../lib/campaign';
import type { LoadedCampaign } from '../types';
import { Icon } from './Icon';
import { BrandMark } from './BrandMark';

interface CampaignLoaderProps {
  children: (campaign: LoadedCampaign) => React.ReactNode;
}

export function CampaignLoader({ children }: CampaignLoaderProps) {
  const [campaign, setCampaign] = useState<LoadedCampaign | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setCampaign(null);
    setError(null);
    fetchCampaignForCurrentDomain(window.location.hostname)
      .then((result) => {
        if (!cancelled) setCampaign(result);
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : 'The campaign could not be loaded.');
        }
      });
    return () => { cancelled = true; };
  }, [attempt]);

  if (campaign) return children(campaign);

  return (
    <main className="loader-page" aria-live="polite">
      <BrandMark />
      {error ? (
        <section className="loader-card error-card" role="alert">
          <span className="loader-emblem error-emblem"><Icon name="info" size={24} /></span>
          <p className="eyebrow">Campaign connection</p>
          <h1>We couldn’t open this little world.</h1>
          <p className="loader-message">{error}</p>
          <button className="button button-primary" onClick={() => setAttempt((current) => current + 1)}>
            Try again <Icon name="arrow" size={18} />
          </button>
        </section>
      ) : (
        <section className="loader-card" aria-label="Loading campaign">
          <span className="loader-emblem"><Icon name="sparkle" size={24} /></span>
          <p className="eyebrow">Opening the market</p>
          <h1>Gathering a little wonder…</h1>
          <span className="loader-progress"><span /></span>
        </section>
      )}
      <p className="loader-footnote">A small adventure is on its way.</p>
    </main>
  );
}
