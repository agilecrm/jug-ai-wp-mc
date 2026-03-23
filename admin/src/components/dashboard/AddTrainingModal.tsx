import { useState, useEffect, useRef } from '@wordpress/element';
import api from '../../api';
import Spinner from '../shared/Spinner';

const FILE_ACCEPTED_TYPES = '.pdf,.docx,.doc,.txt';

interface Props {
  open: boolean;
  onClose: () => void;
  trainingUuid: string | null;
  fingerprint?: string;
  embeddingType?: string;
  siteUrl?: string;
  scrappedUrls?: string[];
}

export default function AddTrainingModal({
  open,
  onClose,
  trainingUuid,
  fingerprint,
  embeddingType = 'free',
  siteUrl,
  scrappedUrls = [],
}: Props) {
  const [urls, setUrls] = useState('');
  const [urlStatus, setUrlStatus] = useState('');
  const [isTrainingUrls, setIsTrainingUrls] = useState(false);
  const [isDiscoveringUrls, setIsDiscoveringUrls] = useState(false);
  const [newText, setNewText] = useState('');

  const [csvRows, setCsvRows] = useState<string[]>([]);
  const [showCsvPreview, setShowCsvPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File upload state
  const [fileUuid, setFileUuid] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [chunkSize, setChunkSize] = useState(512);
  const [overlap, setOverlap] = useState(50);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [trainResult, setTrainResult] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [customSuccessMessage, setCustomSuccessMessage] = useState('');
  const [bulkSuccessMessage, setBulkSuccessMessage] = useState('');

  const [addingText, setAddingText] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [trainingFile, setTrainingFile] = useState(false);
  const [bulkAdding, setBulkAdding] = useState(false);

  function resetFileUpload() {
    setFileUuid(null);
    setFileName('');
    setExtractedText('');
    setTrainResult(null);
    setShowAdvanced(false);
    setChunkSize(512);
    setOverlap(50);
  }

  useEffect(() => {
    if (open) {
      setUrls('');
      setUrlStatus('');
      setIsTrainingUrls(false);
      setNewText('');
      setCsvRows([]);
      setShowCsvPreview(false);
      setCustomSuccessMessage('');
      setBulkSuccessMessage('');
      resetFileUpload();
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [open]);

  async function handleAddText() {
    if (!trainingUuid || !newText.trim()) return;
    setAddingText(true);
    try {
      await api.post(`training/${trainingUuid}/text`, {
        data: newText,
        embedding_type: embeddingType || 'free',
      });
      setNewText('');
      setCustomSuccessMessage('Done! Custom data added.');
      setTimeout(() => setCustomSuccessMessage(''), 3000);
    } catch (err: any) {
      setCustomSuccessMessage(`Error: ${err.message || 'Unknown'}`);
      setTimeout(() => setCustomSuccessMessage(''), 3000);
    } finally {
      setAddingText(false);
    }
  }

  async function handleDiscoverMoreUrls() {
    if (!siteUrl) return;
    setIsDiscoveringUrls(true);
    setUrlStatus('Discovering URLs from domain...');
    try {
      const currentInTextarea = urls.split('\n').map((u) => u.trim()).filter(Boolean);
      const exclude = [...new Set([...scrappedUrls, ...currentInTextarea])];
      const result: any = await api.discoverUrls(siteUrl, exclude, 25);
      const allReturned: string[] = Array.isArray(result) ? result : (result?.urls || []);
      const excludeSet = new Set(exclude.map((u: string) => u.toLowerCase().trim()));
      const newUrls = allReturned.filter((u) => !excludeSet.has(u.toLowerCase().trim()));
      if (!newUrls || newUrls.length === 0) {
        setUrlStatus('No new URLs found from domain.');
      } else {
        const combined = [...currentInTextarea, ...newUrls];
        setUrls(combined.join('\n'));
        setUrlStatus(`Added ${newUrls.length} new URL(s). Total: ${combined.length}`);
      }
      setTimeout(() => setUrlStatus(''), 3000);
    } catch (err: any) {
      setUrlStatus(`Error: ${err.message || 'Unknown'}`);
      setTimeout(() => setUrlStatus(''), 3000);
    } finally {
      setIsDiscoveringUrls(false);
    }
  }

  async function handleFetchAndTrain() {
    if (!trainingUuid) return;
    const urlList = urls.split('\n').map((u) => u.trim()).filter(Boolean);
    if (urlList.length === 0) return;

    setIsTrainingUrls(true);
    setUrlStatus('Connecting...');

    try {
      const streamData = await api.trainingStreamUrl(trainingUuid);
      const res = await fetch(streamData.url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${streamData.token}`,
        },
        body: JSON.stringify({
          urls: urlList,
          fingerprint: fingerprint || '',
          chunk_size: 512,
          overlap: 50,
          embedding_type: embeddingType || 'free',
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const event of events) {
          const dataLine = event.split('\n').find((l) => l.startsWith('data:'));
          if (!dataLine) continue;
          try {
            const parsed = JSON.parse(dataLine.slice(5).trim());
            if (parsed.status === 'scraping') {
              setUrlStatus(
                parsed.current_url
                  ? `Scraping: ${parsed.current_url} (${parsed.scraped_count} done)`
                  : parsed.message
              );
            } else if (parsed.status === 'chunking' || parsed.status === 'embedding') {
              setUrlStatus(parsed.message);
            } else if (parsed.status === 'complete') {
              setUrlStatus(`Done! ${parsed.page_count} pages, ${parsed.chunk_count} chunks in ${parsed.elapsed_seconds}s`);
              setUrls('');
              setTimeout(() => setUrlStatus(''), 3000);
            }
          } catch { /* skip malformed */ }
        }
      }
    } catch (err: any) {
      setUrlStatus(`Error: ${err.message || 'Unknown'}`);
    } finally {
      setIsTrainingUrls(false);
    }
  }

  function handleCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const lines = text.split('\n').filter((l) => l.trim());
      if (lines.length <= 1) return;
      const headers = lines[0].split(',').map((h) => h.trim());
      const rows = lines.slice(1).map((line) => {
        const cols = line.split(',');
        return headers.map((h, i) => `${h}: ${(cols[i] || '').trim()}`).join('\n');
      });
      setCsvRows(rows);
      setShowCsvPreview(true);
    };
    reader.readAsText(file);
  }

  async function handleBulkSubmit() {
    if (!trainingUuid || csvRows.length === 0) return;
    setBulkAdding(true);
    const count = csvRows.length;
    try {
      await api.addTrainingBulk(trainingUuid, csvRows, fingerprint, embeddingType || 'free');
      setCsvRows([]);
      setShowCsvPreview(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setBulkSuccessMessage(`Done! ${count} rows added.`);
      setTimeout(() => setBulkSuccessMessage(''), 3000);
    } catch (err: any) {
      setBulkSuccessMessage(`Error: ${err.message || 'Unknown'}`);
      setTimeout(() => setBulkSuccessMessage(''), 3000);
    } finally {
      setBulkAdding(false);
    }
  }

  function removeRow(index: number) {
    setCsvRows((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleFileUpload(file: File) {
    resetFileUpload();
    setUploading(true);
    try {
      const result = await api.uploadTrainingFile(file);
      if (result.error) {
        setTrainResult(`Error: ${result.error}`);
        return;
      }
      setFileUuid(result.uuid);
      setFileName(result.fileName);
      setExtractedText(result.text);
    } catch (err: any) {
      setTrainResult(`Error: ${err.message || 'Upload failed'}`);
    } finally {
      setUploading(false);
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }

  async function handleTrainFile() {
    if (!fileUuid || !extractedText.trim() || !trainingUuid) return;
    setTrainingFile(true);
    try {
      const result: any = await api.trainFile(trainingUuid, {
        fileUuid,
        text: extractedText,
        fingerprint,
        chunkSize,
        overlap,
        fileName,
        embeddingType: embeddingType || 'free',
      });
      setTrainResult(`Trained! ${result.chunks || 0} chunks in ${result.time_elapsed || 0}s`);
      setTimeout(() => {
        setTrainResult(null);
        resetFileUpload();
      }, 3000);
    } catch (err: any) {
      setTrainResult(`Error: ${err.message || 'Training failed'}`);
    } finally {
      setTrainingFile(false);
    }
  }

  if (!open) return null;

  return (
    <div className="jug-ai-modal-overlay" onClick={onClose}>
      <div className="jug-ai-modal jug-ai-modal-lg jug-add-training-modal" onClick={(e) => e.stopPropagation()}>
        <div className="jug-ai-modal-header">
          <div>
            <h3>Add More Training Data</h3>
            <p className="jug-ai-muted" style={{ margin: '4px 0 0' }}>Add custom text, URLs, CSV data, or upload files to expand your training.</p>
          </div>
          <button type="button" className="jug-ai-modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="jug-add-training-body">
          {!showCsvPreview ? (
            <>
              {/* Custom text section */}
              <div className="jug-add-training-section">
                <p className="jug-add-training-section-title">Add custom training data</p>
                <textarea
                  className="jug-ai-textarea"
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="Enter your training data..."
                  rows={3}
                />
                {customSuccessMessage && (
                  <p className="jug-ai-muted" style={{ marginTop: '8px' }}>{customSuccessMessage}</p>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                  <button
                    type="button"
                    className="jug-ai-btn-primary"
                    onClick={handleAddText}
                    disabled={addingText || !newText.trim()}
                    style={{ padding: '8px 16px', fontSize: '13px' }}
                  >
                    {addingText && <Spinner size={14} />}
                    Train
                  </button>
                </div>
              </div>

              {/* File upload section */}
              <div className="jug-add-training-section">
                <p className="jug-add-training-section-title">Upload Files</p>
                <p className="jug-ai-muted" style={{ marginBottom: '12px' }}>
                  Upload PDF, DOCX, DOC, or TXT files to extract and train on their content (max 5 MB).
                </p>
                {!fileUuid ? (
                  <div
                    className={`jug-add-training-dropzone${dragOver ? ' dragover' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleFileDrop}
                    onClick={() => document.getElementById('jug-training-file-input')?.click()}
                  >
                    {uploading ? (
                      <Spinner size={32} />
                    ) : (
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.6 }}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="12" y1="18" x2="12" y2="12" />
                        <line x1="9" y1="15" x2="12" y2="12" />
                        <line x1="15" y1="15" x2="12" y2="12" />
                      </svg>
                    )}
                    <p style={{ margin: '8px 0 0', fontSize: '13px', opacity: 0.7 }}>
                      {uploading ? 'Uploading…' : 'Drop file here or click to browse'}
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: '11px', opacity: 0.5 }}>
                      PDF, DOCX, DOC, TXT — max 5 MB
                    </p>
                    <input
                      id="jug-training-file-input"
                      type="file"
                      accept={FILE_ACCEPTED_TYPES}
                      style={{ display: 'none' }}
                      onChange={handleFileInputChange}
                    />
                  </div>
                ) : (
                  <div className="jug-add-training-file-preview">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'middle', marginRight: '6px' }}>
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        {fileName}
                      </span>
                      <button type="button" className="jug-ai-btn-sm" onClick={resetFileUpload}>Remove</button>
                    </div>
                    <textarea
                      className="jug-ai-textarea"
                      value={extractedText}
                      onChange={(e) => setExtractedText(e.target.value)}
                      rows={5}
                      style={{ fontSize: '12px' }}
                    />
                    <button
                      type="button"
                      className="jug-ai-btn-link"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      style={{ marginTop: '8px', fontSize: '12px' }}
                    >
                      {showAdvanced ? 'Hide Advanced' : 'Advanced Settings'}
                    </button>
                    {showAdvanced && (
                      <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                        <div className="jug-ai-field" style={{ flex: 1 }}>
                          <label>Chunk Size</label>
                          <input
                            type="number"
                            value={chunkSize}
                            onChange={(e) => setChunkSize(Number(e.target.value))}
                            min={100}
                            max={2000}
                          />
                        </div>
                        <div className="jug-ai-field" style={{ flex: 1 }}>
                          <label>Overlap</label>
                          <input
                            type="number"
                            value={overlap}
                            onChange={(e) => setOverlap(Number(e.target.value))}
                            min={0}
                            max={500}
                          />
                        </div>
                      </div>
                    )}
                    {trainResult && (
                      <p className="jug-ai-muted" style={{ marginTop: '8px' }}>{trainResult}</p>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                      <button
                        type="button"
                        className="jug-ai-btn-primary"
                        onClick={handleTrainFile}
                        disabled={trainingFile || !extractedText.trim()}
                        style={{ padding: '8px 16px', fontSize: '13px' }}
                      >
                        {trainingFile && <Spinner size={14} />}
                        Train File
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* URLs section */}
              <div className="jug-add-training-section">
                <p className="jug-add-training-section-title">Add URLs</p>
                {siteUrl && (
                  <button
                    type="button"
                    className="jug-ai-btn-link"
                    onClick={handleDiscoverMoreUrls}
                    disabled={isDiscoveringUrls}
                    style={{ fontSize: '12px', marginBottom: '8px', padding: 0, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    {isDiscoveringUrls ? (
                      <Spinner size={12} />
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                    )}
                    Get more URLs from domain (max 25, excludes already scraped)
                  </button>
                )}
                <textarea
                  className="jug-ai-textarea"
                  value={urls}
                  onChange={(e) => setUrls(e.target.value)}
                  placeholder="Enter URLs, one per line..."
                  rows={4}
                />
                {urlStatus && (
                  <p className="jug-ai-muted" style={{ marginTop: '8px' }}>{urlStatus}</p>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                  <button
                    type="button"
                    className="jug-ai-btn-primary"
                    onClick={handleFetchAndTrain}
                    disabled={isTrainingUrls || !urls.trim()}
                    style={{ padding: '8px 16px', fontSize: '13px' }}
                  >
                    {isTrainingUrls && <Spinner size={14} />}
                    Fetch and Train
                  </button>
                </div>
              </div>

              {/* CSV upload section */}
              <div className="jug-add-training-section">
                <p className="jug-add-training-section-title">Bulk CSV Upload</p>
                <p className="jug-ai-muted" style={{ marginBottom: '12px' }}>
                  Upload a CSV file. The first row should be headers; each subsequent row becomes a training entry.
                </p>
                {bulkSuccessMessage && (
                  <p className="jug-ai-muted" style={{ marginBottom: '8px' }}>{bulkSuccessMessage}</p>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleCsvFile}
                  style={{ fontSize: '13px' }}
                />
              </div>
            </>
          ) : (
            <div className="jug-add-training-csv-preview">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <p style={{ fontWeight: 600, margin: 0, fontSize: '14px' }}>CSV Preview ({csvRows.length} rows)</p>
                <button type="button" className="jug-ai-icon-btn" onClick={() => setShowCsvPreview(false)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                  Back
                </button>
              </div>
              <div className="jug-add-training-csv-list">
                {csvRows.map((row, i) => (
                  <div key={i} className="jug-add-training-csv-row">
                    <pre style={{ flex: 1, margin: 0, whiteSpace: 'pre-wrap', fontSize: '12px', fontFamily: 'monospace' }}>{row}</pre>
                    <button
                      type="button"
                      className="jug-training-info-delete-btn"
                      onClick={() => removeRow(i)}
                      style={{ flexShrink: 0 }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="button"
                  className="jug-ai-btn-primary"
                  onClick={handleBulkSubmit}
                  disabled={bulkAdding || csvRows.length === 0}
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                >
                  {bulkAdding && <Spinner size={14} />}
                  Add All ({csvRows.length} rows)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
