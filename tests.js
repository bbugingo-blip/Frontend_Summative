import {
    PATTERNS,
    validateTitle,
    validateAuthor,
    validatePages,
    validateDate,
    validateTag,
    validateRecord,
} from './validators.js';
import { compileRegex, escapeHtml, highlight, matchesRecord, filterRecords, sortRecords } from './search.js';
import { computeStats, capStatus, convertPages, formatUnit } from './state.js';

const results = [];

function test(name, fn) {
    try {
        fn();
        results.push({ name, pass: true});
    } catch (err) {
        results.push({ name, pass: false, error: err.message});
    }
}

function eq(actual, expected) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
}

test('title: accepts normal titles', () => {
    eq(validateTitle('Dune').valid, true);
    eq(validateTitle('A Brief History of Time').valid, true);
    eq(validateTitle('X').valid, true);
});

test('title: rejects empty and edge spaces', () => {
    eq(validateTitle('').valid, false);
    eq(validateTitle(' Dune').valid, false);
    eq(validateTitle('Dune ').valid, false);
    eq(validateTitle('   ').valid, false);
});

test('title: rejects a repeated word (back-reference)', () => {
    eq(validateTitle('The the Book').valid, false);
    eq(validateTitle('Go go Go').valid, false);
    eq(validateTitle('The Theory of Everything').valid, true);
    eq(validateTitle('Thethe Book').valid, true);
});

test('author: needs a letter and no digits (lookahead)', () => {
    eq(validateAuthor('Ada Lovelace').valid, true);
    eq(validateAuthor('Anne-Marie O Brien').valid, true);
    eq(validateAuthor('R2D2').valid, false);
    eq(validateAuthor('123').valid, false);
    eq(validateAuthor('').valid, false);
    eq(validateAuthor(' Ada').valid, false);
});

test('pages: valid numbers', () => {
    eq(validatePages('320').valid, true);
    eq(validatePages('12.5').valid, true);
    eq(validatePages('0.5').valid, true);
    eq(validatePages('9999').valid, true);
});

test('pages: invalid numbers', () => {
    eq(validatePages('012').valid, false);
    eq(validatePages('1.234').valid, false);
    eq(validatePages('0').valid, false);
    eq(validatePages('-5').valid, false);
    eq(validatePages('abc').valid, false);
    eq(validatePages('').valid, false);
    eq(validatePages('1,000').valid, false);
});

test('date: valid dates', () => {
    eq(validateDate('2026-10-13').valid, true);
    eq(validateDate('2024-02-29').valid, true);
    eq(validateDate('2000-01-01').valid, true);
});

test('date: bad format', () => {
    eq(validateDate('13-10-2026').valid, false);
    eq(validateDate('2026/10/13').valid, false);
    eq(validateDate('2026-1-5').valid, false);
    eq(validateDate('').valid, false);
});

test('date: out-of-range and non-existent dates', () => {
    eq(validateDate('2025-13-01').valid, false);
    eq(validateDate('2025-00-10').valid, false);
    eq(validateDate('2025-02-29').valid, false);
    eq(validateDate('2025-04-31').valid, false);
});

test('tag: valid tags', () => {
    eq(validateTag('Fiction').valid, true);
    eq(validateTag('Self-help').valid, true);
    eq(validateTag('Software Design').valid, true);
});

test('tag: invalid tags', () => {
    eq(validateTag('Sci  Fi').valid, false);
    eq(validateTag('Sci-Fi2').valid, false);
    eq(validateTag('-bad').valid, false);
    eq(validateTag('bad-').valid, false);
    eq(validateTag('').valid, false);
});

test('every error message is a non-empty string', () => {
    eq(typeof validateTitle('').message, 'string');
    eq(validateTitle('').message.length > 0, true);
    eq(validatePages('x').message.length > 0,true);
    eq(validateDate('x').message.length > 0, true);
});

test('validateRecord: all valid', () => {
    const r = validateRecord({
        title: 'Dune', author: 'Frank Herbert', pages: '412', tag: 'Fiction', dateAdded: '2026-01-01',
    });
    eq(r.valid, true);
    eq(r.errors, {});
});

test('validateRecord: collects every error', () =>{
    const r = validateRecord({title: ' x', author: '', pages: 'a', tag: '1', dateAdded: 'nope'});
    eq(r.valid, false);
    eq(Object.keys(r.errors).sort(), ['author', 'dateAdded', 'pages', 'tag', 'title']);
});

test('validateRecord: handles missing fields', () => {
    const r = validateRecord({});
    eq(r.valid, false);
    eq(Object.keys(r.errors).length, 5);
});

test( 'ISBN pattern finds an ISBN-13', () => {
    eq(PATTERNS.isbn.test('see ISBN 978-0553380163 here'), true);
    eq(PATTERNS.isbn.test('no number here'), false);
});

const sample = [
    {title: 'Tea Time', author: 'Ada Lovelace', pages:120, tag: 'Notes', dateAdded: '2026-10-01' },
    {title: 'Clean Code', author: 'Robert Martin', pages : 464, tag: 'Programming', dateAdded: '2026-10-13' },
    {title: 'dune', author: 'Frank Herbert', pages: 412, tag: 'Fiction', dateAdded: '2026-01-01' },
];

test('compileRegex: valid, empty and invalid input', () => {
    eq(compileRegex('abc') instanceof RegExp, true);
    eq(compileRegex(''), null);
    eq(compileRegex('('), null);
    eq(compileRegex('[a-'), null);
});

test('compileRegex: respects the case flag', () => {
    eq(compileRegex('dune', 'i').test('DUNE'), true);
    eq(compileRegex('dune', '').test('DUNE'), false);
});

test('escapeHtml: escapes markup characters', () => {
        eq(escapeHtml('<b>"x" & \'y\'</b>'), '&lt;b&gt;&quot;x&quot; &amp; &#39;y&#39;&lt;/b&gt;');
});

test('highlight: wraps matches in <mark>', () => {
    eq(highlight('Tea Time', /t/i), '<mark>T</mark>ea <mark>T</mark>ime');
    eq(highlight('abc', null), 'abc');
});

test('highlight: escapes user text before highlighting', () => {
    eq(highlight('<script>', /script/), '&lt;<mark>script</mark>&gt;');
    eq(highlight('<script>', null), '&lt;script&gt;');
});

test('highlight: ignores zero-length matches', () => {
    eq(highlight('abc', /x*/), 'abc');
});

test('matchesRecord: searches every field', () => {
    eq(matchesRecord(sample[0], /lovelace/i), true);
    eq(matchesRecord(sample[0], /programming/i), false);
    eq(matchesRecord(sample[1], /^464$|\b464\b/), true);
    eq(matchesRecord(sample[1], null), true);
});

test('filterRecords: empty pattern returns everything', () => {
    eq(filterRecords(sample, null).length, 3);
});

test('filterRecords: works with a global-flag regex repeatedly', () => {
    eq(filterRecords(sample, /e/gi).length, 3);
});

test('filterRecords: advanced pattern (back-reference)', () => {
    const recs = [...sample, { title: 'The the book', author: 'X Y', pages: 1, tag: 'Notes', dateAdded: '2026-01-02' }];
    eq(filterRecords(recs, /\b(\w+)\s+\1\b/i).map(r => r.title), ['The the book']);
});

test('sortRecords: title A to Z and Z to A (ignore case)', () => {
eq(sortRecords(sample, 'title-asc').map(r => r.title), ['Clean Code', 'dune', 'Tea Time']);
eq(sortRecords(sample, 'title-desc').map(r => r.title), ['Tea Time', 'dune', 'Clean Code']);
});

test('sortRecords: pages low to high and high to low', () => {
    eq(sortRecords(sample, 'pages-asc').map(r => r.pages), [120, 412, 464]);
    eq(sortRecords(sample, 'pages-desc').map(r => r.pages), [464, 412, 120]);
});

test('sortRecords: date newest and oldest first', () => {
    eq(sortRecords(sample, 'dateAdded-desc').map(r => r.dateAdded), ['2026-10-13', '2026-10-01', '2026-01-01']);
    eq(sortRecords(sample, 'dateAdded-asc').map(r => r.dateAdded), ['2026-01-01', '2026-10-01', '2026-10-13']);
});

test('sortRecords: unknown key falls back and does not change the input', () => {
    const before = sample.map(r => r.title);
    eq(sortRecords(sample, 'nope').length, 3);
    eq(sample.map(r => r.title), before);
});

test('computeStats: totals and top tag', () => {
    const today = new Date(2026, 9, 16);
    const recs = [
        { title: 'A', pages: 100, tag: 'Fiction', dateAdded: '2026-10-16' },
        { title: 'B', pages: 50.5, tag: 'Notes', dateAdded: '2026-10-15' },
        { title: 'C', pages: 20, tag: 'Fiction', dateAdded: '2026-10-16' },
    ];
    const s = computeStats(recs, today);
    eq(s.total, 3);
    eq(s.totalPages, 170.5);
    eq(s.topTag, { tag: 'Fiction', count: 2 });
});

test('computeStats: empty list has no top tag', () => {
    const s = computeStats([], new Date(2026, 9, 16));
    eq(s.total, 0);
    eq(s.totalPages, 0);
    eq(s.topTag, null);
});

test('computeStats: top tag ties break alphabetically', () => {
    const recs = [
        { pages: 1, tag: 'Notes', dateAdded: '2026-10-16' },
        { pages: 1, tag: 'Fiction', dateAdded: '2026-10-16' },
    ];
    eq(computeStats(recs, new Date(2026, 9, 16)).topTag.tag, 'Fiction');
});

test('computeStats: 7-day trend counts per day, oldest first', () => {
    const recs = [
        { pages: 1, tag: 'A', dateAdded: '2026-10-16' },
        { pages: 1, tag: 'A', dateAdded: '2026-10-16' },
        { pages: 1, tag: 'A', dateAdded: '2026-10-10' },
        { pages: 1, tag: 'A', dateAdded: '2026-10-09' },
    ];
    const t = computeStats(recs, new Date(2026, 9, 16)).trend;
    eq(t.length, 7);
    eq(t[0], { date: '2026-10-10', count: 1 });
    eq(t[6], { date: '2026-10-16', count: 2 });
});

test('capStatus: remaining, exactly at cap, and over', () => {
    eq(capStatus(100, 150), { over: false, remaining: 50 });
    eq(capStatus(150, 150), { over: false, remaining: 0 });
    eq(capStatus(200, 150), { over: true, overage: 50 });
});

test('convertPages: pages, minutes and hours', () => {
    eq(convertPages(120, 'pages', 2), 120);
    eq(convertPages(120, 'minutes', 2), 60);
    eq(convertPages(120, 'hours', 2), 1);
});

test('convertPages: bad pages-per-minute falls back to 1', () => {
    eq(convertPages(60, 'minutes', 0), 60);
    eq(convertPages(60, 'minutes', -3), 60);
});

test('formatUnit: rounds and labels', () => {
    eq(formatUnit(212.6, 'pages'), '213 pages');
    eq(formatUnit(1.26, 'hours'), '1.3 hours');
    eq(formatUnit(0, 'minutes'), '0 minutes');
});

export { results };