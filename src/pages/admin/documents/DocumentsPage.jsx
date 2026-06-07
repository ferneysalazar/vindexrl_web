import { useState, useEffect } from 'react';
import Icon from '../../../components/shared/Icon';
import Pagination from '../../../components/shared/Pagination';
import { documents, xdocuments } from '../../../services/api';
import DocumentForm from './form/DocumentForm';

const PAGE_SIZE = 2;

export default function DocumentsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [editingItem, setEditingItem] = useState(undefined);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDocs = (targetPage, withSearch) => {
    const p = targetPage ?? page;
    const params = { page: p, size: PAGE_SIZE };
    if (withSearch) {
      const q = searchQuery.trim();
      if (q && q.length >= 3) params.searchText = q;
    }
    setLoading(true);
    setError(null);
    xdocuments.list(params)
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
    let docId;
    if (editingItem) {
      await documents.update(editingItem.id, payload);
      docId = editingItem.id;
    } else {
      const res = await documents.create(payload);
      docId = res?.id ?? res?.data?.id;
    }
    setEditingItem(undefined);
    fetchDocs(1);
    return docId;
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
          onSave={handleSave}
          onCancel={() => setEditingItem(undefined)}
        />
      ) : (
        <><div className="flex items-center justify-between gap-3 px-4 py-2 bg-[#f4f6fb] border-b border-slate-200 rounded-t-xl">
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') fetchDocs(1, true); }}
                placeholder="Search documents…" className="field-input pr-16 text-[13px]" />
              <button onClick={() => fetchDocs(1, true)} disabled={searchQuery.trim().length < 3}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center
                  rounded-md hover:bg-[#e8edf7] transition-colors text-slate-400 hover:text-[#1e2d4a] disabled:opacity-30 disabled:cursor-not-allowed">
                <Icon name="search" size={15} color="currentColor" />
              </button>
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); fetchDocs(1); }}
                  className="absolute right-8 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center
                    rounded-md hover:bg-[#e8edf7] transition-colors text-slate-400 hover:text-[#1e2d4a]">
                  <Icon name="close" size={14} color="currentColor" />
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => fetchDocs(1, true)} title="Refresh"
              className="w-8 h-8 rounded-lg flex items-center justify-center
                text-slate-500 hover:text-[#1e2d4a] hover:bg-slate-200 transition-colors">
              <Icon name="refresh" size={16} color="currentColor" />
            </button>
            <div className="flex items-center gap-1 pl-2 border-l border-slate-300">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                className="w-7 h-7 rounded flex items-center justify-center text-slate-500 hover:bg-slate-200 disabled:text-slate-300 disabled:cursor-not-allowed transition-colors">
                <Icon name="chev_l" size={15} color="currentColor" />
              </button>
              <span className="text-[12px] text-slate-500 font-medium px-1 whitespace-nowrap">Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
                className="w-7 h-7 rounded flex items-center justify-center text-slate-500 hover:bg-slate-200 disabled:text-slate-300 disabled:cursor-not-allowed transition-colors">
                <Icon name="chev_r" size={15} color="currentColor" />
              </button>
            </div>
          </div>
        </div>
        <div className="crud-table-wrap" style={{borderTopLeftRadius:0, borderTopRightRadius:0}}>
          <div className="overflow-x-auto">
            <table className="crud-table">
              <thead className="crud-thead">
                <tr>
                  <th className="crud-th" style={{width:'3rem'}}>#</th>
                  <th className="crud-th">Number</th>
                  <th className="crud-th">Year</th>
                  <th className="crud-th">DocumentType</th>
                  <th className="crud-th">Document</th>
                  <th className="crud-th" style={{width:'6rem', textAlign:'center'}}>Subthemes</th>
                  <th className="crud-th" style={{width:'7rem', textAlign:'center'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                  {loading ? (
                    <tr className="crud-row"><td className="crud-state-row" colSpan={7}>Loading…</td></tr>
                  ) : error ? (
                    <tr className="crud-row">
                      <td className="crud-state-row" colSpan={7}>
                        <p className="crud-error-text">Failed to load documents</p>
                        <button onClick={() => { setPage(1); fetchDocs(1, true); }} className="crud-retry-btn">Retry</button>
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr className="crud-row"><td className="crud-state-row" colSpan={7}>No documents yet.</td></tr>
                  ) : items.map((item, i) => (
                    <tr key={item.id} className="crud-row">
                      <td className="crud-td-mono">{(page - 1) * PAGE_SIZE + i + 1}</td>
                      <td className="crud-td-label">{item.number}</td>
                      <td className="crud-td-label">{item.year}</td>
                      <td className="crud-td-label">{item.normTypeName}</td>
                      <td className="crud-td-label" style={{maxWidth:'20rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{item.documentName}{item.entityCount > 1 ? <span className="text-[#c0392b] cursor-default" title={`This document has ${item.entityCount} entities`}> [+{item.entityCount - 1}]</span> : ''}</td>
                      <td className="crud-td-label" style={{textAlign:'center'}}>{item.subthemeCount ?? 0}</td>
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
      </>)}
    </div>
  );
}
