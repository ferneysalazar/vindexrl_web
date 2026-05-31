import { I } from '../../icons';

export default function VerDetalles({ href = '#', className = '' }) {
  return (
    <a
      href={href}
      className={`flex items-center gap-1 text-[11px] opacity-80 hover:opacity-100 transition-opacity ${className}`}
    >
      Ver detalles
      <I.ext size={11} />
    </a>
  );
}
