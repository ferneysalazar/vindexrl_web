import { useState, useEffect } from 'react';
import Icon from '../../../components/shared/Icon';
import Pagination from '../../../components/shared/Pagination';
import { normTypes } from '../../../services/api';

const PAGE_SIZE = 5;

export default function DocTypesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [modal, setModal] = useState(null);

  const fetchTypes = (targetPage) => {
    const p = targetPage ?? page;
    setLoading(true);
    setError(null);
    normTypes.list({ page: p, size: PAGE_SIZE })
      .then(res => {
        setItems(res.data);
        setTotal(res.total);
        setTotalPages(res.totalPages);
        if (targetPage != null) setPage(targetPage);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTypes(); }, [page]);

  const handleSave = async (payload) => {
    try {
      if (modal.type === 'create') {
        await normTypes.create(payload);
      } else {
        await normTypes.update(modal.item.id, payload);
      }
      setModal(null);
      fetchTypes(1);
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this document type?')) return;
    try {
      await normTypes.delete(id);
      fetchTypes(1);
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="crud-page">
      <div className="crud-header">
        <div>
          <h1 className="crud-title">Document Types</h1>
          <p className="crud-count">
            {total} type{total !== 1 ? 's' : ''} registered
          </p>
        </div>
        <button onClick={() => setModal({ type: 'create' })} className="crud-add-btn">
          <Icon name="plus" size={14} color="#fff" /> ADD TYPE
        </button>
      </div>

      <div className="crud-table-wrap">
        <div className="overflow-x-auto">
          <table className="crud-table">
            <thead className="crud-thead">
              <tr>
                <th className="crud-th" style={{width:'3rem'}}>#</th>
                <th className="crud-th">Name</th>
                <th className="crud-th" style={{width:'7rem', textAlign:'center'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr className="crud-row"><td className="crud-state-row" colSpan={3}>Loading…</td></tr>
              ) : error ? (
                <tr className="crud-row">
                  <td className="crud-state-row" colSpan={3}>
                    <p className="crud-error-text">Failed to load document types</p>
                    <button onClick={() => { setPage(1); fetchTypes(); }} className="crud-retry-btn">Retry</button>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr className="crud-row"><td className="crud-state-row" colSpan={3}>No document types yet.</td></tr>
              ) : items.map((item, i) => (
                <tr key={item.id} className="crud-row">
                  <td className="crud-td-mono">{(page - 1) * PAGE_SIZE + i + 1}</td>
                  <td className="crud-td-label">{item.name}</td>
                  <td className="crud-td-actions">
                    <div className="btn-wrap">
                      <button onClick={() => setModal({ type: 'edit', item })} title="Edit" className="btn-edit">
                        <Icon name="edit" size={14} color="currentColor" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} title="Delete" className="btn-delete">
                        <Icon name="close" size={14} color="currentColor" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} total={total} pageSize={PAGE_SIZE} label="documents" onPageChange={setPage} />
      </div>

      {modal && (
        <DocTypeModal
          item={modal.type === 'edit' ? modal.item : null}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

function DocTypeModal({ item, onSave, onClose }) {
  const [name, setName] = useState(item?.name ?? '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim() });
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal-container">
        <div className="modal-card" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">{item ? 'Edit' : 'New'} Document Type</h2>
            <button onClick={onClose} className="modal-close">
              <Icon name="close" size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="modal-form">
            <div>
              <label className="form-label">Name</label>
              <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Law, Decree, Resolution" className="form-input" />
            </div>
            <div className="form-actions">
              <button type="button" onClick={onClose} className="btn-cancel">Cancel</button>
              <button type="submit" disabled={!name.trim()} className="btn-submit">
                {item ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
