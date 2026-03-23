import { useState } from '@wordpress/element';

interface Props {
  code: string;
  language?: string;
}

export default function CodeBlock({ code }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="jug-ai-code-block">
      <textarea
        className="jug-ai-code-textarea"
        value={code}
        readOnly
        rows={2}
      />
      <button type="button" onClick={handleCopy} className="jug-ai-code-copy-btn">
        {copied ? '✓ Copied' : '📋 Copy'}
      </button>
    </div>
  );
}
