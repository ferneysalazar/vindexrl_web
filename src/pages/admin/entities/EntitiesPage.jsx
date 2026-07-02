import { useState, useEffect, useCallback, startTransition } from 'react';
import Icon from '../../../components/shared/Icon';
import Pagination from '../../../components/shared/Pagination';
import { entities, xentities } from '../../../services/api';
import { useDataCache } from '../../../contexts/DataCache';

const PAGE_SIZE = 3;

export default function EntitiesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [modal, setModal] = useState(null);
  const { reloadData } = useDataCache();

  const loadPage = useCallback((p) => {
    setLoading(true);
    setError(null);
    xentities.list({ page: p, size: PAGE_SIZE })
      .then(res => {
        setItems(res.data);
        setTotal(res.total);
        setTotalPages(res.totalPages);
        if (p != null) setPage(p);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const fetchItems = useCallback(() => loadPage(page), [loadPage, page]);

  // Wrapped in startTransition: loadPage's own setLoading(true)/setError(null)
  // calls would otherwise be flagged as a synchronous setState-in-effect.
  useEffect(() => { startTransition(() => fetchItems()); }, [fetchItems]);

  const handleSave = async (payload) => {
    try {
      if (modal.type === 'create') {
        await entities.create(payload);
      } else {
        await entities.update(modal.item.id, payload);
      }
      setModal(null);
      loadPage(1);
      reloadData();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this entity?')) return;
    try {
      await entities.delete(id);
      loadPage(1);
      reloadData();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="crud-page">
      <div className="crud-header">
        <div>
          <h1 className="crud-title">Entities</h1>
          <p className="crud-count">
            {total} entit{total !== 1 ? 'ies' : 'y'} registered
          </p>
        </div>
        <button onClick={() => setModal({ type: 'create' })} className="crud-add-btn">
          <Icon name="plus" size={14} color="#fff" /> ADD ENTITY
        </button>
      </div>

      <div className="crud-table-wrap">
        <div className="overflow-x-auto">
          <table className="crud-table">
            <thead className="crud-thead">
              <tr>
                <th className="crud-th" style={{width:'3rem'}}>#</th>
                <th className="crud-th">Name</th>
                <th className="crud-th">Entity Type</th>
                <th className="crud-th">Parent</th>
                <th className="crud-th" style={{width:'7rem', textAlign:'center'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr className="crud-row"><td className="crud-state-row" colSpan={5}>Loading…</td></tr>
              ) : error ? (
                <tr className="crud-row">
                  <td className="crud-state-row" colSpan={5}>
                    <p className="crud-error-text">Failed to load entities</p>
                    <button onClick={() => { setPage(1); fetchItems(); }} className="crud-retry-btn">Retry</button>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr className="crud-row"><td className="crud-state-row" colSpan={5}>No entities yet.</td></tr>
              ) : items.map((item, i) => (
                <tr key={item.id} className="crud-row">
                  <td className="crud-td-mono">{(page - 1) * PAGE_SIZE + i + 1}</td>
                  <td className="crud-td-label">{item.name}</td>
                  <td className="crud-td-label">{item.entityTypeName}</td>
                  <td className="crud-td-label">{item.parentName}</td>
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
        <Pagination page={page} totalPages={totalPages} total={total} pageSize={PAGE_SIZE} label="entities" onPageChange={setPage} />
      </div>

      {modal && (
        <EntityModal
          item={modal.type === 'edit' ? modal.item : null}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

function EntityModal({ item, onSave, onClose }) {
  const [name, setName] = useState(item?.name ?? '');
  const [selectedTypeId, setSelectedTypeId] = useState(item?.entityTypeId ?? '');
  const [parentId, setParentId] = useState(item?.parentId ?? '');
  const { entityTypeList, entityList } = useDataCache();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !selectedTypeId) return;
    onSave({
      name: name.trim(),
      entityTypeId: selectedTypeId,
      parentId: parentId || null,
    });
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal-container">
        <div className="modal-card" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">{item ? 'Edit' : 'New'} Entity</h2>
            <button onClick={onClose} className="modal-close">
              <Icon name="close" size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="modal-form">
            <div>
              <label className="form-label">Name</label>
              <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Entity name" className="form-input" />
            </div>
            <div>
              <label className="form-label">Entity Type</label>
              <select value={selectedTypeId} onChange={e => setSelectedTypeId(e.target.value)} className="form-select">
                <option value="">Select an entity type</option>
                {entityTypeList.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">parent Entity</label>
              <select value={parentId} onChange={e => setParentId(e.target.value)} className="form-select">
                <option value="">No parent entity</option>
                {entityList.filter(e => !item || String(e.id) !== String(item.id)).map(e => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </div>
            <div className="form-actions">
              <button type="button" onClick={onClose} className="btn-cancel">Cancel</button>
              <button type="submit" disabled={!name.trim() || !selectedTypeId} className="btn-submit">
                {item ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
