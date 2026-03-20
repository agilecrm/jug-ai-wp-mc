import { useState } from '@wordpress/element';
import api from '../api';
import OtpInput from '../components/shared/OtpInput';
import Spinner from '../components/shared/Spinner';

interface Props {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: Props) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
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

  return (
    <div className="jug-ai-login">
      <div className="jug-ai-login-card">
        <div className="jug-ai-login-header">
          <h1>Jug.ai</h1>
          <p>AI Chatbot for your website</p>
        </div>

        {step === 'contact' ? (
          <>
            <div className="jug-ai-tabs">
              <button
                type="button"
                className={mode === 'login' ? 'active' : ''}
                onClick={() => setMode('login')}
              >
                Login
              </button>
              <button
                type="button"
                className={mode === 'signup' ? 'active' : ''}
                onClick={() => setMode('signup')}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmitContact}>
              {mode === 'signup' && (
                <div className="jug-ai-field">
                  <label htmlFor="jug-name">Name</label>
                  <input
                    id="jug-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName((e.target as HTMLInputElement).value)}
                    placeholder="Your name"
                    required
                  />
                </div>
              )}
              <div className="jug-ai-field">
                <label htmlFor="jug-contact">Email or Phone</label>
                <input
                  id="jug-contact"
                  type="text"
                  value={contact}
                  onChange={(e) => setContact((e.target as HTMLInputElement).value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              {error && <p className="jug-ai-error">{error}</p>}
              <button type="submit" className="jug-ai-btn-primary" disabled={loading}>
                {loading ? <Spinner size={18} /> : mode === 'signup' ? 'Create Account' : 'Continue'}
              </button>
            </form>
          </>
        ) : (
          <div className="jug-ai-otp-step">
            <p>Enter the verification code sent to <strong>{contact}</strong></p>
            <OtpInput onComplete={handleOtpComplete} />
            {error && <p className="jug-ai-error">{error}</p>}
            {loading && (
              <div className="jug-ai-center">
                <Spinner />
              </div>
            )}
            <button
              type="button"
              className="jug-ai-btn-link"
              onClick={() => { setStep('contact'); setError(''); }}
            >
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
