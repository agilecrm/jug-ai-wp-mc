import { useEffect, useState } from '@wordpress/element';

interface Props {
  open: boolean;
  onClose: () => void;
  botUuid: string | undefined;
  siteUrl: string;
}

/**
 * Not a visual modal -- opens the chat preview in a new browser tab
 * and immediately calls onClose so the parent resets its state.
 */
export default function BotPreviewModal({ open, onClose, botUuid, siteUrl }: Props) {
  const [fired, setFired] = useState(false);

  useEffect(() => {
    if (!open || fired || !botUuid) return;

    const url = siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`;
    const previewUrl = `https://app.jug.ai/chat-preview?bot=${botUuid}&url=${encodeURIComponent(url)}`;
    window.open(previewUrl, '_blank');

    setFired(true);
    onClose();
  }, [open, fired, botUuid, siteUrl, onClose]);

  useEffect(() => {
    if (!open) setFired(false);
  }, [open]);

  return null;
}
