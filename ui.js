import { highlight, escapeHtml } from './search.js';

const $ = id => document.getElementById(id);

const FORM_FIELDS = ['title', 'author', 'pages', 'tag', 'dateAdded'];

export function announce(message) {
    const el = $('status');
    el.textContent = '';
    setTimeout(() => { el.textContent = message; }, 20); 
}

export function renderRecords(records, re) {
    const body = $('records-body');
    body.innerHTML = '';
    $('empty-state').hidden = records.length > 0;
    $('records-table').hidden = records.length === 0;

    for (const r of records) {
        const tr = document.createElement('tr');
        tr.dataset.id = r.id;
        tr.innerHTML = `
        <td data-label="Title">${highlight(r.title, re)}</td>
        <td data-label="Author">${highlight(r.author, re)}</td>
        <td data-label="Pages">${highlight(String(r.pages), re)}</td>
        <td data-label="Tag">${highlight(r.tag, re)}</td>
        <td data-label="Date added">${highlight(r.dateAdded, re)}</td>
        <td class="row-actions">
          <button type="button" class="btn" data-action="edit" aria-label="Edit ${escapeHtml(r.title)}">Edit</button>
          <button type="button" class="btn danger" data-action="delete" aria-label="Delete ${escapeHtml(r.title)}">Delete</button>
        </td>`;
        body.appendChild(tr);
    }
}

export function renderResultCount(shown, total) {
    $('result-count').textContent = shown === total
    ? `${total} record${total === 1 ? '' : 's'}`
    : `${shown} of ${total} records match`;
}

export function showSearchError(message) {
$('search-error').textContent = message;
if (message) $('search').setAttribute('aria-invalid', 'true');
else $('search').removeAttribute('aria-invalid');
}

export function showFieldError(field, message) {
    const input = $(field);
    $(`${field}-err`).textContent = message;
    if (message) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
}

export function clearFormErrors() {
    FORM_FIELDS.forEach(f => showFieldError(f, ''));
}

export function fillForm(rec) {
    $('rec-id').value = rec ? rec.id : '';
    FORM_FIELDS.forEach(f => { $(f).value = rec ? rec[f] : ''; });
    $('save-btn').textContent = rec ? 'Save changes' : 'Add record';
    $('cancel-btn').hidden = !rec;
    clearFormErrors();
}

export function readForm(){
    return {
        id: $('rec-id').value,
        ...Object.fromEntries(FORM_FIELDS.map(f => [f, $(f).value])),
    };
}

export function showImportError(message) {
    $('import-error').textContent = message;
}