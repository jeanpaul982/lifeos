// ==========================================
// LIFEOS - PROJECTS MODULE (KANBAN & TASKS BY STAGE)
// ==========================================
import { supabaseClient, localDb } from '../supabase.js';
import { getCurrentUser } from './auth.js';
import { showToast, confirmAction } from '../components/notifications.js';

export async function renderProjects(container) {
  const user = getCurrentUser();
  let projects = [];
  let pTasks = [];

  if (supabaseClient && user) {
    const { data: prData } = await supabaseClient.from('projects').select('*').eq('user_id', user.id);
    const { data: ptData } = await supabaseClient.from('project_tasks').select('*');
    projects = prData || [];
    pTasks = ptData || [];
  } else {
    projects = localDb.get('projects');
    pTasks = localDb.get('project_tasks');
  }

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h1>💻 Proyectos Personales</h1>
        <p>Gestiona desarrollos, emprendimientos y entregables por fases de ciclo de vida.</p>
      </div>
      <button id="btn-open-project-modal" class="btn btn-primary">+ Nuevo Proyecto</button>
    </div>

    <!-- Lista de Proyectos -->
    <div class="grid-2" id="projects-list-container">
      <!-- Proyectos dinámicos -->
    </div>

    <!-- Modal Nuevo Proyecto -->
    <div id="project-modal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Nuevo Proyecto</h3>
          <button class="btn-close-modal" id="btn-close-project-modal">&times;</button>
        </div>
        <form id="project-form">
          <div class="form-group">
            <label class="form-label">Nombre del Proyecto *</label>
            <input type="text" id="project-name" class="form-control" placeholder="Ej: App Móvil de Finanzas, Portfolio 3D..." required />
          </div>
          <div class="form-group">
            <label class="form-label">Descripción</label>
            <textarea id="project-description" class="form-control" placeholder="Objetivo técnico o alcance del proyecto..."></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Fase Actual</label>
              <select id="project-status" class="form-control">
                <option value="IDEA">Idea</option>
                <option value="PLANIFICACIÓN">Planificación</option>
                <option value="DESARROLLO" selected>Desarrollo</option>
                <option value="PRUEBAS">Pruebas</option>
                <option value="COMPLETADO">Completado</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Prioridad</label>
              <select id="project-priority" class="form-control">
                <option value="BAJA">Baja</option>
                <option value="MEDIA" selected>Media</option>
                <option value="ALTA">Alta</option>
                <option value="CRITICA">Crítica</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Fecha Límite</label>
            <input type="date" id="project-deadline" class="form-control" />
          </div>
          <div style="display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.5rem;">
            <button type="button" class="btn btn-secondary" id="btn-cancel-project">Cancelar</button>
            <button type="submit" class="btn btn-primary">Crear Proyecto</button>
          </div>
        </form>
      </div>
    </div>
  `;

  function renderProjectsList() {
    const listEl = container.querySelector('#projects-list-container');
    if (projects.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">💻</div>
          <h3>Sin Proyectos Activos</h3>
          <p>Crea tu primer proyecto para desglosar sus tareas técnicas.</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = projects.map(p => {
      const boundTasks = pTasks.filter(t => t.project_id === p.id);
      const completedCount = boundTasks.filter(t => t.status === 'COMPLETADO').length;
      const progress = boundTasks.length > 0 ? Math.round((completedCount / boundTasks.length) * 100) : p.progress || 0;

      return `
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h3 style="font-size: 1.15rem;">${escapeHtml(p.name)}</h3>
              <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">${escapeHtml(p.description || '')}</p>
            </div>
            <span class="badge badge-medium">${p.status}</span>
          </div>

          <div style="margin-top: 1rem;">
            <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 0.3rem;">
              <span>Avance General</span>
              <strong>${progress}%</strong>
            </div>
            <div style="height: 6px; background: var(--bg-tertiary); border-radius: var(--radius-full); overflow: hidden;">
              <div style="width: ${progress}%; height: 100%; background: var(--accent-purple);"></div>
            </div>
          </div>

          <!-- Tareas Técnicas del Proyecto -->
          <div style="margin-top: 1rem; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
            <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.5rem;">⚙️ Hitos / Tareas del Proyecto</div>
            <div style="display: flex; flex-direction: column; gap: 0.4rem; max-height: 140px; overflow-y: auto;">
              ${boundTasks.map(t => `
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; background: var(--bg-secondary); padding: 0.4rem 0.65rem; border-radius: var(--radius-sm);">
                  <span>${escapeHtml(t.title)}</span>
                  <select class="form-control select-ptask-status" data-id="${t.id}" style="width: 120px; padding: 0.2rem 0.4rem; font-size: 0.75rem;">
                    <option value="IDEA" ${t.status === 'IDEA' ? 'selected' : ''}>Idea</option>
                    <option value="PLANIFICACIÓN" ${t.status === 'PLANIFICACIÓN' ? 'selected' : ''}>Planif</option>
                    <option value="DESARROLLO" ${t.status === 'DESARROLLO' ? 'selected' : ''}>Desarrollo</option>
                    <option value="PRUEBAS" ${t.status === 'PRUEBAS' ? 'selected' : ''}>Pruebas</option>
                    <option value="COMPLETADO" ${t.status === 'COMPLETADO' ? 'selected' : ''}>Listo ✅</option>
                  </select>
                </div>
              `).join('')}
            </div>

            <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem;">
              <input type="text" class="form-control input-new-ptask" data-project-id="${p.id}" placeholder="+ Nueva tarea técnica..." style="padding: 0.35rem 0.65rem; font-size: 0.8rem;" />
              <button class="btn btn-secondary btn-sm btn-add-ptask" data-project-id="${p.id}">Añadir</button>
            </div>
          </div>

          <div style="margin-top: 0.75rem; text-align: right;">
            <button class="btn btn-danger btn-sm btn-delete-project" data-id="${p.id}">🗑️ Eliminar</button>
          </div>
        </div>
      `;
    }).join('');

    // Handlers
    listEl.querySelectorAll('.select-ptask-status').forEach(sel => {
      sel.addEventListener('change', async (e) => {
        const id = e.target.dataset.id;
        const status = e.target.value;
        if (supabaseClient && user) {
          await supabaseClient.from('project_tasks').update({ status }).eq('id', id);
        } else {
          localDb.update('project_tasks', id, { status });
        }
        renderProjects(container);
      });
    });

    listEl.querySelectorAll('.btn-add-ptask').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const projectId = e.currentTarget.dataset.projectId;
        const input = container.querySelector(`.input-new-ptask[data-project-id="${projectId}"]`);
        const title = input.value.trim();
        if (!title) return;

        const data = { project_id: projectId, title, status: 'DESARROLLO' };
        if (supabaseClient && user) {
          await supabaseClient.from('project_tasks').insert([data]);
        } else {
          localDb.insert('project_tasks', data);
        }
        showToast('Tarea de proyecto añadida', 'success');
        renderProjects(container);
      });
    });

    listEl.querySelectorAll('.btn-delete-project').forEach(btn => {
      btn.addEventListener('click', (e) => deleteProject(e.currentTarget.dataset.id));
    });
  }

  // Modal
  const modal = container.querySelector('#project-modal');
  container.querySelector('#btn-open-project-modal').addEventListener('click', () => modal.classList.add('active'));
  container.querySelector('#btn-close-project-modal').addEventListener('click', () => modal.classList.remove('active'));
  container.querySelector('#btn-cancel-project').addEventListener('click', () => modal.classList.remove('active'));

  container.querySelector('#project-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      name: container.querySelector('#project-name').value.trim(),
      description: container.querySelector('#project-description').value.trim(),
      status: container.querySelector('#project-status').value,
      priority: container.querySelector('#project-priority').value,
      deadline: container.querySelector('#project-deadline').value || null,
      user_id: user?.id
    };

    if (supabaseClient && user) {
      await supabaseClient.from('projects').insert([data]);
    } else {
      localDb.insert('projects', data);
    }

    showToast('Proyecto creado', 'success');
    modal.classList.remove('active');
    renderProjects(container);
  });

  function deleteProject(id) {
    confirmAction('Eliminar Proyecto', '¿Eliminar este proyecto y sus tareas?', async () => {
      if (supabaseClient && user) {
        await supabaseClient.from('projects').delete().eq('id', id);
      } else {
        localDb.delete('projects', id);
      }
      showToast('Proyecto eliminado', 'info');
      renderProjects(container);
    });
  }

  renderProjectsList();
}

function escapeHtml(str) {
  return str ? str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]) : '';
}
