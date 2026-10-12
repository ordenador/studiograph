import { useState } from 'react';
import { Link } from 'lucide-react';

export function CopyViewLink({ dirty = false }: { dirty?: boolean }) {
  const [message, setMessage] = useState('');
  const [fallback, setFallback] = useState('');
  const copy = async () => {
    const url = window.location.href;
    try { await navigator.clipboard.writeText(url); setMessage(dirty ? 'Enlace copiado · datos guardados' : 'Enlace copiado'); setFallback(''); }
    catch { setFallback(url); setMessage('Copia esta dirección'); }
  };
  return <div className="repo-copy-link">
    <button onClick={() => void copy()} title={dirty ? 'Comparte esta vista con los datos guardados; no incluye el borrador.' : 'Copiar enlace a esta vista'}><Link size={16} aria-hidden="true" /><span>Copiar enlace</span></button>
    {message && <span role="status">{message}</span>}
    {fallback && <input aria-label="Enlace de esta vista" value={fallback} readOnly autoFocus onFocus={e => e.currentTarget.select()} />}
  </div>;
}
