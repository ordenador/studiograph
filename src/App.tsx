import { lazy, Suspense } from 'react';
import { RepositoryWorkspace } from './components/Repository/RepositoryWorkspace';

const StandaloneEditor = lazy(() => import('./StandaloneEditor'));

export default function App() {
  return window.location.pathname === '/standalone'
    ? <Suspense fallback={<p style={{ padding: 24 }}>Abriendo editor independiente…</p>}><StandaloneEditor /></Suspense>
    : <RepositoryWorkspace />;
}
