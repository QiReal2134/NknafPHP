import { memo } from 'react';

interface MobileNavProps { open: boolean; onToggle: () => void; onClose: () => void }

const MobileNav = memo(({ open, onToggle, onClose }: MobileNavProps) => (
  <>
    <button className={`hamburger-btn ${open ? 'open' : ''}`} onClick={onToggle} aria-label="菜单" aria-expanded={open}>
      <span className="hamburger-line" /><span className="hamburger-line" /><span className="hamburger-line" />
    </button>
    {open && <div className="mobile-overlay" onClick={onClose} />}
  </>
));

export default MobileNav;
