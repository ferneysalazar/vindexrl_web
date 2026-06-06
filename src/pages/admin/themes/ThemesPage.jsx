import { useState, useEffect } from 'react';
import Icon from '../../../components/shared/Icon';
import Pagination from '../../../components/shared/Pagination';
import { themes, subthemes } from '../../../services/api';

const THEME_PAGE_SIZE = 20;
const SUB_PAGE_SIZE = 3;

export default function ThemesPage() {
  const [themeItems, setThemeItems] = useState([]);
  const [themeLoading, setThemeLoading] = useState(true);
  const [themeError, setThemeError] = useState(null);
  const [themePage, setThemePage] = useState(1);
  const [themeTotal, setThemeTotal] = useState(0);
  const [themeTotalPages, setThemeTotalPages] = useState(1);
  const [themeModal, setThemeModal] = useState(null);

  const [subItems, setSubItems] = useState([]);
  const [subLoading, setSubLoading] = useState(true);
  const [subError, setSubError] = useState(null);
  const [subPage, setSubPage] = useState(1);
  const [subTotal, setSubTotal] = useState(0);
  const [subTotalPages, setSubTotalPages] = useState(1);
  const [subModal, setSubModal] = useState(null);

  const [selectedThemeId, setSelectedThemeId] = useState(null);
  const [selectedThemeName, setSelectedThemeName] = useState('');

  const fetchThemes = (targetPage) => {
    setThemeLoading(true);
    setThemeError(null);
    const p = targetPage ?? themePage;
    themes.list({ page: p, size: THEME_PAGE_SIZE })
      .then(res => {
        setThemeItems(res.data);
        setThemeTotal(res.total);
        setThemeTotalPages(res.totalPages);
        if (targetPage != null) setThemePage(targetPage);
      })
      .catch(e => setThemeError(e.message))
      .finally(() => setThemeLoading(false));
  };

  const fetchSubthemes = (targetPage) => {
    if (!selectedThemeId) return;
    setSubLoading(true);
    setSubError(null);
    const p = targetPage ?? subPage;
    subthemes.list(selectedThemeId, { page: p, size: SUB_PAGE_SIZE })
      .then(res => {
        setSubItems(res.data);
        setSubTotal(res.total);
        setSubTotalPages(res.totalPages);
        if (targetPage != null) setSubPage(targetPage);
      })
      .catch(e => { setSubError(e.message); setSubLoading(false); })
      .finally(() => setSubLoading(false));
  };

  useEffect(() => { fetchThemes(); }, [themePage]);
  useEffect(() => { if (selectedThemeId) fetchSubthemes(); }, [subPage, selectedThemeId]);

  const handleThemeSave = async (payload) => {
    try {
      if (themeModal.type === 'create') {
        await themes.create(payload);
      } else {
        await themes.update(themeModal.item.id, payload);
      }
      setThemeModal(null);
      fetchThemes(1);
    } catch (e) { alert(e.message); }
  };

  const handleThemeDelete = async (id) => {
    if (!confirm('Delete this theme?')) return;
    try {
      await themes.delete(id);
      if (selectedThemeId === id) { setSelectedThemeId(null); setSelectedThemeName(''); setSubItems([]); }
      fetchThemes(1);
    } catch (e) { alert(e.message); }
  };

  const handleSubSave = async (payload) => {
    try {
      if (subModal.type === 'create') {
        await subthemes.create({ ...payload, themeId: selectedThemeId });
      } else {
        await subthemes.update(subModal.item.id, { ...payload, themeId: selectedThemeId });
      }
      setSubModal(null);
      fetchSubthemes(1);
    } catch (e) { alert(e.message); }
  };

  const handleSubDelete = async (id) => {
    if (!confirm('Delete this subtheme?')) return;
    try {
      await subthemes.delete(id);
      fetchSubthemes(1);
    } catch (e) { alert(e.message); }
  };

  const handleThemeRowClick = (id, name) => {
    setSelectedThemeId(id);
    setSelectedThemeName(name);
    setSubPage(1);
    fetchSubthemes(1);
  };

  return (
    <div className="crud-page" style={{ minHeight: 0 }}>
      <h1 className="crud-title">Themes &amp; Subthemes</h1>
      <div className="split-panel">
        {/* ─── Themes panel ─── */}
        <div>
          <div className="crud-header" style={{ marginBottom: '0.75rem' }}>
            <h2 className="font-display text-[18px] font-bold text-[#1e2d4a]">Themes</h2>
            <button onClick={() => setThemeModal({ type: 'create' })} className="crud-add-btn" style={{ padding: '0.375rem 0.875rem', fontSize: '10px' }}>
              <Icon name="plus" size={12} color="#fff" /> ADD
            </button>
          </div>
          <div className="crud-table-wrap">
            <table className="crud-table">
              <thead className="crud-thead">
                <tr>
                  <th className="crud-th" style={{width:'2.5rem'}}>#</th>
                  <th className="crud-th">Name</th>
                  <th className="crud-th" style={{width:'5.5rem', textAlign:'center'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {themeLoading ? (
                  <tr><td className="crud-state-row" colSpan={3}>Loading…</td></tr>
                ) : themeError ? (
                  <tr><td className="crud-state-row" colSpan={3}>
                    <p className="crud-error-text">{themeError}</p>
                    <button onClick={fetchThemes} className="crud-retry-btn">Retry</button>
                  </td></tr>
                ) : themeItems.length === 0 ? (
                  <tr><td className="crud-state-row" colSpan={3}>No themes yet.</td></tr>
                ) : themeItems.map((item, i) => (
                  <tr key={item.id}
                    className={`crud-row${String(selectedThemeId) === String(item.id) ? ' selected' : ''}`}
                    onClick={() => handleThemeRowClick(item.id, item.name)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="crud-td-mono">{(themePage - 1) * THEME_PAGE_SIZE + i + 1}</td>
                    <td className="crud-td-label">{item.name}</td>
                    <td className="crud-td-actions">
                      <div className="btn-wrap">
                        <button onClick={e => { e.stopPropagation(); setThemeModal({ type: 'edit', item }); }} title="Edit" className="btn-edit">
                          <Icon name="edit" size={12} color="currentColor" />
                        </button>
                        <button onClick={e => { e.stopPropagation(); handleThemeDelete(item.id); }} title="Delete" className="btn-delete">
                          <Icon name="close" size={12} color="currentColor" />
                        </button>
                      </div>
                    </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination page={themePage} totalPages={themeTotalPages} total={themeTotal} pageSize={THEME_PAGE_SIZE} label="themes" onPageChange={setThemePage} />
            </div>
          </div>

        {/* ─── Subthemes panel ─── */}
        <div>
          <div className="crud-header" style={{ marginBottom: '0.75rem' }}>
            <h2 className="font-display text-[18px] font-bold text-[#1e2d4a]">
              Subthemes{selectedThemeId ? '' : ' (select a theme)'}
            </h2>
            <button onClick={() => setSubModal({ type: 'create' })}
              disabled={!selectedThemeId}
              className="crud-add-btn"
              style={{ padding: '0.375rem 0.875rem', fontSize: '10px', opacity: selectedThemeId ? undefined : '.4' }}
            >
              <Icon name="plus" size={12} color="#fff" /> ADD
            </button>
          </div>
          <div className="crud-table-wrap">
            <table className="crud-table">
              <thead className="crud-thead">
                <tr>
                  <th className="crud-th" style={{width:'2.5rem'}}>#</th>
                  <th className="crud-th">Name</th>
                  <th className="crud-th" style={{width:'5.5rem', textAlign:'center'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subLoading ? (
                  <tr><td className="crud-state-row" colSpan={3}>Loading…</td></tr>
                ) : subError ? (
                  <tr><td className="crud-state-row" colSpan={3}>
                    <p className="crud-error-text">{subError}</p>
                    <button onClick={fetchSubthemes} className="crud-retry-btn">Retry</button>
                  </td></tr>
                ) : !selectedThemeId ? (
                  <tr><td className="crud-state-row" colSpan={3}>Select a theme to see its subthemes.</td></tr>
                ) : subItems.length === 0 ? (
                  <tr><td className="crud-state-row" colSpan={3}>No subthemes for this theme.</td></tr>
                ) : subItems.map((item, i) => (
                  <tr key={item.id} className="crud-row">
                    <td className="crud-td-mono">{(subPage - 1) * SUB_PAGE_SIZE + i + 1}</td>
                    <td className="crud-td-label">{item.name}</td>
                    <td className="crud-td-actions">
                      <div className="btn-wrap">
                        <button onClick={() => setSubModal({ type: 'edit', item })} title="Edit" className="btn-edit">
                          <Icon name="edit" size={12} color="currentColor" />
                        </button>
                        <button onClick={() => handleSubDelete(item.id)} title="Delete" className="btn-delete">
                          <Icon name="close" size={12} color="currentColor" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {selectedThemeId && (
              <Pagination page={subPage} totalPages={subTotalPages} total={subTotal} pageSize={SUB_PAGE_SIZE} label="subthemes" onPageChange={setSubPage} />
            )}
          </div>
        </div>
      </div>

      {/* Theme modal */}
      {themeModal && (
        <NameOnlyModal
          title={themeModal.type === 'create' ? 'New Theme' : 'Edit Theme'}
          item={themeModal.type === 'edit' ? themeModal.item : null}
          onSave={handleThemeSave}
          onClose={() => setThemeModal(null)}
        />
      )}

      {/* Subtheme modal */}
      {subModal && (
        <SubthemeModal
          themeName={selectedThemeName}
          title={subModal.type === 'create' ? 'New Subtheme' : 'Edit Subtheme'}
          item={subModal.type === 'edit' ? subModal.item : null}
          onSave={handleSubSave}
          onClose={() => setSubModal(null)}
        />
      )}
    </div>
  );
}

function SubthemeModal({ themeName, title, item, onSave, onClose }) {
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
            <h2 className="modal-title">{title}</h2>
            <button onClick={onClose} className="modal-close">
              <Icon name="close" size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="modal-form">
            <div>
              <label className="form-label">Theme: {themeName}</label>
            </div>
            <div>
              <label className="form-label">Name</label>
              <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Name" className="form-input" />
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

function NameOnlyModal({ title, item, onSave, onClose }) {
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
            <h2 className="modal-title">{title}</h2>
            <button onClick={onClose} className="modal-close">
              <Icon name="close" size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="modal-form">
            <div>
              <label className="form-label">Name</label>
              <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Name" className="form-input" />
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
