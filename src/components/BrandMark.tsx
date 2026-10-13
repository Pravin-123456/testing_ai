import type { FindYourNameConfigV1 } from '../types';
import { Icon } from './Icon';

export function BrandMark({ config, compact = false }: { config?: FindYourNameConfigV1; compact?: boolean }) {
  const name = config?.campaign.brandName || 'Find Your Name';
  if (config?.campaign.logoUrl) {
    return (
      <div className={`brand-mark${compact ? ' brand-mark-compact' : ''}`}>
        <img src={config.campaign.logoUrl} alt={name} />
      </div>
    );
  }
  return (
    <div className={`brand-mark${compact ? ' brand-mark-compact' : ''}`}>
      <span className="brand-emblem"><Icon name="compass" size={20} /></span>
      <span>{name}</span>
    </div>
  );
}
