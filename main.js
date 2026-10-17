import { getState, subscribe, addRecord, updateRecord, deleteRecord, replaceRecords, updateSettings } from './state.js';
import { exportJSON, parseImport } from './storage.js';
import {
    validateTitle,
    validateAuthor,
    validatePages,
    validateTag,
    validateDate,
    validateRecord,
} from './validators.js';
import { compileRegex, filterRecords, sortRecords } from './search.js';
import * as ui from './ui.js';

const $ = id => document.getElementById(id);

const FIELD_VALIDATORS = {
    title: validateTitle,
    author: validateAuthor,
    pages: validatePages,
    tag: validateTag,
    dateAdded: validateDate,
};

function render() {
    const { records, settings } = getState();
    const pattern = $('search').value;
    const flags = $('case-toggle').checked ? 'i' : '';
    const re = compileRegex(pattern, flags);
    ui.showSearchError(pattern && !re ? 'Invalid regular expression. Showing all records.' : '');

    const visible = sortRecords(filterRecords(records, re), $('sort').value);
    ui.renderRecords(visible, re);
    ui.renderResultCount(visible.length, records.length);
    ui.renderStats(records, settings);
}

function init() {
    ui.renderSettings(getState().settings);
    render();
    subscribe(render);

    const toggle = $('menu-toggle');
    const nav = $('site-nav');
    toggle.addEventListener('click', () => {
        const open = nav.classList.toggle('open');
        toggle.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', e => {
        if (e.target.closest('a')) {
            nav.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
        }
    });

    $('search').addEventListener('input', render);
    $('case-toggle').addEventListener('change', render);
    $('sort').addEventListener('change', render);

    for (const [field, validate] of Object.entries(FIELD_VALIDATORS)) {
        $(field).addEventListener('input', () => {
            const result = validate($(field).value);
            ui.showFieldError(field, result.valid ? '' : result.message);
        });
    }

    $('record-form').addEventListener('submit', e => {
        e.preventDefault();
        const data = ui.readForm();
        const { valid, errors } = validateRecord(data);
        for (const field of Object.keys(FIELD_VALIDATORS)) {
            ui.showFieldError(field, errors[field] || '');
        }
        if (!valid) {
            $(Object.keys(FIELD_VALIDATORS).find(f => errors[f])).focus();
            ui.announce('Please fix the errors in the form.');
            return;
        }
        const { id, ...fields } = data;
        if (id) {
            updateRecord(id, fields);
            ui.announce(`Updated "${fields.title}".`);
        } else {
            addRecord(fields);
            ui.announce(`Added "${fields.title}".`);
        }
        ui.fillForm(null);
        $('title').focus();
    });

    $('cancel-btn').addEventListener('click', () => {
        ui.fillForm(null);
        ui.announce('Edit cancelled.');
    });

    $('records-body').addEventListener('click', e => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        const id = btn.closest('tr').dataset.id;
        const rec = getState().records.find(r => r.id === id);
        if (!rec) return;
        if (btn.dataset.action === 'edit') {
            ui.fillForm(rec);
            $('form-section').scrollIntoView({ block: 'start' });
            $('title').focus();
            ui.announce(`Editing "${rec.title}".`);
        } else if (btn.dataset.action === 'delete') {
            if (window.confirm(`Delete "${rec.title}"? This cannot be undone.`)) {
                deleteRecord(id);
                ui.announce(`Deleted "${rec.title}".`);
                $('search').focus();
            }
        }
    });

        $('cap').addEventListener('change', () => {
        const v = Number($('cap').value);
        if (Number.isFinite(v) && v > 0) updateSettings({ cap: Math.round(v) });
        else $('cap').value = getState().settings.cap;
    });

    $('unit').addEventListener('change', () => updateSettings({ unit: $('unit').value }));

    $('ppm').addEventListener('change', () => {
        const v = Number($('ppm').value);
        if (Number.isFinite(v) && v > 0) updateSettings({ pagesPerMinute: v });
        else $('ppm').value = getState().settings.pagesPerMinute;
    });

    $('theme-toggle').addEventListener('change', () => {
        updateSettings({ theme: $('theme-toggle').checked ? 'dark' : 'light' });
        ui.renderSettings(getState().settings);
    });

        $('export-btn').addEventListener('click', () => {
        const blob = new Blob([exportJSON(getState().records)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'vault-export.json';
        link.click();
        URL.revokeObjectURL(url);
        ui.announce('Exported records as JSON.');
    });

    $('import-file').addEventListener('change', async e => {
        const file = e.target.files[0];
        if (!file) return;
        const result = parseImport(await file.text());
        e.target.value = '';
        if (!result.ok) {
            const shown = result.errors.slice(0, 5).join(' ');
            const more = result.errors.length > 5 ? ` (+${result.errors.length - 5} more)` : '';
            ui.showImportError(`Import failed. ${shown}${more}`);
            ui.announce('Import failed. No data was changed.');
            return;
        }
        ui.showImportError('');
        replaceRecords(result.records);
        ui.announce(`Imported ${result.records.length} records.`);
    });

       $('seed-btn').addEventListener('click', async () => {
        try {
            const res = await fetch('seed.json');
            if (!res.ok) throw new Error('seed.json could not be found.');
            const result = parseImport(await res.text());
            if (!result.ok) throw new Error(result.errors[0]);
            replaceRecords(result.records);
            ui.showImportError('');
            ui.announce(`Loaded ${result.records.length} sample records.`);
        } catch (err) {
            ui.showImportError(`Could not load sample data. ${err.message}`);
        }
    });
}

document.addEventListener('DOMContentLoaded', init);