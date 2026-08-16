import { Check } from 'lucide-react';

interface VisitedBadgeProps {
  compact?: boolean;
  showLabel?: boolean;
}

export default function VisitedBadge({ compact = false, showLabel = true }: VisitedBadgeProps) {
  return (
    <span className={`visited-badge${compact ? ' visited-badge--compact' : ''}`} title="Visited">
      <Check size={compact ? 10 : 12} strokeWidth={2.5} />
      {showLabel && <span>Visited</span>}
    </span>
  );
}
