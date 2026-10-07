// ==========================================
// LIFEOS - QUICK ACTION MODAL BUTTON (+)
// ==========================================

export function initQuickActionModal() {
  const modal = document.createElement('div');
  modal.id = 'quick-action-modal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 440px;">
      <div class="modal-header">
        <h3>⚡ Acción Rápida</h3>
        <button class="btn-close-modal" id="btn-close-quick-modal">&times;</button>
      </div>
      <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 1.25rem;">Selecciona el elemento que deseas crear instantáneamente:</p>
      
      <div style="display: flex; flex-direction: column; gap: 0.65rem;">
        <button class="btn btn-secondary btn-quick-target" data-view="tasks" style="justify-content: flex-start; padding: 0.8rem 1rem;">
          <span style="font-size: 1.2rem;">✅</span> Nueva Tarea
        </button>
        <button class="btn btn-secondary btn-quick-target" data-view="goals" style="justify-content: flex-start; padding: 0.8rem 1rem;">
          <span style="font-size: 1.2rem;">🎯</span> Nuevo Objetivo
        </button>
        <button class="btn btn-secondary btn-quick-target" data-view="habits" style="justify-content: flex-start; padding: 0.8rem 1rem;">
          <span style="font-size: 1.2rem;">🧠</span> Nuevo Hábito
        </button>
        <button class="btn btn-secondary btn-quick-target" data-view="study" style="justify-content: flex-start; padding: 0.8rem 1rem;">
          <span style="font-size: 1.2rem;">📚</span> Registrar Sesión de Estudio
        </button>
        <button class="btn btn-secondary btn-quick-target" data-view="gym" style="justify-content: flex-start; padding: 0.8rem 1rem;">
          <span style="font-size: 1.2rem;">🏋️</span> Nuevo Entrenamiento Gym
        </button>
        <button class="btn btn-secondary btn-quick-target" data-view="sports" style="justify-content: flex-start; padding: 0.8rem 1rem;">
          <span style="font-size: 1.2rem;">⚽</span> Nueva Sesión Deportiva
        </button>
        <button class="btn btn-secondary btn-quick-target" data-view="projects" style="justify-content: flex-start; padding: 0.8rem 1rem;">
          <span style="font-size: 1.2rem;">💻</span> Nuevo Proyecto
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('#btn-close-quick-modal').addEventListener('click', () => {
    modal.classList.remove('active');
  });

  modal.querySelectorAll('.btn-quick-target').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const view = e.currentTarget.dataset.view;
      modal.classList.remove('active');

      const navBtn = document.querySelector(`.nav-item[data-view="${view}"]`);
      if (navBtn) navBtn.click();

      setTimeout(() => {
        const createBtn = document.querySelector('#btn-open-task-modal, #btn-open-goal-modal, #btn-open-habit-modal, #btn-open-session-modal, #btn-open-workout-modal, #btn-open-sport-modal, #btn-open-project-modal');
        createBtn?.click();
      }, 200);
    });
  });

  document.getElementById('btn-global-quick-add')?.addEventListener('click', () => {
    modal.classList.add('active');
  });
}
