import { useState, useEffect } from 'react';
import Icon from '../../../components/shared/Icon';
import Pagination from '../../../components/shared/Pagination';
import { documents, normTypes } from '../../../services/api';
import DocumentForm from './form/DocumentForm';

const PAGE_SIZE = 20;

export default function DocumentsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [editingItem, setEditingItem] = useState(undefined);
  const [normTypeOptions, setNormTypeOptions] = useState([]);

  useEffect(() => {
    normTypes.list().then(res => setNormTypeOptions(res.data ?? res)).catch(() => {});
  }, []);

  const fetchDocs = (targetPage) => {
    const p = targetPage ?? page;
    setLoading(true);
    setError(null);
    documents.list({ page: p, size: PAGE_SIZE })
      .then(res => {
        setItems(res.data);
        setTotal(res.total);
        setTotalPages(res.totalPages);
        if (targetPage != null) setPage(targetPage);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDocs(); }, [page]);

  const handleSave = async (payload) => {
    if (editingItem) {
      await documents.update(editingItem.id, payload);
    } else {
      await documents.create(payload);
    }
    setEditingItem(undefined);
    fetchDocs(1);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this document?')) return;
    try {
      await documents.delete(id);
      fetchDocs(1);
    } catch (e) {
      alert(e.message);
    }
  };

  const showForm = editingItem !== undefined;

  return (
    <div className="crud-page">
      <div className="crud-header">
        <div>
          <h1 className="crud-title">Documents</h1>
          <p className="crud-count">
            {total} document{total !== 1 ? 's' : ''} registered
          </p>
        </div>
        {!showForm && (
          <button onClick={() => setEditingItem(null)} className="crud-add-btn">
            <Icon name="plus" size={14} color="#fff" /> ADD DOCUMENT
          </button>
        )}
      </div>

      {showForm ? (
        <DocumentForm
          item={editingItem}
          normTypeOptions={normTypeOptions}
          onSave={handleSave}
          onCancel={() => setEditingItem(undefined)}
        />
      ) : (
        <div className="crud-table-wrap">
          <div className="overflow-x-auto">
            <table className="crud-table">
              <thead className="crud-thead">
                <tr>
                  <th className="crud-th" style={{width:'3rem'}}>#</th>
                  <th className="crud-th">Number</th>
                  <th className="crud-th">Year</th>
                  <th className="crud-th">Type</th>
                  <th className="crud-th">Summary</th>
                  <th className="crud-th" style={{width:'7rem', textAlign:'center'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr className="crud-row"><td className="crud-state-row" colSpan={6}>Loading…</td></tr>
                ) : error ? (
                  <tr className="crud-row">
                    <td className="crud-state-row" colSpan={6}>
                      <p className="crud-error-text">Failed to load documents</p>
                      <button onClick={() => { setPage(1); fetchDocs(); }} className="crud-retry-btn">Retry</button>
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr className="crud-row"><td className="crud-state-row" colSpan={6}>No documents yet.</td></tr>
                ) : items.map((item, i) => (
                  <tr key={item.id} className="crud-row">
                    <td className="crud-td-mono">{(page - 1) * PAGE_SIZE + i + 1}</td>
                    <td className="crud-td-label">{item.number}</td>
                    <td className="crud-td-label">{item.year}</td>
                    <td className="crud-td-label">{item.norm_type_name ?? item.file_type}</td>
                    <td className="crud-td-label" style={{maxWidth:'20rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{item.summary}</td>
                    <td className="crud-td-actions">
                      <div className="btn-wrap">
                        <button onClick={() => setEditingItem(item)} title="Edit" className="btn-edit">
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
      )}
    </div>
  );
}
