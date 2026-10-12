import { RepositoryWorkspace } from './components/Repository/RepositoryWorkspace';

export default function App() {
  // Old bookmarks open the integrated capability; there is only one workspace.
  if (window.location.pathname !== '/') {
    window.history.replaceState(null, '', `/${window.location.search || '?setup=studio&tab=canvas'}`);
  }
  return <RepositoryWorkspace />;
}
