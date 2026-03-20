import { useState } from '@wordpress/element';

interface Props {
  code: string;
  language?: string;
}

export default function CodeBlock({ code, language = 'html' }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="jug-ai-code-block">
      <div className="jug-ai-code-header">
        <span>{language}</span>
        <button type="button" onClick={handleCopy} className="jug-ai-btn-sm">
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}
