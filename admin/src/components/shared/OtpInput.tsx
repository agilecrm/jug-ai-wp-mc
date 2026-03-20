import { useState, useRef, useEffect } from '@wordpress/element';

interface Props {
  length?: number;
  onComplete: (otp: string) => void;
}

export default function OtpInput({ length = 4, onComplete }: Props) {
  const [values, setValues] = useState<string[]>(Array(length).fill(''));
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  const handleChange = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;

    const next = [...values];
    next[idx] = val.slice(-1);
    setValues(next);

    if (val && idx < length - 1) {
      inputs.current[idx + 1]?.focus();
    }

    if (next.every((v) => v !== '') && next.join('').length === length) {
      onComplete(next.join(''));
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !values[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    const next = [...values];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setValues(next);
    if (pasted.length === length) {
      onComplete(next.join(''));
    } else {
      inputs.current[Math.min(pasted.length, length - 1)]?.focus();
    }
  };

  return (
    <div className="jug-ai-otp-input">
      {values.map((val, i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={val}
          onChange={(e) => handleChange(i, (e.target as HTMLInputElement).value)}
          onKeyDown={(e) => handleKeyDown(i, e as any)}
          onPaste={i === 0 ? handlePaste : undefined}
          className="jug-ai-otp-digit"
          autoComplete="one-time-code"
        />
      ))}
    </div>
  );
}
