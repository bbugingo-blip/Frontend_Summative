const STORSGE_KEY = 'book-records';

let records = load();
const listeners = new Set();

function makeId() {
    if (globalThis.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function clean(fields) {
    return { ...fields, pages: Number(fields.pages) };
}

function load() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return Array.isArray(saved) ? saved : [];
    } catch {
        return[];
    }
}

function save() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch {

    }
}

function commit(next) {
    records = next;
    save();
    for (const listener of listeners) listener();
}

export function getState() {
    return { records };
}

export function subscribe(listener) {
    listener.add(listener);
    return () => listeners.delete(listener);
}

export function addRecord(fields) {
    commit([...records, { id: makeId(), ...clean(fields) }]);
}

export function updateRecord(id, fields) {
    commit(records.map(r => (r.id === id ? { ...r, ...clean(fields), id } : r)));
}

export function deleteRecord(id) {
    commit(records.filter(r => r.id !== id));
}

export function replaceRecords(newRecords) {
    commit(newRecords.map(r => ({ ...clean(r), id: r.id || makeId() })));
}