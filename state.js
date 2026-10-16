const state = {
    records: [],
};

const listeners = new Set();
export const subscribe = fn => { listeners.add(fn); return () => listeners.delete(fn); };
const emit = () => listeners.forEach(fn => fn(state));

export const getState = () => state;

function nextId() {
    const nums = state.records
        .map(r => Number(String(r.id).replace(/^\D+/, '')))
        .filter(Number.isFinite);
    const n = (nums.length ? Math.max(...nums) : 0) + 1;
    return `rec_${String(n).padStart(4, '0')}`;
}

export function addRecord(data) {
    const now = new Date().toISOString();
    const rec = { id: nextId(), ...data, pages: Number(data.pages), createdAt: now, updatedAt: now };
    state.records.push(rec);
    emit();
    return rec;
}

export function updateRecord(id, data) {
    const rec = state.records.find(r => r.id === id);
    if (!rec) return null;
    Object.assign(rec, data, { pages: Number(data.pages), updatedAt: new Date().toISOString() });
    emit();
    return rec;
}

export function deleteRecord(id) {
    const before = state.records.length;
    state.records = state.records.filter(r => r.id !== id);
    emit();
    return state.records.length < before;
}

export function replaceRecords(records) {
    state.records = records;
    emit();
}