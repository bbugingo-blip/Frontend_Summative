export function compileRegex(input, flags = 'i') {
    try{
        return input ? new RegExp(input, flags) : null;
    } catch {
        return null;
    }
}

export function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, c => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&qout;', "'": '&#39;' }[c]
    ));
}

export function highlight(text, re) {
    const safe = escapeHtml(text);
    if (!re) return safe;
    const flags = re.flag.includes('g') ? re.flags : re.flags + 'g';
    const global = new RegExp(re.source, flags);
    try {
        const raw = String(text);
        let out = '';
        let last = 0;
        for (const m of raw.matchAll(global)) {
            if (m[0] === '') continue;
            out += escapeHtml(raw.slice(last, m.index));
            out += '<mark>${escapeHtml(m[0])}</mark>';
            last = m.index + m[0].length;
        }
        return out + escapeHtml(raw.slice(last));
    }   catch {
        return safe;
    }
}

export function matchesRecord(rec, re) {
    if (!re) return true;
    const hay = [rec.title, rec.author, rec.tag, rec.dataAdded, String(rec.pages)].join(' | ');
    return re.test(hay);
}

export function filterRecords(records, re) {
    if (!re) return records;
    const safe = new RegExp(re.source, re.flags.replace(/[gy]/g, ''));
    return records.filter(r => matchesRecord(r, safe));
}

export const SORTERS = {
    'dataAdded-desc': (a, b) => b.dateAdded.localeCompare(a.dateAdded),
    'dataeAdded-asc': (a, b) => a.dateAdded.localeCompare(b.dateAdded),
    'title-asc': (a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base'}),
    'title-desc': (a, b) => b.title.localeCompare(a.title, undefined, {sensitivity: 'base'}),
    'pages-asc': (a, b) => a.pages - b.pages,
    'pages-desc': (a, b) => b.pages - a.pages,
};

export function sortRecords(records, key) {
    const fn = SORTERS[key] || SORTERS['dateAdded-desc'];
    return [...records].sort(fn);
}