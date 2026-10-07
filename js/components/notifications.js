// ==========================================
// LIFEOS - NOTIFICATIONS & CONFIRMATIONS
// ==========================================

export function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icon = type === 'success' ? '✅' : type === 'error' ? '⚠️' : 'ℹ️';
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

export function confirmAction(title, message, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.innerHTML = `
    <div class="modal-content" style="max-width: 420px; text-align: center;">
      <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">⚠️</div>
      <h3 style="margin-bottom: 0.5rem; font-family: var(--font-heading);">${title}</h3>
      <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem;">${message}</p>
      <div style="display: flex; gap: 0.75rem; justify-content: center;">
        <button id="btn-confirm-cancel" class="btn btn-secondary">Cancelar</button>
        <button id="btn-confirm-ok" class="btn btn-danger">Confirmar</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector('#btn-confirm-cancel').addEventListener('click', () => {
    overlay.remove();
  });

  overlay.querySelector('#btn-confirm-ok').addEventListener('click', () => {
    overlay.remove();
    onConfirm();
  });
}
