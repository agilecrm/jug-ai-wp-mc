import { useState, useEffect } from '@wordpress/element';
import api from '../../api';
import Spinner from '../shared/Spinner';

interface EmbeddingItem {
  id: string;
  text: string;
  title?: string;
  url?: string;
  type?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  trainingUuid: string | null;
  embeddingType?: string;
}

const PAGE_LIMIT = 100;

export default function TrainingInfoModal({ open, onClose, trainingUuid, embeddingType = 'free' }: Props) {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<EmbeddingItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

  const totalPages = Math.ceil(totalCount / PAGE_LIMIT);

  function fetchEmbeddings(p?: number) {
    if (!trainingUuid) return;
    const targetPage = p ?? page;
    const skip = (targetPage - 1) * PAGE_LIMIT;
    setRefreshing(true);
    api.getTrainingEmbeddings(trainingUuid, skip, PAGE_LIMIT, embeddingType)
      .then((data) => {
        setItems(data.items || []);
        setTotalCount(data.total_count || 0);
      })
      .catch(() => {
        setItems([]);
        setTotalCount(0);
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }

  useEffect(() => {
    if (open && trainingUuid) {
      setPage(1);
      setShowDeleteAllConfirm(false);
      setLoading(true);
      fetchEmbeddings(1);
    }
  }, [open, trainingUuid]);

  useEffect(() => {
    if (open && trainingUuid && !loading) {
      fetchEmbeddings();
    }
  }, [page]);

  function handleDeleteOne(embeddingId: string) {
    if (!trainingUuid) return;
    setDeletingId(embeddingId);
    api.deleteEmbedding(trainingUuid, embeddingId, embeddingType)
      .then(() => fetchEmbeddings())
      .finally(() => setDeletingId(null));
  }

  function handleDeleteAll() {
    if (!trainingUuid) return;
    setDeletingAll(true);
    api.deleteAllEmbeddings(trainingUuid, embeddingType)
      .then(() => {
        setShowDeleteAllConfirm(false);
        fetchEmbeddings();
      })
      .finally(() => setDeletingAll(false));
  }

  const [downloadingCsv, setDownloadingCsv] = useState(false);

  async function handleDownloadCSV() {
    if (!trainingUuid) return;
    function escapeCsv(val: string) {
      const s = val ?? '';
      return '"' + s.replace(/"/g, '""').replace(/\n/g, '\\n').replace(/\r/g, '\\r') + '"';
    }

    setDownloadingCsv(true);
    try {
      // Fetch all records by paginating through the API
      const batchSize = 100;
      let allItems: EmbeddingItem[] = [];
      let skip = 0;
      const firstPage = await api.getTrainingEmbeddings(trainingUuid, 0, batchSize, embeddingType);
      const total = firstPage.total_count || 0;
      allItems = allItems.concat(firstPage.items || []);
      skip += batchSize;

      while (skip < total) {
        const data = await api.getTrainingEmbeddings(trainingUuid, skip, batchSize, embeddingType);
        const batch = data.items || [];
        if (batch.length === 0) break;
        allItems = allItems.concat(batch);
        skip += batchSize;
      }

      if (!allItems.length) return;

      const headers = ['Text', 'Title', 'URL', 'Type'];
      const rows = allItems.map((item) =>
        [escapeCsv(item.text), escapeCsv(item.title || ''), escapeCsv(item.url || ''), escapeCsv(item.type || '')].join(',')
      );
      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'training_data.csv';
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      // silently fail – user can retry
    } finally {
      setDownloadingCsv(false);
    }
  }

  if (!open) return null;

  return (
    <>
      <div className="jug-ai-modal-overlay" onClick={onClose}>
        <div className="jug-ai-modal jug-ai-modal-lg jug-training-info-modal" onClick={(e) => e.stopPropagation()}>
          <div className="jug-ai-modal-header">
            <div>
              <h3>Training Information</h3>
              <p className="jug-ai-muted" style={{ margin: '4px 0 0' }}>View and manage your training embeddings.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className="jug-ai-icon-btn"
                onClick={() => fetchEmbeddings()}
                disabled={refreshing}
                title="Refresh"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={refreshing && !loading ? 'jug-spin-icon' : ''}>
                  <polyline points="23 4 23 10 17 10" />
                  <polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
              </button>
              <button type="button" className="jug-ai-modal-close" onClick={onClose}>&times;</button>
            </div>
          </div>

          {loading ? (
            <div className="jug-ai-center" style={{ padding: '48px' }}>
              <Spinner size={24} />
            </div>
          ) : (
            <div className="jug-training-info-body">
              <div className="jug-training-info-topbar">
                <span className="jug-ai-muted">{totalCount} embeddings total</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {totalCount > 0 && (
                    <button type="button" className="jug-ai-icon-btn" onClick={handleDownloadCSV} disabled={downloadingCsv}>
                      {downloadingCsv ? (
                        <Spinner size={12} />
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      )}
                      {downloadingCsv ? 'Downloading…' : 'CSV'}
                    </button>
                  )}
                  {totalCount > 0 && (
                    <button
                      type="button"
                      className="jug-ai-icon-btn jug-ai-icon-btn-danger"
                      onClick={() => setShowDeleteAllConfirm(true)}
                      disabled={deletingAll}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                      {deletingAll ? 'Deleting…' : 'Delete All'}
                    </button>
                  )}
                </div>
              </div>

              <div className="jug-training-info-list">
                {items.length === 0 ? (
                  <div className="jug-training-info-empty">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.4 }}>
                      <ellipse cx="12" cy="5" rx="9" ry="3" />
                      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                    </svg>
                    <p style={{ fontWeight: 500, margin: '12px 0 4px' }}>No embeddings yet</p>
                    <p className="jug-ai-muted">Add training data from the <strong>Add Training</strong> page — upload a file, add text, or scrape your site.</p>
                  </div>
                ) : (
                  items.map((item) => (
                    <div key={item.id} className="jug-training-info-item">
                      <p className="jug-training-info-text">{item.text}</p>
                      {item.title && (
                        <p className="jug-ai-muted" style={{ fontSize: '12px' }}>
                          <strong>Title:</strong> {item.title}
                        </p>
                      )}
                      {item.url && (
                        <p className="jug-ai-muted jug-training-info-url" style={{ fontSize: '12px' }}>
                          <strong>URL:</strong>{' '}
                          <a href={item.url} target="_blank" rel="noopener noreferrer">{item.url}</a>
                        </p>
                      )}
                      <div className="jug-training-info-item-footer">
                        {item.type && <span className="jug-training-info-badge">{item.type}</span>}
                        <button
                          type="button"
                          className="jug-training-info-delete-btn"
                          onClick={() => setConfirmDeleteId(item.id)}
                          disabled={deletingId === item.id}
                        >
                          {deletingId === item.id ? (
                            <Spinner size={12} />
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {totalPages > 1 && (
                <div className="jug-ai-pagination">
                  <a
                    role="button"
                    className={`jug-ai-pagination-link${page === 1 ? ' disabled' : ''}`}
                    onClick={() => page > 1 && setPage((p) => p - 1)}
                  >
                    ← Prev
                  </a>
                  <span className="jug-ai-muted">{page} / {totalPages}</span>
                  <a
                    role="button"
                    className={`jug-ai-pagination-link${page >= totalPages ? ' disabled' : ''}`}
                    onClick={() => page < totalPages && setPage((p) => p + 1)}
                  >
                    Next →
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showDeleteAllConfirm && (
        <div className="jug-ai-modal-overlay" style={{ zIndex: 100001 }} onClick={() => !deletingAll && setShowDeleteAllConfirm(false)}>
          <div className="jug-ai-modal jug-ai-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="jug-ai-modal-header">
              <h3>Delete All Embeddings</h3>
              <button type="button" className="jug-ai-modal-close" onClick={() => !deletingAll && setShowDeleteAllConfirm(false)}>&times;</button>
            </div>
            <p className="jug-ai-muted" style={{ margin: '0 0 20px', lineHeight: 1.6 }}>
              Delete <strong>ALL</strong> embeddings for this training? This cannot be undone.
            </p>
            <div className="jug-ai-modal-actions">
              <button type="button" className="jug-ai-btn-secondary" onClick={() => setShowDeleteAllConfirm(false)} disabled={deletingAll}>Cancel</button>
              <button type="button" className="jug-ai-btn-danger" onClick={handleDeleteAll} disabled={deletingAll}>
                {deletingAll ? 'Deleting…' : 'Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <div className="jug-ai-modal-overlay" style={{ zIndex: 100001 }} onClick={() => !deletingId && setConfirmDeleteId(null)}>
          <div className="jug-ai-modal jug-ai-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="jug-ai-modal-header">
              <h3>Delete Embedding</h3>
              <button type="button" className="jug-ai-modal-close" onClick={() => !deletingId && setConfirmDeleteId(null)}>&times;</button>
            </div>
            <p className="jug-ai-muted" style={{ margin: '0 0 20px', lineHeight: 1.6 }}>
              Are you sure you want to delete this embedding? This cannot be undone.
            </p>
            <div className="jug-ai-modal-actions">
              <button type="button" className="jug-ai-btn-secondary" onClick={() => setConfirmDeleteId(null)} disabled={!!deletingId}>Cancel</button>
              <button type="button" className="jug-ai-btn-danger" onClick={() => { handleDeleteOne(confirmDeleteId); setConfirmDeleteId(null); }} disabled={!!deletingId}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
