import { useState } from 'react';
import Icon from '../../../../components/shared/Icon';
import { Section, Field, Select } from './fields';
import EntitiesField from './EntitiesField';
import ThemesField from './ThemesField';
import { CHARSETS, DESC_MAX, uid } from './referenceData';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 30 }, (_, i) => String(CURRENT_YEAR - i));

export default function DocumentForm({ item, normTypeOptions, onSave, onCancel }) {
  const isEdit = !!item;

  const initStr = (val) => val ?? '';
  const initArr = (val) => val ?? [];

  const normNames = normTypeOptions.map(n => n.name);
  const normNameToId = {};
  normTypeOptions.forEach(n => { normNameToId[n.name] = n.id; });
  const normIdToName = {};
  normTypeOptions.forEach(n => { normIdToName[n.id] = n.name; });

  const [docType, setDocType]     = useState(isEdit ? (normIdToName[item.norm_type_id] ?? '') : '');
  const [docNumber, setDocNum]    = useState(initStr(item?.number));
  const [year, setYear]           = useState(initStr(item?.year?.toString()));
  const [description, setDesc]    = useState(initStr(item?.summary));
  const [entities, setEntities]   = useState(isEdit ? [{ id: uid(), value: initStr(item?.requester) }] : [{ id: uid(), value: '' }]);
  const [issueDate, setIssue]     = useState(initStr(item?.issued_date));
  const [effectDate, setEffect]   = useState(initStr(item?.effective_date));
  const [media, setMedia]         = useState(initStr(item?.published_in));
  const [keyword, setKeyword]     = useState(initStr(item?.key_words));
  const [themeRows, setThemeRows] = useState([]);
  const [charset, setCharset]     = useState('');
  const [hasPdf, setHasPdf]       = useState(isEdit ? !!item.file_name : false);
  const [pdfName, setPdfName]     = useState(initStr(item?.file_name));

  const handleSubmit = () => {
    const payload = {
      number: docNumber || undefined,
      year: year ? parseInt(year, 10) : undefined,
      summary: description || undefined,
      requester: entities.map(e => e.value).filter(Boolean)[0] || undefined,
      issued_date: issueDate || undefined,
      effective_date: effectDate || null,
      published_in: media || undefined,
      key_words: keyword || undefined,
      norm_type_id: docType ? (normNameToId[docType] || undefined) : undefined,
      file_name: hasPdf ? (pdfName || undefined) : null,
    };
    onSave(payload);
  };

  return (
    <div className="flex flex-col gap-5 max-w-[1000px]">
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
          <Field label="Document Type" required>
            <Select value={docType} onChange={e => setDocType(e.target.value)} options={normNames.length ? normNames : ['Regulation', 'Directive', 'Resolution', 'Act', 'Decree', 'Guideline', 'Policy', 'Notice', 'Circular']} placeholder="Select type…" />
          </Field>
          <Field label="Document Number" required>
            <input type="text" value={docNumber} onChange={e => setDocNum(e.target.value)}
              placeholder="e.g. 001/2026" className="field-input" />
          </Field>
          <Field label="Year" required>
            <Select value={year} onChange={e => setYear(e.target.value)} options={YEARS} placeholder="Select year…" />
          </Field>
        </div>
      </Section>

      <Section icon="documents" title="Description" sub="A concise summary of the document">
        <Field label="Description" required>
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
          <Field label="Publisher Entity" required
            hint="Usually one. Click “Multiple” to add and list several entities inline.">
            <EntitiesField entities={entities} setEntities={setEntities} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Issue Date" required>
              <div className="relative">
                <input type="date" value={issueDate} onChange={e => setIssue(e.target.value)} className="field-input pr-10" />
                <Icon name="calendar" size={16} color="#9aa3bd" className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </Field>
            <Field label="Taking Effect Date">
              <div className="relative">
                <input type="date" value={effectDate} onChange={e => setEffect(e.target.value)} className="field-input pr-10" />
                <Icon name="calendar" size={16} color="#9aa3bd" className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </Field>
          </div>
        </div>
      </Section>

      <Section icon="themes" title="Themes & Subthemes" sub="Classify the document by theme and subtheme">
        <Field label="Themes & Subthemes"
          hint="Shows the first assignment. Click “Details” to view, add or remove all theme / subtheme records.">
          <ThemesField rows={themeRows} setRows={setThemeRows} />
        </Field>
      </Section>

      <Section icon="tag" title="Metadata" sub="Publishing media, keywords and classification">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Publishing Media">
              <input type="text" value={media} onChange={e => setMedia(e.target.value)}
                placeholder="e.g. Official Gazette No. 142" className="field-input" />
            </Field>
            <Field label="Keyword">
              <input type="text" value={keyword} onChange={e => setKeyword(e.target.value)}
                placeholder="e.g. taxation, compliance" className="field-input" />
            </Field>
          </div>
          <Field label="Character Set" className="sm:max-w-[280px]">
            <Select value={charset} onChange={e => setCharset(e.target.value)} options={CHARSETS} placeholder="Select character set…" />
          </Field>
        </div>
      </Section>

      <Section icon="pdf" title="PDF Document" sub="Attach a digital copy if available">
        <div className="flex flex-col gap-4">
          <button onClick={() => setHasPdf(v => !v)} type="button"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all text-left
              ${hasPdf ? 'border-[#c0392b] bg-[#c0392b]/5' : 'border-[#e2e6ef] bg-[#f9fafc] hover:border-slate-300'}`}>
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
            hint={!hasPdf ? 'Enable the checkbox above to enter the PDF file name.' : undefined}>
            <div className="relative">
              <Icon name="pdf" size={16} color={hasPdf ? '#c0392b' : '#c8ccdc'}
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input type="text" value={pdfName} onChange={e => setPdfName(e.target.value)}
                disabled={!hasPdf}
                placeholder="e.g. regulation-001-2026.pdf"
                className="field-input pl-10 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[#f4f6fb]" />
            </div>
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
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#c0392b] text-white text-[12px] font-bold
              tracking-wide hover:opacity-90 transition-opacity" style={{ boxShadow: '0 4px 16px rgba(192,57,43,0.35)' }}>
            <Icon name="save" size={15} color="#fff" /> {isEdit ? 'UPDATE DOCUMENT' : 'SAVE DOCUMENT'}
          </button>
        </div>
      </div>
    </div>
  );
}
