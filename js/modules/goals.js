// ==========================================
// LIFEOS - GOALS MODULE (HIERARCHY & PROGRESS TRACKING)
// ==========================================
import { supabaseClient, localDb } from '../supabase.js';
import { getCurrentUser } from './auth.js';
import { showToast, confirmAction } from '../components/notifications.js';
import { CATEGORIES, GOAL_LEVELS } from '../config.js';

export async function renderGoals(container) {
  const user = getCurrentUser();
  let goals = [];
  let tasks = [];

  if (supabaseClient && user) {
    const { data: gData } = await supabaseClient.from('goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    const { data: tData } = await supabaseClient.from('tasks').select('*').eq('user_id', user.id);
    goals = gData || [];
    tasks = tData || [];
  } else {
    goals = localDb.get('goals');
    tasks = localDb.get('tasks');
  }

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h1>🎯 Jerarquía de Objetivos</h1>
        <p>Define tus metas a largo plazo y desglósalas en acciones alcanzables.</p>
      </div>
      <button id="btn-open-goal-modal" class="btn btn-primary">+ Nuevo Objetivo</button>
    </div>

    <!-- Leyenda Jerárquica -->
    <div class="card" style="margin-bottom: 1.5rem; background: rgba(30, 40, 62, 0.5);">
      <div style="display: flex; gap: 1rem; align-items: center; justify-content: space-around; flex-wrap: wrap; text-align: center;">
        <div>
          <div style="font-weight: 700; color: var(--accent-purple);">🏆 OBJETIVO GRANDE</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">Visión Anual o Estratégica</div>
        </div>
        <div style="color: var(--text-dim);">➔</div>
        <div>
          <div style="font-weight: 700; color: var(--accent-primary);">📅 OBJETIVO MENSUAL</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">Hitos a 30 Días</div>
        </div>
        <div style="color: var(--text-dim);">➔</div>
        <div>
          <div style="font-weight: 700; color: var(--accent-success);">⚡ OBJETIVO SEMANAL</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">Enfoque Inmediato</div>
        </div>
      </div>
    </div>

    <!-- Grid de Objetivos -->
    <div class="grid-3" id="goals-list-container">
      <!-- Se genera dinámicamente -->
    </div>

    <!-- Modal Nuevo / Editar Objetivo -->
    <div id="goal-modal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3 id="goal-modal-title">Nuevo Objetivo</h3>
          <button class="btn-close-modal" id="btn-close-goal-modal">&times;</button>
        </div>
        <form id="goal-form">
          <input type="hidden" id="goal-id" />

          <div class="form-group">
            <label class="form-label">Título del Objetivo *</label>
            <input type="text" id="goal-title" class="form-control" placeholder="Ej: Dominar Desarrollo Backend, Correr 10k..." required />
          </div>

          <div class="form-group">
            <label class="form-label">Descripción</label>
            <textarea id="goal-description" class="form-control" placeholder="¿Por qué es importante este objetivo?"></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Nivel Jerárquico</label>
              <select id="goal-level" class="form-control">
                ${GOAL_LEVELS.map(l => `<option value="${l}">${l}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Categoría</label>
              <select id="goal-category" class="form-control">
                ${CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Fecha Objetivo</label>
              <input type="date" id="goal-target-date" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">Progreso (%)</label>
              <input type="number" id="goal-progress" class="form-control" min="0" max="100" value="0" />
            </div>
          </div>

          <div style="display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.5rem;">
            <button type="button" class="btn btn-secondary" id="btn-cancel-goal">Cancelar</button>
            <button type="submit" class="btn btn-primary">Guardar Objetivo</button>
          </div>
        </form>
      </div>
    </div>
  `;

  function renderGoalsList() {
    const listEl = container.querySelector('#goals-list-container');
    if (goals.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">🎯</div>
          <h3>Sin Objetivos Creados</h3>
          <p>Comienza definiendo metas claras para potenciar tu productividad.</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = goals.map(g => {
      const boundTasks = tasks.filter(t => t.goal_id === g.id);
      const completedTasks = boundTasks.filter(t => t.status === 'COMPLETADO');
      
      // Auto calcular progreso si existen tareas vinculadas
      let calculatedProgress = g.progress || 0;
      if (boundTasks.length > 0) {
        calculatedProgress = Math.round((completedTasks.length / boundTasks.length) * 100);
      }

      const levelColor = g.level === 'GRANDE' ? 'var(--accent-purple)' : g.level === 'MENSUAL' ? 'var(--accent-primary)' : 'var(--accent-success)';

      return `
        <div class="card" style="border-top: 4px solid ${levelColor};">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <span class="badge" style="background: rgba(255,255,255,0.08); color: ${levelColor};">${g.level}</span>
            <span style="font-size: 0.8rem; color: var(--text-muted);">${g.category || 'Personal'}</span>
          </div>

          <h3 style="font-size: 1.1rem; margin: 0.75rem 0 0.3rem 0;">${escapeHtml(g.title)}</h3>
          <p style="font-size: 0.85rem; color: var(--text-muted); min-height: 40px;">${escapeHtml(g.description || '')}</p>

          <div style="margin-top: 1rem;">
            <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 0.3rem;">
              <span>Avance</span>
              <strong style="color: ${levelColor};">${calculatedProgress}%</strong>
            </div>
            <div style="height: 6px; background: var(--bg-tertiary); border-radius: var(--radius-full); overflow: hidden;">
              <div style="width: ${calculatedProgress}%; height: 100%; background: ${levelColor}; transition: width 0.3s ease;"></div>
            </div>
          </div>

          <div style="margin-top: 1rem; font-size: 0.8rem; color: var(--text-dim); display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
            <span>📋 Tareas: ${completedTasks.length}/${boundTasks.length}</span>
            <div style="display: flex; gap: 0.3rem;">
              <button class="btn btn-secondary btn-sm btn-edit-goal" data-id="${g.id}">✏️</button>
              <button class="btn btn-danger btn-sm btn-delete-goal" data-id="${g.id}">🗑️</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('.btn-edit-goal').forEach(btn => {
      btn.addEventListener('click', (e) => openEditGoalModal(e.target.dataset.id));
    });

    listEl.querySelectorAll('.btn-delete-goal').forEach(btn => {
      btn.addEventListener('click', (e) => deleteGoal(e.target.dataset.id));
    });
  }

  // Modal events
  const modal = container.querySelector('#goal-modal');
  const openBtn = container.querySelector('#btn-open-goal-modal');
  const closeBtn = container.querySelector('#btn-close-goal-modal');
  const cancelBtn = container.querySelector('#btn-cancel-goal');
  const form = container.querySelector('#goal-form');

  function showModal(isEdit = false) {
    container.querySelector('#goal-modal-title').textContent = isEdit ? 'Editar Objetivo' : 'Nuevo Objetivo';
    modal.classList.add('active');
  }

  function hideModal() {
    modal.classList.remove('active');
    form.reset();
    container.querySelector('#goal-id').value = '';
  }

  openBtn.addEventListener('click', () => showModal(false));
  closeBtn.addEventListener('click', hideModal);
  cancelBtn.addEventListener('click', hideModal);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = container.querySelector('#goal-id').value;
    const goalData = {
      title: container.querySelector('#goal-title').value.trim(),
      description: container.querySelector('#goal-description').value.trim(),
      level: container.querySelector('#goal-level').value,
      category: container.querySelector('#goal-category').value,
      target_date: container.querySelector('#goal-target-date').value || null,
      progress: parseInt(container.querySelector('#goal-progress').value) || 0,
      user_id: user?.id
    };

    try {
      if (id) {
        if (supabaseClient && user) {
          await supabaseClient.from('goals').update(goalData).eq('id', id);
        } else {
          localDb.update('goals', id, goalData);
        }
        showToast('Objetivo actualizado', 'success');
      } else {
        if (supabaseClient && user) {
          await supabaseClient.from('goals').insert([goalData]);
        } else {
          localDb.insert('goals', goalData);
        }
        showToast('Nuevo objetivo registrado', 'success');
      }
      hideModal();
      renderGoals(container);
    } catch (err) {
      showToast(err.message || 'Error al guardar objetivo', 'error');
    }
  });

  function openEditGoalModal(id) {
    const g = goals.find(item => item.id === id);
    if (!g) return;
    container.querySelector('#goal-id').value = g.id;
    container.querySelector('#goal-title').value = g.title;
    container.querySelector('#goal-description').value = g.description || '';
    container.querySelector('#goal-level').value = g.level;
    container.querySelector('#goal-category').value = g.category;
    container.querySelector('#goal-target-date').value = g.target_date ? g.target_date.split('T')[0] : '';
    container.querySelector('#goal-progress').value = g.progress || 0;
    showModal(true);
  }

  function deleteGoal(id) {
    confirmAction('Eliminar Objetivo', '¿Eliminar este objetivo y desvincular sus tareas?', async () => {
      if (supabaseClient && user) {
        await supabaseClient.from('goals').delete().eq('id', id);
      } else {
        localDb.delete('goals', id);
      }
      showToast('Objetivo eliminado', 'info');
      renderGoals(container);
    });
  }

  renderGoalsList();
}

function escapeHtml(str) {
  return str ? str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]) : '';
}
