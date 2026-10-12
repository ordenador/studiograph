// Provide browser persistence before importing Zustand stores in Node tests.
const values = new Map<string, string>();
const storage: Storage = {
  get length() { return values.size; },
  key: (index) => [...values.keys()][index] ?? null,
  getItem: (key) => values.get(String(key)) ?? null,
  setItem: (key, value) => { values.set(String(key), String(value)); },
  removeItem: (key) => { values.delete(String(key)); },
  clear: () => { values.clear(); },
};
Object.defineProperty(globalThis, 'localStorage', {
  value: storage,
  configurable: true,
});
