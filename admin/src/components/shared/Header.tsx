import { useState, useEffect, useRef } from '@wordpress/element';

interface HeaderProps {
  isLoggedIn: boolean;
  user: { name: string; email: string } | null;
  route?: string;
  onLoginClick: () => void;
  onLogout: () => void;
}

function getFirstLetter(name: string, email?: string): string {
  const trimmed = name.trim();
  if (trimmed) return trimmed[0].toUpperCase();
  const emailTrimmed = (email || '').trim();
  if (emailTrimmed) return emailTrimmed[0].toUpperCase();
  return '?';
}

export default function Header({ isLoggedIn, user, route, onLoginClick, onLogout }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogoutClick = () => {
    setMenuOpen(false);
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    onLogout();
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <>
      <header className="jug-ai-header">
        <div className="jug-ai-header-inner">
          <div className="jug-ai-header-left">
            <a href="#/" className="jug-ai-header-brand">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="10" r="1" /><circle cx="8" cy="10" r="1" /><circle cx="16" cy="10" r="1" />
              </svg>
              <span>Jug.ai</span>
            </a>
          </div>
          <div className="jug-ai-header-right">
            <a href="https://app.jug.ai" target="_blank" rel="noopener noreferrer" className="jug-ai-header-icon-link">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              Website
            </a>
            <a href="https://app.jug.ai/pricing" target="_blank" rel="noopener noreferrer" className="jug-ai-header-icon-link">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              Pricing
            </a>

            {isLoggedIn ? (
              <>
                {(!route || route === '/') && (
                  <a href="#/dashboard" className="jug-ai-header-icon-link">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="10" r="1" /><circle cx="8" cy="10" r="1" /><circle cx="16" cy="10" r="1" />
                    </svg>
                    Go to Bot
                  </a>
                )}
                <div className="jug-ai-header-user-menu" ref={menuRef}>
                <button
                  type="button"
                  className="jug-ai-header-avatar"
                  onClick={() => setMenuOpen(!menuOpen)}
                  title={user?.name || 'Account'}
                >
                  {getFirstLetter(user?.name || '', user?.email)}
                </button>
                {menuOpen && (
                  <div className="jug-ai-header-dropdown">
                    {user && (user.name || user.email) && (
                      <div className="jug-ai-header-user-info">
                        {user.name && <span className="jug-ai-header-user-name">{user.name}</span>}
                        {user.email && <span className="jug-ai-header-user-email">{user.email}</span>}
                      </div>
                    )}
                    <button type="button" className="jug-ai-header-logout-btn" onClick={handleLogoutClick}>
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
              </>
            ) : (
              <button
                type="button"
                className="jug-ai-header-icon-link"
                onClick={onLoginClick}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      {showLogoutConfirm && (
        <div className="jug-ai-confirm-overlay" onClick={cancelLogout}>
          <div className="jug-ai-confirm-box" onClick={(e) => e.stopPropagation()}>
            <div className="jug-ai-confirm-icon">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>
            <h3 className="jug-ai-confirm-title">Logout</h3>
            <p className="jug-ai-confirm-message">Are you sure you want to logout?</p>
            <div className="jug-ai-confirm-actions">
              <button type="button" className="jug-ai-confirm-cancel" onClick={cancelLogout}>
                Cancel
              </button>
              <button type="button" className="jug-ai-confirm-proceed" onClick={confirmLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
