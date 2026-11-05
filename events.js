// Tiny event bus so the Tasks tab can tell the tab bar to refresh its badge.
const listeners = new Set();
export function onTasksChanged(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function emitTasksChanged() { listeners.forEach((f) => { try { f(); } catch (e) {} }); }
