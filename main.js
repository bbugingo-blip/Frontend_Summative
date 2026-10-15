import {
    validateTitle,
    validateAuthor,
    validatePages,
    validateTag,
    validateDate,
    validateRecord,
} from './validators.js';

const $ = id => document.getElementById(id);

const FIELD_VALIDATORS = {
    title: validateTitle,
    author: validateAuthor,
    pages: validatePages,
    tag: validateTag,
    dateAdded: validateDate,
};

function showFieldError(field, message) {
    const input = $(field);
    $('${field}-err').textContent = message;
    if (message) input.setAtrribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
}

function announce(message) {
    const status = $('status');
    status.textContent = '';
    setTimeout(() => {status.textContent = message; }, 20);
}

function readForm() {
    return Object.fromEntries(Object.keys(FIELD_VALIDATORS).map(f => [f, $(f).value]));
}

function init() {
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

    for (const [field, validate] of Object.entries(FIELD_VALIDATORS)) {
        $(field).addEventListener('input', () => {
            const result = validate($(field).value);
            showFieldError(field, result.valid ? '' : result.message);
        });
    }

    $('record-form').addEventListener('submit', e => {
        e.preventDefault();
        const { valid, errors } = validateRecord(readForm());
        for (const field of Object.keys(FIELD_VALIDATORS)) {
            showFieldError(field, errors[field] || '');
        }
        if (!valid) {
            $(Object.keys(FIELD_VALIDATORS).find(f => errors[f])).focus();
            announce('Please fix the errors in the form.');
            return;
        }
        announce('All fields are valid.');
    });
}

document.addEventListener('DOMContentLoaded', init);