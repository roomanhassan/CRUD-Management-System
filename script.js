/* =====================================================
   CRUD Management System — script.js
   Talks to: http://localhost:3000/api/employees
   ===================================================== */

const API = 'http://localhost:3000/api/employees';

// ── DOM refs ──────────────────────────────────────────
const form          = document.getElementById('crud-form');
const formTitle     = document.getElementById('form-title');
const submitBtn     = document.getElementById('submit-btn');
const cancelBtn     = document.getElementById('cancel-btn');
const tableBody     = document.getElementById('table-body');
const emptyState    = document.getElementById('empty-state');
const totalCount    = document.getElementById('total-count');
const searchInput   = document.getElementById('search-input');
const clearSearch   = document.getElementById('clear-search');
const modalOverlay  = document.getElementById('modal-overlay');
const modalName     = document.getElementById('modal-name');
const confirmDelete = document.getElementById('confirm-delete');
const cancelDelete  = document.getElementById('cancel-delete');
const toast         = document.getElementById('toast');

const fields = {
  id         : document.getElementById('record-id'),
  name       : document.getElementById('name'),
  email      : document.getElementById('email'),
  role       : document.getElementById('role'),
  department : document.getElementById('department'),
};

let pendingDeleteId = null;
let toastTimer      = null;

/* ── Toast ──────────────────────────────────────────── */
function showToast(message, type = 'info') {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.className   = `toast toast-${type} show`;
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
}

/* ── Helpers ────────────────────────────────────────── */
function escapeHtml(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str ?? ''));
  return d.innerHTML;
}

function deptBadge(dept) {
  const valid = ['engineering','design','marketing','sales','hr','finance','operations'];
  const cls   = valid.includes((dept || '').toLowerCase())
    ? `badge-${dept.toLowerCase()}`
    : 'badge-default';
  return `<span class="badge ${cls}">${escapeHtml(dept)}</span>`;
}

/* ── Client-side validation ─────────────────────────── */
function validateForm() {
  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const checks  = [
    { el: fields.name,       ok: fields.name.value.trim().length >= 2 },
    { el: fields.email,      ok: emailRx.test(fields.email.value.trim()) },
    { el: fields.role,       ok: fields.role.value.trim().length >= 2 },
    { el: fields.department, ok: fields.department.value !== '' },
  ];
  let valid = true;
  checks.forEach(({ el, ok }) => {
    el.classList.toggle('invalid', !ok);
    if (!ok) valid = false;
  });
  if (!valid) showToast('Please fill in all fields correctly.', 'error');
  return valid;
}

Object.values(fields).forEach(f => {
  if (!f?.addEventListener) return;
  f.addEventListener('input',  () => f.classList.remove('invalid'));
  f.addEventListener('change', () => f.classList.remove('invalid'));
});

/* ── Render table ───────────────────────────────────── */
function renderTable(employees) {
  totalCount.textContent = employees.length;

  if (!employees.length) {
    tableBody.innerHTML = '';
    emptyState.style.display = 'block';
    document.getElementById('records-table').style.display = 'none';
    return;
  }

  emptyState.style.display = 'none';
  document.getElementById('records-table').style.display = 'table';

  tableBody.innerHTML = employees.map((e, i) => `
    <tr data-id="${e.id}">
      <td class="row-num">${i + 1}</td>
      <td><strong>${escapeHtml(e.name)}</strong></td>
      <td>${escapeHtml(e.email)}</td>
      <td>${escapeHtml(e.role)}</td>
      <td>${deptBadge(e.department)}</td>
      <td>
        <div class="actions-cell">
          <button class="btn btn-edit"   onclick="startEdit(${e.id})">Edit</button>
          <button class="btn btn-delete" onclick="openDeleteModal(${e.id}, '${escapeHtml(e.name)}')">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

/* ── READ — load all employees ──────────────────────── */
async function loadEmployees(query = '') {
  try {
    const url  = query ? `${API}?q=${encodeURIComponent(query)}` : API;
    const res  = await fetch(url);
    const data = await res.json();

    if (!data.success) throw new Error(data.message);
    renderTable(data.employees);

  } catch (err) {
    showToast('Could not load records. Is the server running?', 'error');
    console.error(err);
  }
}

/* ── CREATE / UPDATE — form submit ──────────────────── */
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  const editingId = fields.id.value;
  const payload   = {
    name       : fields.name.value.trim(),
    email      : fields.email.value.trim(),
    role       : fields.role.value.trim(),
    department : fields.department.value,
  };

  try {
    let res, data;

    if (editingId) {
      // UPDATE
      res  = await fetch(`${API}/${editingId}`, {
        method  : 'PUT',
        headers : { 'Content-Type': 'application/json' },
        body    : JSON.stringify(payload),
      });
      data = await res.json();
      if (!data.success) throw new Error(data.errors?.[0] || data.message);
      showToast('Employee updated successfully.', 'success');

    } else {
      // CREATE
      res  = await fetch(API, {
        method  : 'POST',
        headers : { 'Content-Type': 'application/json' },
        body    : JSON.stringify(payload),
      });
      data = await res.json();
      if (!data.success) throw new Error(data.errors?.[0] || data.message);
      showToast('Employee added successfully.', 'success');
    }

    resetForm();
    loadEmployees(searchInput.value.trim());

  } catch (err) {
    showToast(err.message || 'Something went wrong.', 'error');
    console.error(err);
  }
});

/* ── EDIT — pre-fill form ───────────────────────────── */
async function startEdit(id) {
  try {
    const res  = await fetch(`${API}/${id}`);
    const data = await res.json();

    if (!data.success) throw new Error(data.message);

    const emp = data.employee;
    fields.id.value         = emp.id;
    fields.name.value       = emp.name;
    fields.email.value      = emp.email;
    fields.role.value       = emp.role;
    fields.department.value = emp.department;

    formTitle.textContent   = 'Edit Employee';
    submitBtn.textContent   = 'Save Changes';
    cancelBtn.style.display = 'inline-flex';

    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth', block: 'start' });

  } catch (err) {
    showToast('Could not load employee data.', 'error');
    console.error(err);
  }
}

/* ── DELETE — modal ─────────────────────────────────── */
function openDeleteModal(id, name) {
  pendingDeleteId      = id;
  modalName.textContent = name;
  modalOverlay.style.display = 'flex';
}

confirmDelete.addEventListener('click', async () => {
  if (!pendingDeleteId) return;
  try {
    const res  = await fetch(`${API}/${pendingDeleteId}`, { method: 'DELETE' });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    showToast('Employee deleted.', 'info');
    loadEmployees(searchInput.value.trim());

  } catch (err) {
    showToast(err.message || 'Failed to delete.', 'error');
    console.error(err);
  } finally {
    closeModal();
  }
});

cancelDelete.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });

function closeModal() {
  modalOverlay.style.display = 'none';
  pendingDeleteId = null;
}

/* ── Cancel edit ────────────────────────────────────── */
cancelBtn.addEventListener('click', () => {
  resetForm();
  showToast('Edit cancelled.', 'info');
});

/* ── Reset form ─────────────────────────────────────── */
function resetForm() {
  form.reset();
  fields.id.value         = '';
  formTitle.textContent   = 'Add New Employee';
  submitBtn.textContent   = 'Add Employee';
  cancelBtn.style.display = 'none';
  Object.values(fields).forEach(f => f.classList?.remove('invalid'));
}

/* ── Search ─────────────────────────────────────────── */
searchInput.addEventListener('input', () => loadEmployees(searchInput.value.trim()));

clearSearch.addEventListener('click', () => {
  searchInput.value = '';
  loadEmployees();
  searchInput.focus();
});

/* ── Keyboard shortcuts ─────────────────────────────── */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (modalOverlay.style.display === 'flex') closeModal();
    else if (fields.id.value) { resetForm(); }
  }
});

/* ── Init ───────────────────────────────────────────── */
loadEmployees();

/* =====================================================
   DARK / LIGHT MODE TOGGLE
   ===================================================== */
const themeToggle = document.getElementById('theme-toggle');
const themeIcon   = themeToggle.querySelector('.theme-icon');

// Apply saved theme on load (default: light)
const savedTheme = localStorage.getItem('theme') || 'light';
applyTheme(savedTheme);

themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  themeIcon.textContent   = theme === 'dark' ? '☀️' : '🌙';
  themeToggle.title       = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  themeToggle.setAttribute('aria-label', themeToggle.title);
}
