export const PATTERNS = {
    title: /^\S(?:.*\S)?$/,
    pages: /^(0|[1-9]\d*)(\.\d{1,2})?$/,
    date: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
    tag: /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/,
    duplicateWord: /\b(\w+)\s+\1\b/i,
    author: /^(?=.*[A-Za-z])(?!.*\d)\S(?:.*\S)?$/,
    isbn: /\b(?:97[89][- ]?)?\d{1,5}[- ]?\d+[- ]?\d+[- ]?[\dX]\b/,
};

const ok = { valid: true, message: '' };
const fail = message => ({valid: false, message });

export function validateTitle(value) {
    if (!PATTERNS.title.test(value)){
        return fail('Title is required and cannot start or end with spaces.');
    }
    if (PATTERNS.duplicateWord.test(value)){
        return fail('Title contains a repeated word (for example "the the"). Please check it.');
    }
    return ok;
}

export function validateAuthor(value) {
    if (!PATTERNS.author.test(value)) {
        return fail('Author must contain letters, no digits, and no leading or trailing spaces.');
    }
    return ok;
}

export function validatePages(value) {
    if (!PATTERNS.pages.test(value)) {
        return fail('Pages must be a number like 320 or 12.5 (no leading zeros, max 2 decimals).');
    }
    if (Number(value) <= 0) return fail('Pages must be greater than zero.');
    return ok;
}

export function validateDate(value) {
    if (!PATTERNS.date.test(value)) return fail('Use the format YYYY-MM-DD.');
    const [y, m, d]= value.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) {
        return fail('That date does not exist on the calendar.');
    }
    return ok;
}

export function validateTag(value) {
    if (!PATTERNS.tag.test(value)) {
        return fail('Tag may use letters, single spaces and hyphens only.');
    }
    return ok;
}

export function validateRecord(rec) {
    const errors = {};
    const checks = {
        title: validateTitle(String(rec.title ?? '')),
        author: validateAuthor(String(rec.author ?? '')),
        pages: validatePages(String(rec.pages ?? '')),
        tag: validateTag(String(rec.tag ?? '')),
        dateAdded: validateDate(String(rec.dateAdded ?? '')),
    };
    for (const [k, r] of Object.entries(checks)) if (!r.valid) errors[k] = r.message;
    return { valid: Object.keys(errors).length === 0, errors };
}