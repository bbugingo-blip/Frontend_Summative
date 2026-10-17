import { validateRecord } from './validators.js';

const DATA_KEY = 'vault:records';
const SETTINGS_KEY = 'vault:settings';

export const DEFAULT_SETTINGS = {
    cap: 2000,
    unit: 'pages',
    pagesPerMinute: 1,
    theme: 'light',
};

function read(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
}

function write(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch {
        return false;
    }
}

export const loadRecords = () => {
    const data = read(DATA_KEY, []);
    return Array.isArray(data) ? data : [];
};
export const saveRecords = records => write(DATA_KEY, records);
export const loadSettings = () => ({ ...DEFAULT_SETTINGS, ...read(SETTINGS_KEY, {}) });
export const saveSettings = settings => write(SETTINGS_KEY, settings);

export function exportJSON(records) {
    return JSON.stringify(records, null, 2);
}

export function parseImport(text) {
    let data;
    try {
        data = JSON.parse(text);
    } catch {
        return { ok: false, records: [], errors: ['File is not valid JSON.'] };
    }
    if (!Array.isArray(data)) {
        return { ok: false, records: [], errors: ['Top level must be an array of records.'] };
    }
    const errors = [];
    const seen = new Set();
    const records = [];
    data.forEach((rec, i) => {
        const label = `Record ${i + 1}`;
        if (!rec || typeof rec !== 'object') {
            errors.push(`${label}: not an object.`);
            return;
        }
        if (typeof rec.id !== 'string' || !rec.id) errors.push(`${label}: missing id.`);
        else if (seen.has(rec.id)) errors.push(`${label}: duplicate id "${rec.id}".`);
        else seen.add(rec.id);
        if (typeof rec.createdAt !== 'string' || typeof rec.updatedAt !== 'string') {
            errors.push(`${label}: missing createdAt/updatedAt.`);
        }
        const { valid, errors: fieldErrors } = validateRecord(rec);
        if (!valid) {
            for (const msg of Object.values(fieldErrors)) errors.push(`${label}: ${msg}`);
        }
        records.push({ ...rec, pages: Number(rec.pages) });
    });
    return { ok: errors.length === 0, records: errors.length ? [] : records, errors };
}