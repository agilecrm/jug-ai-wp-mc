import { useState } from '@wordpress/element';
import api from '../../api';
import OtpInput from './OtpInput';
import Spinner from './Spinner';

interface Props {
  initialMode: 'login' | 'signup';
  onLogin: () => void;
  onClose: () => void;
}

export default function AuthModal({ initialMode, onLogin, onClose }: Props) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [step, setStep] = useState<'contact' | 'otp'>('contact');
  const [contact, setContact] = useState('');
  const [name, setName] = useState('');
  const [encStr, setEncStr] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      await api.post('auth/verify', { otp, enc_str: encStr });
      onLogin();
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const mailIcon = (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#999" strokeWidth="2">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 4l-10 8L2 4" />
    </svg>
  );

  return (
    <div className="jug-auth-overlay" onClick={onClose}>
      <div className="jug-auth-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="jug-auth-close" onClick={onClose}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {step === 'contact' ? (
          <>
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
                <div className="jug-auth-input-icon">
                  {mailIcon}
                  <input
                    id="jug-auth-contact"
                    type="text"
                    value={contact}
                    onChange={(e) => setContact((e.target as HTMLInputElement).value)}
                    placeholder="name@example.com or +1 234..."
                    required
                  />
                </div>
              </div>
              {error && <p className="jug-auth-error">{error}</p>}
              <button type="submit" className="jug-auth-submit" disabled={loading}>
                {loading ? <Spinner size={18} /> : 'Send Code'}
              </button>
            </form>

            <p className="jug-auth-switch">
              {mode === 'signup' ? (
                <>Already have an account? <button type="button" onClick={() => { setMode('login'); setError(''); }}>Login</button></>
              ) : (
                <>Don&apos;t have an account? <button type="button" onClick={() => { setMode('signup'); setError(''); }}>Sign up for free</button></>
              )}
            </p>
          </>
        ) : (
          <div className="jug-auth-otp-step">
            <h2 className="jug-auth-title">Verify Code</h2>
            <p className="jug-auth-subtitle">
              Enter the 4-digit code sent to<br /><strong>{contact}</strong>
            </p>
            <OtpInput onComplete={handleOtpComplete} />
            {error && <p className="jug-auth-error">{error}</p>}
            {!loading ? (
              <button
                type="button"
                className="jug-auth-submit"
                disabled
                style={{ opacity: 0.5 }}
              >
                Verify &amp; Continue
              </button>
            ) : (
              <button type="button" className="jug-auth-submit" disabled>
                <Spinner size={18} />
              </button>
            )}
            <p className="jug-auth-switch">
              <button
                type="button"
                onClick={() => { setStep('contact'); setError(''); }}
              >
                Back to {mode === 'login' ? 'login' : 'signup'}
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
