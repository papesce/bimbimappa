import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface CollapsibleSectionProps {
  title: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export default function CollapsibleSection({
  title,
  defaultOpen = true,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`collapsible-section${open ? ' open' : ''}`}>
      <button
        type="button"
        className="collapsible-header"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        {title}
        <ChevronDown size={16} className="collapsible-chevron" />
      </button>
      <div className="collapsible-body">
        <div className="collapsible-content">{children}</div>
      </div>
    </div>
  );
}
