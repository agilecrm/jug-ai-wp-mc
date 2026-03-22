import { useState } from '@wordpress/element';
import api from '../api';
import OtpInput from '../components/shared/OtpInput';
import Spinner from '../components/shared/Spinner';

interface Props {
  onLogin: (name: string, email: string) => void;
  onClose?: () => void;
  asModal?: boolean;
}

const LOGIN_ICONS: { label: string; icon: JSX.Element }[] = [
  {
    label: 'MARKETING',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  {
    label: 'CRM',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
  {
    label: 'HOSPITALITY',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: 'CHATBOT',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    label: 'SDR',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: 'ANALYTICS',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
];

const SIGNUP_ICONS: { label: string; icon: JSX.Element }[] = [
  {
    label: 'AI POWERED',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    label: 'MULTILINGUAL',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
  {
    label: 'SECURE',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    label: 'SMART BOTS',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v3" />
        <line x1="12" y1="12" x2="12" y2="16" />
      </svg>
    ),
  },
  {
    label: 'CUSTOM TONE',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    label: 'ANALYTICS',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
];

const BotIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2" />
    <circle cx="12" cy="5" r="2" />
    <path d="M12 7v4" />
    <line x1="8" y1="16" x2="8" y2="16" />
    <line x1="16" y1="16" x2="16" y2="16" />
  </svg>
);

export default function AuthModal({ onLogin, onClose, asModal }: Props) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [step, setStep] = useState<'contact' | 'otp'>('contact');
  const [contact, setContact] = useState('');
  const [name, setName] = useState('');
  const [encStr, setEncStr] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpValue, setOtpValue] = useState('');

  const handleSubmitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = mode === 'signup' ? 'auth/signup' : 'auth/login';
      const body = mode === 'signup' ? { name, contact } : { contact };
      const result = await api.post(endpoint, body);
      setEncStr(result.enc_str || '');
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpComplete = async (otp: string) => {
    setError('');
    setLoading(true);

    try {
      const result = await api.post('auth/verify', { otp, enc_str: encStr, name, contact });
      onLogin(result.name || name || '', result.email || contact || '');
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const icons = mode === 'signup' ? SIGNUP_ICONS : LOGIN_ICONS;

  const leftPanel = (
    <div className="jug-auth-left">
      <div className="jug-auth-grid">
        {icons.map((item, i) => (
          <div key={i} className="jug-auth-grid-tile">
            <span className="jug-auth-grid-icon">{item.icon}</span>
            <span className="jug-auth-grid-label">{item.label}</span>
          </div>
        ))}
      </div>
      <div className="jug-auth-brand">
        <div className="jug-auth-brand-row">
          <BotIcon />
          <span className="jug-auth-brand-name">Jug.ai</span>
        </div>
        <h3 className="jug-auth-brand-heading">
          {mode === 'signup' ? (
            <>
              Join thousands using Jug.ai
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 8, verticalAlign: 'middle' }}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </>
          ) : (
            'Welcome back to Jug.ai'
          )}
        </h3>
        <p className="jug-auth-brand-subtitle">
          {mode === 'signup'
            ? 'Create your free account and deploy AI agents in minutes — no coding required.'
            : 'Log in to manage your AI agents, view analytics, and keep your bots running 24/7.'}
        </p>
      </div>
    </div>
  );

  const rightPanel = (
    <div className="jug-auth-right">
      <h2 className="jug-auth-title">
        {mode === 'signup' ? 'Create your account' : 'Login to Jug.ai'}
      </h2>
      <p className="jug-auth-subtitle">
        {mode === 'signup'
          ? 'Get started for free — no credit card required.'
          : 'Enter your email or phone to receive a login code.'}
      </p>

      <form onSubmit={handleSubmitContact}>
        {mode === 'signup' && (
          <div className="jug-auth-field">
            <label htmlFor="jug-auth-name">Full Name</label>
            <input
              id="jug-auth-name"
              type="text"
              value={name}
              onChange={(e) => setName((e.target as HTMLInputElement).value)}
              placeholder="John Doe"
              required
            />
          </div>
        )}
        <div className="jug-auth-field">
          <label htmlFor="jug-auth-contact">Email or Phone Number</label>
          <input
            id="jug-auth-contact"
            type="text"
            value={contact}
            onChange={(e) => setContact((e.target as HTMLInputElement).value)}
            placeholder="name@example.com or +1 234..."
            required
          />
        </div>
        {error && <p className="jug-auth-error">{error}</p>}
        <button type="submit" className="jug-auth-submit" disabled={loading}>
          {loading ? <Spinner size={18} /> : 'Send Code'}
        </button>
      </form>

      <p className="jug-auth-switch">
        {mode === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
        <button type="button" onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setError(''); }}>
          {mode === 'signup' ? 'Login' : 'Sign up for free'}
        </button>
      </p>
    </div>
  );

  const handleOtpReady = (otp: string) => {
    setOtpValue(otp);
    handleOtpComplete(otp);
  };

  const handleVerifyClick = () => {
    if (otpValue.length === 4) {
      handleOtpComplete(otpValue);
    }
  };

  const otpRightPanel = (
    <div className="jug-auth-right jug-auth-otp-step">
      <h2 className="jug-auth-title">Verify Code</h2>
      <p className="jug-auth-subtitle">
        Enter the 4-digit code sent to
        <strong>{contact}</strong>
      </p>
      <OtpInput onComplete={handleOtpReady} />
      {error && <p className="jug-auth-error">{error}</p>}
      <button
        type="button"
        className="jug-auth-submit"
        disabled={loading}
        onClick={handleVerifyClick}
      >
        {loading ? <Spinner size={18} /> : 'Verify & Continue'}
      </button>
      <p className="jug-auth-switch" style={{ marginTop: 20 }}>
        <button type="button" onClick={() => { setStep('contact'); setError(''); }}>
          Back to login
        </button>
      </p>
    </div>
  );

  const otpLeftPanel = (
    <div className="jug-auth-left">
      <div className="jug-auth-grid">
        {LOGIN_ICONS.map((item, i) => (
          <div key={i} className="jug-auth-grid-tile">
            <span className="jug-auth-grid-icon">{item.icon}</span>
            <span className="jug-auth-grid-label">{item.label}</span>
          </div>
        ))}
      </div>
      <div className="jug-auth-brand">
        <div className="jug-auth-brand-row">
          <BotIcon />
          <span className="jug-auth-brand-name">Jug.ai</span>
        </div>
        <h3 className="jug-auth-brand-heading">Welcome back to Jug.ai</h3>
        <p className="jug-auth-brand-subtitle">
          Log in to manage your AI agents, view analytics, and keep your bots running 24/7.
        </p>
      </div>
    </div>
  );

  const content = (
    <div className="jug-auth-modal">
      {onClose && (
        <button type="button" className="jug-auth-close" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
      {step === 'contact' ? (
        <>
          {leftPanel}
          {rightPanel}
        </>
      ) : (
        <>
          {otpLeftPanel}
          {otpRightPanel}
        </>
      )}
    </div>
  );

  if (asModal) {
    return (
      <div className="jug-auth-overlay" onClick={(e) => { if (e.target === e.currentTarget && onClose) onClose(); }}>
        {content}
      </div>
    );
  }

  return (
    <div className="jug-ai-login">
      {content}
    </div>
  );
}
