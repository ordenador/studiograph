import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { locationQuery, readLocation, sameRecord, type WorkspaceLocation } from './workspaceLocation';

type Destination = { location: WorkspaceLocation; index?: number };

/** History changes preserve a draft while navigating within the same record. */
export function useWorkspaceNavigation(dirtyRef: RefObject<boolean>) {
  const [location, setLocation] = useState(() => readLocation(window.location.search));
  const [pending, setPending] = useState<Destination | null>(null);
  const current = useRef({ location, index: 0 });
  const restoring = useRef<Destination | null>(null);
  const write = useCallback((next: WorkspaceLocation, replace = false) => {
    const index = current.current.index + (replace ? 0 : 1);
    const url = `${window.location.pathname}${locationQuery(next)}`;
    window.history[replace ? 'replaceState' : 'pushState']({ ...window.history.state, oconfigIndex: index }, '', url);
    current.current = { location: next, index }; setLocation(next);
  }, []);
  useEffect(() => {
    current.current.index = Number.isInteger(window.history.state?.oconfigIndex) ? window.history.state.oconfigIndex : 0;
    window.history.replaceState({ ...window.history.state, oconfigIndex: current.current.index }, '', `${window.location.pathname}${locationQuery(current.current.location)}`);
    const pop = (event: PopStateEvent) => {
      if (restoring.current) { setPending(restoring.current); restoring.current = null; return; }
      const next = readLocation(window.location.search);
      const index = Number.isInteger(event.state?.oconfigIndex) ? event.state.oconfigIndex : current.current.index;
      const delta = current.current.index - index;
      if (dirtyRef.current && !sameRecord(next, current.current.location)) {
        if (delta) { restoring.current = { location: next, index }; window.history.go(delta); }
        else { write(current.current.location, true); setPending({ location: next }); }
      } else { current.current = { location: next, index }; setLocation(next); }
    };
    window.addEventListener('popstate', pop);
    return () => window.removeEventListener('popstate', pop);
  }, [dirtyRef, write]);
  const navigate = useCallback((next: WorkspaceLocation) => {
    if (locationQuery(next) === locationQuery(current.current.location)) return;
    if (dirtyRef.current && !sameRecord(next, current.current.location)) setPending({ location: next });
    else write(next);
  }, [dirtyRef, write]);
  const discard = () => {
    if (!pending) return;
    dirtyRef.current = false;
    if (pending.index !== undefined && pending.index !== current.current.index) window.history.go(pending.index - current.current.index);
    else write(pending.location);
    setPending(null);
  };
  return { location, navigate, pending, cancel: () => setPending(null), discard };
}
