const state = {
    records: [],
    settings: { cap: 2000, unit: 'pages', pagesPerMinute: 1, theme: 'light' },
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

export function updateSettings(patch) {
    state.settings = { ...state.settings, ...patch };
    emit();
}

const DAY = 86400000;

export function computeStats(records = state.records, today = new Date()) {
    const total = records.length;
    const totalPages = records.reduce((sum, r) => sum + Number(r.pages), 0);

    const tagCounts = {};
    for (const r of records) tagCounts[r.tag] = (tagCounts[r.tag] || 0) + 1;
    const top = Object.entries(tagCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];

    const base = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    const trend = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date(base - i * DAY).toISOString().slice(0, 10);
        trend.push({ date, count: records.filter(r => r.dateAdded === date).length });
    }
    return { total, totalPages, topTag: top ? {tag: top[0], count: top[1] } : null, trend };
}

export function capStatus(totalPages, cap) {
    const diff = cap - totalPages;
    return diff >= 0
        ? { over: false, remaining: diff }
        : {over: true, overage: Math.abs(diff) };
}

export function convertPages(pages, unit, pagesPerMinute = 1) {
    const ppm = pagesPerMinute > 0 ? pagesPerMinute : 1;
    if (unit === 'minutes') return pages / ppm;
    if (unit === 'hours') return pages / ppm / 60;
    return pages;
}

export function formatUnit(value, unit) {
    const n = unit === 'pages' ? Math.round(value) : Math.round(value * 10) / 10;
    return `${n.toLocaleString()} ${unit}`;
}