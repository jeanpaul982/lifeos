// ==========================================
// LIFEOS - TASKS MODULE (CRUD, FILTERS & AUTOMATIC GOAL PROGRESS SYNC)
// ==========================================
import { supabaseClient, localDb } from '../supabase.js';
import { getCurrentUser } from './auth.js';
import { showToast, confirmAction } from '../components/notifications.js';
import { CATEGORIES, PRIORITIES } from '../config.js';

export async function renderTasks(container) {
  const user = getCurrentUser();
  let tasks = [];
  let goals = [];

  if (supabaseClient && user) {
    const { data: tData } = await supabaseClient.from('tasks').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    const { data: gData } = await supabaseClient.from('goals').select('*').eq('user_id', user.id);
    tasks = tData || [];
    goals = gData || [];
  } else {
    tasks = localDb.get('tasks');
    goals = localDb.get('goals');
  }

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h1>✅ Gestión de Tareas</h1>
        <p>Organiza, prioriza y completa tus acciones diarias.</p>
      </div>
      <button id="btn-open-task-modal" class="btn btn-primary">+ Nueva Tarea</button>
    </div>

    <!-- Barra de Filtros y Búsqueda -->
    <div class="card" style="margin-bottom: 1.5rem; padding: 1rem;">
      <div style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: center; justify-content: space-between;">
        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; flex: 1;">
          <select id="filter-status" class="form-control" style="width: 150px;">
            <option value="TODOS">Todos los Estados</option>
            <option value="PENDIENTE">Pendientes</option>
            <option value="COMPLETADO">Completadas</option>
          </select>

          <select id="filter-category" class="form-control" style="width: 160px;">
            <option value="TODAS">Todas las Categorías</option>
            ${CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>

          <select id="filter-priority" class="form-control" style="width: 150px;">
            <option value="TODAS">Todas las Prioridades</option>
            ${PRIORITIES.map(p => `<option value="${p.id}">${p.label}</option>`).join('')}
          </select>
        </div>

        <select id="sort-by" class="form-control" style="width: 170px;">
          <option value="FECHA_CREACION">Más Recientes</option>
          <option value="PRIORIDAD">Por Prioridad</option>
          <option value="DURACION">Por Duración</option>
        </select>
      </div>
    </div>

    <!-- Lista de Tareas -->
    <div id="tasks-list-container" class="grid-2">
      <!-- Tareas dinámicas -->
    </div>

    <!-- Modal de Creación / Edición de Tarea -->
    <div id="task-modal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3 id="task-modal-title">Nueva Tarea</h3>
          <button class="btn-close-modal" id="btn-close-task-modal">&times;</button>
        </div>
        <form id="task-form">
          <input type="hidden" id="task-id" />
          
          <div class="form-group">
            <label class="form-label">Título de la Tarea *</label>
            <input type="text" id="task-title" class="form-control" placeholder="Ej: Estudiar SQL, Entrenar piernas..." required />
          </div>

          <div class="form-group">
            <label class="form-label">Descripción</label>
            <textarea id="task-description" class="form-control" placeholder="Detalles o notas sobre la tarea..."></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Categoría</label>
              <select id="task-category" class="form-control">
                ${CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Prioridad</label>
              <select id="task-priority" class="form-control">
                ${PRIORITIES.map(p => `<option value="${p.id}">${p.label}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Duración (minutos)</label>
              <input type="number" id="task-minutes" class="form-control" value="30" min="5" step="5" />
            </div>
            <div class="form-group">
              <label class="form-label">Fecha Límite</label>
              <input type="date" id="task-due-date" class="form-control" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Vinculado a Objetivo</label>
            <select id="task-goal" class="form-control">
              <option value="">-- Ninguno --</option>
              ${goals.map(g => `<option value="${g.id}">${escapeHtml(g.title)} (${g.level})</option>`).join('')}
            </select>
          </div>

          <div style="display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.5rem;">
            <button type="button" class="btn btn-secondary" id="btn-cancel-task">Cancelar</button>
            <button type="submit" class="btn btn-primary">Guardar Tarea</button>
          </div>
        </form>
      </div>
    </div>
  `;

  function renderTaskList() {
    const statusFilter = container.querySelector('#filter-status').value;
    const catFilter = container.querySelector('#filter-category').value;
    const prioFilter = container.querySelector('#filter-priority').value;
    const sortBy = container.querySelector('#sort-by').value;

    let filtered = [...tasks];

    if (statusFilter !== 'TODOS') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }
    if (catFilter !== 'TODAS') {
      filtered = filtered.filter(t => t.category === catFilter);
    }
    if (prioFilter !== 'TODAS') {
      filtered = filtered.filter(t => t.priority === prioFilter);
    }

    if (sortBy === 'PRIORIDAD') {
      const pOrder = { 'URGENTE': 1, 'ALTA': 2, 'MEDIA': 3, 'BAJA': 4 };
      filtered.sort((a, b) => pOrder[a.priority] - pOrder[b.priority]);
    } else if (sortBy === 'DURACION') {
      filtered.sort((a, b) => (a.estimated_minutes || 0) - (b.estimated_minutes || 0));
    }

    const listEl = container.querySelector('#tasks-list-container');
    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">✅</div>
          <h3>No hay tareas con estos filtros</h3>
          <p>Crea una nueva tarea o modifica tus filtros de búsqueda.</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = filtered.map(t => {
      const isCompleted = t.status === 'COMPLETADO';
      const goal = goals.find(g => g.id === t.goal_id);

      return `
        <div class="card" style="opacity: ${isCompleted ? '0.65' : '1'};">
          <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 0.75rem;">
            <div style="display: flex; align-items: flex-start; gap: 0.75rem; flex: 1;">
              <input type="checkbox" class="task-check" data-id="${t.id}" ${isCompleted ? 'checked' : ''} style="margin-top: 0.25rem; width: 18px; height: 18px; cursor: pointer;" />
              <div>
                <h3 style="font-size: 1rem; ${isCompleted ? 'text-decoration: line-through;' : ''}">${escapeHtml(t.title)}</h3>
                ${t.description ? `<p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">${escapeHtml(t.description)}</p>` : ''}
              </div>
            </div>
            <span class="badge ${getPriorityBadgeClass(t.priority)}">${t.priority}</span>
          </div>

          <div style="margin-top: 1rem; display: flex; align-items: center; justify-content: space-between; font-size: 0.8rem; color: var(--text-muted); border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
            <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
              <span>📁 ${t.category}</span>
              <span>⏱️ ${t.estimated_minutes || 30}m</span>
              ${goal ? `<span>🎯 ${escapeHtml(goal.title)}</span>` : ''}
            </div>
            
            <div style="display: flex; gap: 0.4rem;">
              <button class="btn btn-secondary btn-sm btn-edit-task" data-id="${t.id}">✏️</button>
              <button class="btn btn-danger btn-sm btn-delete-task" data-id="${t.id}">🗑️</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('.task-check').forEach(chk => {
      chk.addEventListener('change', (e) => toggleTaskStatus(e.target.dataset.id, e.target.checked));
    });

    listEl.querySelectorAll('.btn-edit-task').forEach(btn => {
      btn.addEventListener('click', (e) => openEditTaskModal(e.target.dataset.id));
    });

    listEl.querySelectorAll('.btn-delete-task').forEach(btn => {
      btn.addEventListener('click', (e) => deleteTask(e.target.dataset.id));
    });
  }

  // Bind de Filtros
  ['filter-status', 'filter-category', 'filter-priority', 'sort-by'].forEach(id => {
    container.querySelector(`#${id}`).addEventListener('change', renderTaskList);
  });

  // Modal handlers
  const modal = container.querySelector('#task-modal');
  const openModalBtn = container.querySelector('#btn-open-task-modal');
  const closeModalBtn = container.querySelector('#btn-close-task-modal');
  const cancelModalBtn = container.querySelector('#btn-cancel-task');
  const form = container.querySelector('#task-form');

  function showModal(isEdit = false) {
    container.querySelector('#task-modal-title').textContent = isEdit ? 'Editar Tarea' : 'Nueva Tarea';
    modal.classList.add('active');
  }

  function hideModal() {
    modal.classList.remove('active');
    form.reset();
    container.querySelector('#task-id').value = '';
  }

  openModalBtn.addEventListener('click', () => showModal(false));
  closeModalBtn.addEventListener('click', hideModal);
  cancelModalBtn.addEventListener('click', hideModal);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = container.querySelector('#task-id').value;
    const taskData = {
      title: container.querySelector('#task-title').value.trim(),
      description: container.querySelector('#task-description').value.trim(),
      category: container.querySelector('#task-category').value,
      priority: container.querySelector('#task-priority').value,
      estimated_minutes: parseInt(container.querySelector('#task-minutes').value) || 30,
      due_date: container.querySelector('#task-due-date').value || null,
      goal_id: container.querySelector('#task-goal').value || null,
      user_id: user?.id
    };

    try {
      if (id) {
        if (supabaseClient && user) {
          await supabaseClient.from('tasks').update(taskData).eq('id', id);
        } else {
          localDb.update('tasks', id, taskData);
        }
        showToast('Tarea actualizada exitosamente', 'success');
      } else {
        taskData.status = 'PENDIENTE';
        if (supabaseClient && user) {
          await supabaseClient.from('tasks').insert([taskData]);
        } else {
          localDb.insert('tasks', taskData);
        }
        showToast('Nueva tarea creada', 'success');
      }
      hideModal();
      renderTasks(container);
    } catch (err) {
      showToast(err.message || 'Error al guardar la tarea', 'error');
    }
  });

  async function toggleTaskStatus(id, isCompleted) {
    const status = isCompleted ? 'COMPLETADO' : 'PENDIENTE';
    const targetTask = tasks.find(t => t.id === id);

    if (supabaseClient && user) {
      await supabaseClient.from('tasks').update({ status }).eq('id', id);
    } else {
      localDb.update('tasks', id, { status });
    }

    // Auto sincronizar porcentaje de progreso en el objetivo si tiene uno asignado
    if (targetTask && targetTask.goal_id) {
      await updateGoalProgress(targetTask.goal_id);
    }

    showToast(isCompleted ? '¡Tarea completada! 🎉' : 'Tarea marcada como pendiente', 'info');
    renderTasks(container);
  }

  async function updateGoalProgress(goalId) {
    let bound = [];
    if (supabaseClient && user) {
      const { data } = await supabaseClient.from('tasks').select('*').eq('goal_id', goalId);
      bound = data || [];
    } else {
      bound = localDb.get('tasks').filter(t => t.goal_id === goalId);
    }

    if (bound.length > 0) {
      const completed = bound.filter(t => t.status === 'COMPLETADO').length;
      const progress = Math.round((completed / bound.length) * 100);
      if (supabaseClient && user) {
        await supabaseClient.from('goals').update({ progress }).eq('id', goalId);
      } else {
        localDb.update('goals', goalId, { progress });
      }
    }
  }

  function openEditTaskModal(id) {
    const t = tasks.find(item => item.id === id);
    if (!t) return;

    container.querySelector('#task-id').value = t.id;
    container.querySelector('#task-title').value = t.title;
    container.querySelector('#task-description').value = t.description || '';
    container.querySelector('#task-category').value = t.category;
    container.querySelector('#task-priority').value = t.priority;
    container.querySelector('#task-minutes').value = t.estimated_minutes || 30;
    container.querySelector('#task-due-date').value = t.due_date ? t.due_date.split('T')[0] : '';
    container.querySelector('#task-goal').value = t.goal_id || '';

    showModal(true);
  }

  function deleteTask(id) {
    confirmAction('Eliminar Tarea', '¿Estás seguro de que deseas eliminar esta tarea?', async () => {
      if (supabaseClient && user) {
        await supabaseClient.from('tasks').delete().eq('id', id);
      } else {
        localDb.delete('tasks', id);
      }
      showToast('Tarea eliminada', 'info');
      renderTasks(container);
    });
  }

  renderTaskList();
}

function getPriorityBadgeClass(priority) {
  switch (priority) {
    case 'URGENTE': return 'badge-urgent';
    case 'ALTA': return 'badge-high';
    case 'MEDIA': return 'badge-medium';
    default: return 'badge-low';
  }
}

function escapeHtml(str) {
  return str ? str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]) : '';
}
