import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Icon from '../../../components/shared/Icon';
import { I } from '../../../icons';
import { rasterPages } from '../../../services/api';

const PAGE_COUNT = 5;
const THUMBNAIL_WIDTH = 110;
const THUMBNAIL_HEIGHT = Math.round(THUMBNAIL_WIDTH * (297 / 210)); // A4 ratio ≈ 156px
const pages = Array.from({ length: PAGE_COUNT }, (_, i) => i + 1);

const BASE_PAGE_WIDTH = 794;
const ZOOM_LEVELS = [
  { label: '100%', scale: 1 },
  { label: '120%', scale: 1.2 },
  { label: '150%', scale: 1.5 },
];

// Temporary: raster service currently only has this document deployed
const RASTER_DOC_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

export default function PdfLinkEditorPage() {
  const { docId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [zoom, setZoom] = useState(1);
  const [thumbnails, setThumbnails] = useState(Array(PAGE_COUNT).fill(null));
  const blobUrlsRef = useRef([]);

  const handleGoBack = () => {
    navigate('/admin/documents', state?.docItem ? { state: { restoreItem: state.docItem } } : {});
  };

  useEffect(() => {
    pages.forEach(page => {
      rasterPages.get(RASTER_DOC_ID, page, 'low')
        .then(blobUrl => {
          blobUrlsRef.current.push(blobUrl);
          setThumbnails(prev => {
            const next = [...prev];
            next[page - 1] = blobUrl;
            return next;
          });
        })
        .catch(() => {}); // leave slot as null on error — placeholder stays
    });

    return () => {
      blobUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const pageWidth  = Math.round(BASE_PAGE_WIDTH * zoom);
  const pageHeight = Math.round(1123 * zoom);

  return (
    <>
      {/* Strip — thumbnail sidebar */}
      <aside className="w-[130px] shrink-0 bg-white border-r border-slate-200 overflow-y-auto">
        {pages.map(page => (
          <button
            key={page}
            className="w-full flex flex-col items-center px-[10px] pt-[10px] pb-[8px] hover:bg-slate-50 transition-colors group"
          >
            <div
              className="w-[110px] rounded border border-slate-200 group-hover:border-[#1e2d4a]/25 transition-colors overflow-hidden flex items-center justify-center bg-slate-100"
              style={{ height: THUMBNAIL_HEIGHT }}
            >
              {thumbnails[page - 1] ? (
                <img
                  src={thumbnails[page - 1]}
                  alt={`Page ${page}`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full animate-pulse bg-slate-200" />
              )}
            </div>
            <span className="text-[10px] text-slate-400 mt-1.5 font-medium">{page}</span>
          </button>
        ))}
      </aside>

      {/* Viewer */}
      <main className="flex-1 flex flex-col overflow-hidden" style={{ background: 'rgb(250, 249, 245)' }}>

        {/* Toolbar */}
        <div className="shrink-0 flex items-center gap-1 px-4 py-2 bg-white border-b border-slate-200">
          <button
            onClick={handleGoBack}
            title="Go back to the document"
            className="w-8 h-8 rounded flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-[#1e2d4a] transition-colors mr-2"
          >
            <I.goBack size={18} />
          </button>
          <div className="w-px h-5 bg-slate-200 mr-2" />
          {ZOOM_LEVELS.map(({ label, scale }) => (
            <button
              key={label}
              onClick={() => setZoom(scale)}
              className={`px-3 py-1 rounded text-[12px] font-semibold transition-colors
                ${zoom === scale
                  ? 'bg-[#1e2d4a] text-white'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-[#1e2d4a]'
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Scrollable page list */}
        <div className="flex-1 overflow-y-auto py-8">
          <div className="flex flex-col items-center gap-8">
            {pages.map(page => (
              <div key={page} className="flex flex-col items-center gap-2">
                <div
                  className="bg-white shadow-2xl flex flex-col items-center justify-center gap-3 transition-all duration-200"
                  style={{ width: pageWidth, minHeight: pageHeight }}
                >
                  <Icon name="pdf" size={56} color="#e2e8f0" />
                  <span className="text-[14px] text-slate-400 font-medium">Page {page}</span>
                  <span className="text-[12px] text-slate-300">Document #{docId}</span>
                </div>
                <span className="text-[11px] text-slate-400">{page} / {pages.length}</span>
              </div>
            ))}
          </div>
        </div>

      </main>
    </>
  );
}
