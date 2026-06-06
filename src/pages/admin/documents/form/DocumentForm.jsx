import { useState, useEffect, useMemo } from 'react';
import Icon from '../../../../components/shared/Icon';
import { Section, Field, Select } from './fields';
import EntitiesField from './EntitiesField';
import ThemesField from './ThemesField';
import { CHARSETS, DESC_MAX, uid } from './referenceData';
import { documentEntities, xsubthemes, documentSubthemes } from '../../../../services/api';
import { useDataCache } from '../../../../contexts/DataCache';

const CURRENT_YEAR = new Date().getFullYear();

export default function DocumentForm({ item, onSave, onCancel }) {
  const isEdit = !!item;

  const initStr = (val) => val ?? '';

  const { normNames, normNameToId, entityList, themeNames, themeTree, themeNameToId, subthemeList } = useDataCache();
  const entityNameToId = Object.fromEntries(entityList.map(e => [e.name, e.id]));
  const entityIdToName = Object.fromEntries(entityList.map(e => [e.id, e.name]));
  const entityNames = entityList.map(e => e.name);
  const [docType, setDocType]     = useState(isEdit ? (item.normTypeName ?? '') : '');
  const [docNumber, setDocNum]    = useState(initStr(item?.number));
  const [year, setYear]           = useState(initStr(item?.year?.toString()));
  const [description, setDesc]    = useState(initStr(item?.summary));
  const [entities, setEntities]   = useState(isEdit ? [] : [{ id: uid(), value: '' }]);
  const [issueDate, setIssue]     = useState(initStr(item?.issued_date));
  const [effectDate, setEffect]   = useState(initStr(item?.effective_date));
  const [media, setMedia]         = useState(initStr(item?.published_in));
  const [keyword, setKeyword]     = useState(initStr(item?.key_words));
  const [themeRows, setThemeRows] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saveError, setSaveError] = useState(null);
  const [externalUrl, setExternalUrl] = useState(initStr(item?.external_url));
  const [charset, setCharset]     = useState('');
  const [hasPdf, setHasPdf]       = useState(isEdit ? !!item.file_name : false);
  const [pdfName, setPdfName]     = useState(initStr(item?.file_name));

  const [savedEntities, setSavedEntities] = useState([]);
  const [entitiesLoading, setEntitiesLoading] = useState(isEdit);
  const [entitySaving, setEntitySaving] = useState(false);
  const [showEntityPopup, setShowEntityPopup] = useState(false);
  const [popupEntityId, setPopupEntityId] = useState(null);
  const [popupMode, setPopupMode] = useState('add');
  const [popupOriginalValue, setPopupOriginalValue] = useState('');

  const [showSubthemePopup, setShowSubthemePopup] = useState(false);
  const [subthemePopupMode, setSubthemePopupMode] = useState('add');
  const [subthemePopupRowId, setSubthemePopupRowId] = useState(null);
  const [subthemeForm, setSubthemeForm] = useState({ theme: '', sub: '', detail: '' });

  useEffect(() => {
    if (!isEdit) return;
    setEntitiesLoading(true);
    const entityIdToName = Object.fromEntries(entityList.map(e => [e.id, e.name]));
    documentEntities.list(item.id).catch(() => [])
      .then(docEntityRes => {
        const dData = docEntityRes?.data ?? docEntityRes ?? [];
        const resolve = (e) => e.entityName ?? e.entity?.name ?? entityIdToName[e.entityId] ?? '';
        const mapped = (dData || []).map(e => ({
          id: uid(),
          value: resolve(e),
          docEntityId: e.id,
        }));
        if (!mapped.length) mapped.push({ id: uid(), value: '' });
        setEntities(mapped);
        setSavedEntities(JSON.parse(JSON.stringify(mapped)));
      })
      .catch(() => {
        const fallback = [{ id: uid(), value: initStr(item?.requester) }];
        setEntities(fallback);
        setSavedEntities(JSON.parse(JSON.stringify(fallback)));
      })
      .finally(() => setEntitiesLoading(false));
  }, [isEdit, item?.id, entityList]);

  useEffect(() => {
    if (!isEdit) return;
    xsubthemes.list(item.id, { page: 1, size: 10 })
      .then(res => {
        const data = res?.data ?? [];
        setThemeRows(data.map(s => ({ id: uid(), theme: s.themeName, sub: s.subthemeName, detail: s.detail, docSubthemeId: s.id })));
      })
      .catch(() => {});
  }, [isEdit, item?.id]);

  const clearError = (field) => setFieldErrors(prev => ({ ...prev, [field]: '' }));

  const initialValues = useMemo(() => ({
    docType: isEdit ? (item.normTypeName ?? '') : '',
    docNumber: initStr(item?.number),
    year: initStr(item?.year?.toString()),
    description: initStr(item?.summary),
    issueDate: initStr(item?.issued_date),
    effectDate: initStr(item?.effective_date),
    media: initStr(item?.published_in),
    keyword: initStr(item?.key_words),
    externalUrl: initStr(item?.external_url),
    hasPdf: isEdit ? !!item.file_name : false,
    pdfName: initStr(item?.file_name),
  }), []);

  const isFormDirty =
    docType !== initialValues.docType ||
    docNumber !== initialValues.docNumber ||
    year !== initialValues.year ||
    description !== initialValues.description ||
    issueDate !== initialValues.issueDate ||
    effectDate !== initialValues.effectDate ||
    media !== initialValues.media ||
    keyword !== initialValues.keyword ||
    externalUrl !== initialValues.externalUrl ||
    hasPdf !== initialValues.hasPdf ||
    pdfName !== initialValues.pdfName;

  const entitiesChanged = useMemo(() => {
    if (entities.length !== savedEntities.length) return true;
    return entities.some((e, i) => e.value !== (savedEntities[i]?.value ?? ''));
  }, [entities, savedEntities]);

  const isUpdateDisabled = isEdit && (!isFormDirty || entitiesChanged);

  const handleSubmit = () => {
    const errors = {};
    if (!docType) errors.docType = 'Document type is required';
    if (!docNumber) errors.docNumber = 'Document number is required';
    if (!year) errors.year = 'Year is required';
    else {
      const n = parseInt(year, 10);
      if (isNaN(n) || n < 1900 || n > CURRENT_YEAR) errors.year = `Year must be between 1900 and ${CURRENT_YEAR}`;
    }
    if (!description) errors.description = 'Summary is required';

    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    const payload = {
      number: docNumber || undefined,
      year: year || undefined,
      summary: description || undefined,
      issuedDate: issueDate || undefined,
      effectiveDate: effectDate || null,
      externalUrl: externalUrl || null,
      fileName: hasPdf ? (pdfName || undefined) : null,
      normTypeId: docType ? (normNameToId[docType] || undefined) : undefined,
      fileType: null,
      internalNumber: null,
      keyWords: keyword || undefined,
      level: null,
      month: null,
      additionalPdf: false,
      exclusive: false,
      publishedIn: media || undefined,
    };
    setSaveError(null);
    onSave(payload).catch(e => setSaveError(e.message));
  };

  const resolveEntityName = (e) => {
    return e.entityName ?? e.entity?.name ?? entityIdToName[e.entityId] ?? '';
  };

  const syncEntitiesFromServer = () => {
    return documentEntities.list(item.id)
      .then(res => {
        const data = res.data ?? res ?? [];
        const mapped = (data || []).map(e => ({
          id: uid(),
          value: resolveEntityName(e),
          docEntityId: e.id,
        }));
        if (!mapped.length) mapped.push({ id: uid(), value: '' });
        setEntities(mapped);
        setSavedEntities(JSON.parse(JSON.stringify(mapped)));
      });
  };

  const handleEntityUpdate = async () => {
    if (!isEdit || !item?.id) return;
    setEntitySaving(true);
    try {
      for (const entity of entities) {
        if (!entity.value) continue;
        const entityId = entityNameToId[entity.value];
        if (!entityId) continue;
        if (entity.docEntityId) {
          await documentEntities.update(item.id, entity.docEntityId, { entityId });
        } else {
          await documentEntities.create(item.id, { entityId });
        }
      }
      await syncEntitiesFromServer();
    } catch (e) {
      setSaveError('Error saving entity: ' + e.message);
    } finally {
      setEntitySaving(false);
    }
  };

  const handleEntityCancel = () => {
    if (savedEntities.length) {
      setEntities(JSON.parse(JSON.stringify(savedEntities)));
    } else {
      setEntities([{ id: uid(), value: '' }]);
    }
  };

  const handleRowUpdate = async (localId) => {
    const entity = entities.find(e => e.id === localId);
    if (!entity || !entity.value || !isEdit || !item?.id) return false;
    const eid = entityNameToId[entity.value];
    if (!eid) return false;
    setEntitySaving(true);
    try {
      if (entity.docEntityId) {
        await documentEntities.update(item.id, entity.docEntityId, { entityId: eid });
      } else {
        await documentEntities.create(item.id, { entityId: eid });
      }
      await syncEntitiesFromServer();
      return true;
    } catch (e) {
      setSaveError('Error saving entity: ' + e.message);
      return false;
    } finally {
      setEntitySaving(false);
    }
  };

  const handlePopupUpdate = async (entityId) => {
    const ok = await handleRowUpdate(entityId);
    if (ok) setShowEntityPopup(false);
  };

  const handleRowDelete = async (entityId) => {
    const entity = entities.find(e => e.id === entityId);
    if (!entity || !entity.docEntityId || !isEdit || !item?.id) return;
    setEntitySaving(true);
    try {
      await documentEntities.delete(item.id, entity.docEntityId);
      const updated = entities.filter(e => e.id !== entityId);
      if (!updated.length) updated.push({ id: uid(), value: '' });
      setEntities(updated);
      setSavedEntities(prev => prev.filter(e => e.docEntityId !== entity.docEntityId));
    } catch (e) {
      setSaveError('Error deleting entity: ' + e.message);
    } finally {
      setEntitySaving(false);
    }
  };

  const handleRowEdit = (entity) => {
    setPopupEntityId(entity.id);
    setPopupOriginalValue(entity.value);
    setPopupMode('edit');
    setShowEntityPopup(true);
  };

  const handlePopupCancel = (entityId) => {
    if (popupMode === 'edit') {
      setEntities(prev => prev.map(e => e.id === entityId ? { ...e, value: popupOriginalValue } : e));
    } else {
      setEntities(prev => prev.filter(e => e.id !== entityId));
    }
    setShowEntityPopup(false);
  };

  const handleRowCancel = (entityId) => {
    const saved = savedEntities.find(e => e.id === entityId);
    if (saved) {
      setEntities(prev => prev.map(e => e.id === entityId ? { ...e, value: saved.value } : e));
    } else {
      setEntities(prev => {
        const filtered = prev.filter(e => e.id !== entityId);
        return filtered.length ? filtered : [{ id: uid(), value: '' }];
      });
    }
  };

  const resolveSubthemeId = (themeName, subName) => {
    const themeId = themeNameToId?.[themeName];
    return themeId
      ? subthemeList.find(s => s.name === subName && s.themeId === themeId)?.id
      : undefined;
  };

  const handleOpenAddSubtheme = () => {
    setSubthemeForm({ theme: '', sub: '', detail: '' });
    setSubthemePopupMode('add');
    setSubthemePopupRowId(null);
    setShowSubthemePopup(true);
  };

  const handleOpenEditSubtheme = (row) => {
    setSubthemeForm({ theme: row.theme, sub: row.sub, detail: row.detail ?? '' });
    setSubthemePopupMode('edit');
    setSubthemePopupRowId(row.id);
    setShowSubthemePopup(true);
  };

  const handleSaveSubtheme = async () => {
    if (!isEdit || !item?.id || !subthemeForm.theme || !subthemeForm.sub) return;
    const subthemeId = resolveSubthemeId(subthemeForm.theme, subthemeForm.sub);
    if (!subthemeId) return;
    const body = { detail: subthemeForm.detail || null, subthemeId, remarks: null };
    try {
      if (subthemePopupMode === 'edit') {
        const row = themeRows.find(r => r.id === subthemePopupRowId);
        if (row?.docSubthemeId) {
          await documentSubthemes.update(item.id, row.docSubthemeId, body);
        }
        setThemeRows(prev => prev.map(r =>
          r.id === subthemePopupRowId
            ? { ...r, theme: subthemeForm.theme, sub: subthemeForm.sub, detail: subthemeForm.detail }
            : r
        ));
      } else {
        const res = await documentSubthemes.create(item.id, body);
        setThemeRows(prev => [...prev, { id: uid(), theme: subthemeForm.theme, sub: subthemeForm.sub, detail: subthemeForm.detail, docSubthemeId: res?.id ?? res?.data?.id }]);
      }
      setShowSubthemePopup(false);
    } catch (e) {
      setSaveError('Error saving subtheme: ' + e.message);
    }
  };

  const handleDeleteSubtheme = async (rowId) => {
    if (!isEdit || !item?.id) return;
    const row = themeRows.find(r => r.id === rowId);
    if (row?.docSubthemeId) {
      try {
        await documentSubthemes.delete(item.id, row.docSubthemeId);
      } catch (e) {
        setSaveError('Error deleting subtheme: ' + e.message);
        return;
      }
    }
    setThemeRows(prev => prev.filter(r => r.id !== rowId));
  };

  const handleCancelSubthemePopup = () => {
    setShowSubthemePopup(false);
  };

  return (
    <div className="flex flex-col gap-5">
      {saveError && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-[#fde8e8] border border-[#c0392b]/30 text-[#c0392b]">
          <Icon name="info" size={16} color="#c0392b" className="mt-0.5 shrink-0" />
          <p className="text-[13px] flex-1">{saveError}</p>
          <button onClick={() => setSaveError(null)} className="shrink-0 hover:opacity-70">
            <Icon name="close" size={16} color="#c0392b" />
          </button>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[24px] font-bold text-[#1e2d4a] leading-none">
            {isEdit ? 'Edit Document' : 'New Document'}
          </h1>
          <p className="text-[12px] text-slate-400 mt-1.5">Create and classify a legal document</p>
        </div>
        <button onClick={() => { if (confirm('Changes you made in the form could be lost. Are you sure you want to leave?')) onCancel(); }}
          className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center
            text-slate-500 hover:text-[#1e2d4a] transition-colors" title="Close">
          <Icon name="close" size={18} color="currentColor" />
        </button>
      </div>

      <Section icon="doctypes" title="Identification" sub="Type · Number · Year — the unique reference">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Document Type" required error={fieldErrors.docType}>
            <Select value={docType} onChange={e => { setDocType(e.target.value); clearError('docType'); }} options={normNames} placeholder="Select type…" />
          </Field>
          <Field label="Document Number" required error={fieldErrors.docNumber}>
            <input type="text" value={docNumber} onChange={e => { setDocNum(e.target.value); clearError('docNumber'); }}
              placeholder="e.g. 001/2026" className="field-input" />
          </Field>
          <Field label="Year" required error={fieldErrors.year}>
            <input type="number" min={1900} max={CURRENT_YEAR} value={year}
              onChange={e => { const v = e.target.value; if (v === '' || parseInt(v, 10) <= CURRENT_YEAR) setYear(v); clearError('year'); }}
              placeholder={`1900 – ${CURRENT_YEAR}`} className="field-input no-spinner" />
          </Field>
        </div>
      </Section>

      <Section icon="documents" title="Summary" sub="A concise summary of the document">
        <Field label="Summary" required error={fieldErrors.description}>
          <textarea value={description} maxLength={DESC_MAX} onChange={e => setDesc(e.target.value)}
            rows={3} placeholder="Brief description of the document's content and purpose…"
            className="field-input resize-none leading-relaxed" />
          <div className="flex justify-end mt-1.5">
            <span className={`text-[11px] font-semibold ${description.length > DESC_MAX - 20 ? 'text-[#c0392b]' : 'text-slate-400'}`}>
              {description.length} / {DESC_MAX}
            </span>
          </div>
        </Field>
      </Section>

      <Section icon="entities" title="Publication" sub="Issuing entities and key dates">
        <div className="flex flex-col gap-4">
          <div className={!isEdit ? 'diagonal-pattern rounded-lg p-3 -mx-3' : ''}>
            <Field label="Publisher Entity" required
              hint={!isEdit ? 'Save the document first, then edit to assign entities.' : undefined}>
              {entitiesLoading ? (
                <div className="field-input flex items-center text-slate-400 text-[13px]">Loading entities…</div>
              ) : (
                <EntitiesField
                  entities={entities}
                  disabled={!isEdit}
                  onRowDelete={handleRowDelete}
                  onAddEntity={() => {
                    const newEntity = { id: uid(), value: '' };
                    setEntities(prev => [...prev, newEntity]);
                    setPopupEntityId(newEntity.id);
                    setPopupMode('add');
                    setShowEntityPopup(true);
                  }}
                  onRowEdit={handleRowEdit}
                  saving={entitySaving}
                />
              )}
            </Field>
          </div>

          {showEntityPopup && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
                <h3 className="text-[16px] font-bold text-[#1e2d4a] mb-5">Add/Modify Publisher Entity</h3>
                <div className="flex flex-col gap-4">
                  <div className="relative">
                    <select value={entities.find(e => e.id === popupEntityId)?.value ?? ''} onChange={e => {
                      setEntities(prev => prev.map(ent => ent.id === popupEntityId ? { ...ent, value: e.target.value } : ent));
                    }} disabled={!isEdit}
                      className="field-input appearance-none cursor-pointer pr-9 bg-white disabled:opacity-50 disabled:cursor-not-allowed w-full">
                      <option value="">Select entity…</option>
                      {entityNames.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <Icon name="chev_d" size={16} color="#9aa3bd"
                      className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <div className="flex items-center gap-3 justify-end">
                    <button onClick={() => handlePopupCancel(popupEntityId)}
                      className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-500 text-[13px] font-bold hover:bg-slate-50 transition-colors">
                      Cancel
                    </button>
                    <button onClick={() => handlePopupUpdate(popupEntityId)} disabled={entitySaving || !entities.find(e => e.id === popupEntityId)?.value}
                      className="px-5 py-2.5 rounded-lg bg-[#c0392b] text-white text-[13px] font-bold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
                      Update document entity
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Issued Date">
              <input type="date" value={issueDate} onChange={e => { setIssue(e.target.value); clearError('issueDate'); }} className="field-input" />
            </Field>
            <Field label="Effective Date">
              <input type="date" value={effectDate} onChange={e => setEffect(e.target.value)} className="field-input" />
            </Field>
          </div>
        </div>
      </Section>

      <Section icon="themes" title="Themes & Subthemes" sub="Classify the document by theme and subtheme" disabled={!isEdit}>
        <Field label="Themes & Subthemes"
          hint={'Shows the first assignment. Click \u201cDetails\u201d to view, add or remove all theme / subtheme records.'}>
          <ThemesField rows={themeRows} disabled={!isEdit} themeNames={themeNames} themeTree={themeTree}
            onAdd={handleOpenAddSubtheme}
            onEdit={handleOpenEditSubtheme}
            onDelete={handleDeleteSubtheme} />
        </Field>
      </Section>

      {showSubthemePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-[16px] font-bold text-[#1e2d4a] mb-5">Add/Modify Subtheme</h3>
            <div className="flex flex-col gap-4">
              <div className="relative">
                <select value={subthemeForm.theme} onChange={e => { setSubthemeForm(prev => ({ ...prev, theme: e.target.value, sub: '' })); }}
                  disabled={!isEdit}
                  className="field-input appearance-none cursor-pointer pr-9 bg-white disabled:opacity-50 disabled:cursor-not-allowed w-full">
                  <option value="">Select theme…</option>
                  {(themeNames ?? []).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <Icon name="chev_d" size={16} color="#9aa3bd"
                  className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <div className="relative">
                <select value={subthemeForm.sub} onChange={e => setSubthemeForm(prev => ({ ...prev, sub: e.target.value }))}
                  disabled={!isEdit || !subthemeForm.theme}
                  className="field-input appearance-none cursor-pointer pr-9 bg-white disabled:opacity-50 disabled:cursor-not-allowed w-full">
                  <option value="">{subthemeForm.theme ? 'Select subtheme…' : 'Pick theme first'}</option>
                  {subthemeForm.theme && (themeTree?.[subthemeForm.theme] ?? []).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <Icon name="chev_d" size={16} color="#9aa3bd"
                  className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <textarea value={subthemeForm.detail} onChange={e => setSubthemeForm(prev => ({ ...prev, detail: e.target.value }))}
                rows={3} disabled={!isEdit}
                placeholder="Detail (optional)…" className="field-input resize-none" />
              <div className="flex items-center gap-3 justify-end">
                <button onClick={handleCancelSubthemePopup}
                  className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-500 text-[13px] font-bold hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button onClick={handleSaveSubtheme} disabled={!isEdit || !subthemeForm.theme || !subthemeForm.sub}
                  className="px-5 py-2.5 rounded-lg bg-[#c0392b] text-white text-[13px] font-bold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
                  {subthemePopupMode === 'edit' ? 'Update document subtheme' : 'Add document subtheme'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Section icon="tag" title="Metadata" sub="Publishing media, keywords and classification">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Published In">
              <input type="text" value={media} onChange={e => setMedia(e.target.value)}
                placeholder="e.g. Official Gazette No. 142" className="field-input" />
            </Field>
            <Field label="Keyword">
              <input type="text" value={keyword} onChange={e => setKeyword(e.target.value)}
                placeholder="e.g. taxation, compliance" className="field-input" />
            </Field>
          </div>
          <Field label="External URL">
            <input type="text" value={externalUrl} onChange={e => setExternalUrl(e.target.value)}
              placeholder="https://..." className="field-input" />
          </Field>
          <Field label="Character Set" className="sm:max-w-[280px]">
            <Select value={charset} onChange={e => setCharset(e.target.value)} options={CHARSETS} placeholder="Select character set…" />
          </Field>
        </div>
      </Section>

      <Section icon="pdf" title="PDF Document" sub="Attach a digital copy if available" disabled={!isEdit}>
        <div className="flex flex-col gap-4">
          <button onClick={() => { if (isEdit) setHasPdf(v => !v); }} type="button"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all text-left
              ${!isEdit ? 'opacity-50 cursor-not-allowed' : hasPdf ? 'border-[#c0392b] bg-[#c0392b]/5' : 'border-[#e2e6ef] bg-[#f9fafc] hover:border-slate-300'}`}>
            <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all
              ${hasPdf ? 'bg-[#c0392b]' : 'bg-white border border-slate-300'}`}>
              {hasPdf && <Icon name="check" size={13} color="#fff" />}
            </div>
            <div>
              <div className="text-[13px] font-semibold text-[#1e2d4a]">This document has a PDF file</div>
              <div className="text-[11px] text-slate-400">Check to record the associated PDF file name</div>
            </div>
          </button>

          <Field label="PDF File Name" required={hasPdf}
            hint={!isEdit ? 'Save the document first, then edit to attach a PDF.' : (!hasPdf ? 'Enable the checkbox above to enter the PDF file name.' : undefined)}>
            <input type="text" value={pdfName} onChange={e => { if (isEdit) setPdfName(e.target.value); }}
              disabled={!isEdit || !hasPdf}
              placeholder="e.g. regulation-001-2026.pdf"
              className="field-input disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[#f4f6fb]" />
          </Field>
        </div>
      </Section>

      <div className="bg-white rounded-xl shadow-sm px-6 py-4 flex items-center justify-between gap-3 sticky bottom-4">
        <span className="text-[12px] text-slate-400 flex items-center gap-1.5">
          <Icon name="info" size={14} color="#9aa3bd" />
          <span className="req font-semibold text-slate-500">Required fields</span>
        </span>
        <div className="flex items-center gap-3">
          <button type="button" onClick={onCancel} className="px-5 py-2.5 rounded-lg bg-slate-100 text-slate-500 text-[12px] font-bold
            hover:bg-slate-200 transition-colors tracking-wide">CANCEL</button>
          <button onClick={handleSubmit}
            disabled={isUpdateDisabled}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-white text-[12px] font-bold
              tracking-wide transition-all ${isUpdateDisabled ? 'bg-slate-400 cursor-not-allowed shadow-none' : 'bg-[#c0392b] hover:opacity-90'}`}
            style={isUpdateDisabled ? {} : { boxShadow: '0 4px 16px rgba(192,57,43,0.35)' }}>
            <Icon name="save" size={15} color="#fff" /> {isEdit ? 'UPDATE DOCUMENT' : 'SAVE DOCUMENT'}
          </button>
        </div>
      </div>
    </div>
  );
}
