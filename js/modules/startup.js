// ==========================================
// LIFEOS - STARTUP WORKSPACE MODULE (COMPLETE FEATURING ALL MODALS & INTERACTION)
// ==========================================
import { supabaseClient, localDb } from '../supabase.js';
import { getCurrentUser } from './auth.js';
import { showToast, confirmAction } from '../components/notifications.js';
import { STARTUP_STAGES } from '../config.js';

export async function renderStartup(container) {
  const user = getCurrentUser();
  let workspace = null;
  let members = [];
  let roadmap = [];
  let products = [];
  let tasks = [];

  if (supabaseClient && user) {
    const { data: wData } = await supabaseClient.from('startup_workspaces').select('*').limit(1);
    if (wData && wData.length > 0) {
      workspace = wData[0];
    } else {
      const { data: newW } = await supabaseClient.from('startup_workspaces').insert([{ owner_id: user.id, name: 'Mi Startup Hub', description: 'Espacio de aceleración e innovación de Startup.' }]).select();
      workspace = newW ? newW[0] : null;
    }

    if (workspace) {
      const { data: mData } = await supabaseClient.from('startup_members').select('*').eq('workspace_id', workspace.id);
      const { data: rData } = await supabaseClient.from('startup_roadmap').select('*').eq('workspace_id', workspace.id);
      const { data: pData } = await supabaseClient.from('startup_products').select('*').eq('workspace_id', workspace.id);
      const { data: tData } = await supabaseClient.from('startup_tasks').select('*').eq('workspace_id', workspace.id);
      members = mData || [];
      roadmap = rData || [];
      products = pData || [];
      tasks = tData || [];
    }
  } else {
    let wsList = localDb.get('startup_workspaces');
    if (wsList.length === 0) {
      workspace = localDb.insert('startup_workspaces', { owner_id: user?.id, name: 'Mi Startup Hub', description: 'Espacio de aceleración de emprendimiento.' });
    } else {
      workspace = wsList[0];
    }
    members = localDb.get('startup_members');
    roadmap = localDb.get('startup_roadmap');
    products = localDb.get('startup_products');
    tasks = localDb.get('startup_tasks');
  }

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h1>🚀 Startup Workspace: ${escapeHtml(workspace?.name || 'Hub')}</h1>
        <p>Espacio colaborador para aceleración de emprendimiento, producto y roadmap.</p>
      </div>
    </div>

    <!-- Navegación de Pestañas del Workspace -->
    <div style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; flex-wrap: wrap;">
      <button class="btn btn-primary btn-tab active" data-tab="roadmap">🗺️ Roadmap 6 Etapas</button>
      <button class="btn btn-secondary btn-tab" data-tab="team">👥 Equipo (${members.length})</button>
      <button class="btn btn-secondary btn-tab" data-tab="product">📦 Producto (${products.length})</button>
      <button class="btn btn-secondary btn-tab" data-tab="tasks">✅ Tareas Asignadas (${tasks.length})</button>
    </div>

    <!-- TAB 1: ROADMAP DE 6 ETAPAS -->
    <div id="tab-content-roadmap" class="tab-pane active">
      <div class="card" style="margin-bottom: 1.5rem;">
        <h3 style="margin-bottom: 1rem; font-size: 1.15rem;">Roadmap de Aceleración (6 Etapas Obligatorias)</h3>
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          ${STARTUP_STAGES.map((stage, idx) => {
            const stageItem = roadmap.find(r => r.stage === stage);
            const isReached = stageItem?.status === 'ALCANZADO';
            const isInProgress = stageItem?.status === 'EN_PROGRESO';

            return `
              <div style="display: flex; align-items: center; gap: 1rem; background: var(--bg-secondary); padding: 1.1rem; border-radius: var(--radius-md); border-left: 5px solid ${isReached ? 'var(--accent-success)' : isInProgress ? 'var(--accent-warning)' : 'var(--border-color)'}; flex-wrap: wrap;">
                <div style="font-weight: 700; font-size: 1.25rem; width: 32px; color: var(--text-dim);">${idx + 1}.</div>
                <div style="flex: 1; min-width: 200px;">
                  <div style="font-weight: 700; font-size: 1.05rem; display: flex; align-items: center; gap: 0.5rem;">
                    <span>${stage}</span>
                    ${isReached ? '<span class="badge badge-low">ALCANZADO ✅</span>' : isInProgress ? '<span class="badge badge-high">EN PROGRESO ⏳</span>' : '<span class="badge" style="background: rgba(255,255,255,0.05); color: var(--text-dim);">PENDIENTE</span>'}
                  </div>
                  <input type="text" class="form-control input-roadmap-notes" data-stage="${stage}" value="${escapeHtml(stageItem?.notes || '')}" placeholder="Añadir notas u objetivos clave de esta fase..." style="margin-top: 0.4rem; padding: 0.35rem 0.65rem; font-size: 0.825rem;" />
                </div>
                <select class="form-control select-roadmap-status" data-stage="${stage}" style="width: 150px;">
                  <option value="PENDIENTE" ${!stageItem || stageItem.status === 'PENDIENTE' ? 'selected' : ''}>Pendiente</option>
                  <option value="EN_PROGRESO" ${stageItem?.status === 'EN_PROGRESO' ? 'selected' : ''}>En Progreso ⏳</option>
                  <option value="ALCANZADO" ${stageItem?.status === 'ALCANZADO' ? 'selected' : ''}>Alcanzado ✅</option>
                </select>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>

    <!-- TAB 2: EQUIPO -->
    <div id="tab-content-team" class="tab-pane" style="display: none;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
        <h3>Miembros y Roles del Equipo</h3>
        <button id="btn-open-member-modal" class="btn btn-primary">+ Agregar Miembro</button>
      </div>
      <div class="grid-3" id="members-list-container">
        <!-- Miembros renderizados -->
      </div>
    </div>

    <!-- TAB 3: PRODUCTO (BACKLOG DE FEATURES / BUGS / IDEAS) -->
    <div id="tab-content-product" class="tab-pane" style="display: none;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
        <h3>Producto: Funcionalidades, Ideas & Bugs</h3>
        <button id="btn-open-product-modal" class="btn btn-primary">+ Nueva Feature / Idea</button>
      </div>
      <div class="grid-2" id="products-list-container">
        <!-- Items de producto -->
      </div>
    </div>

    <!-- TAB 4: TAREAS DEL EQUIPO -->
    <div id="tab-content-tasks" class="tab-pane" style="display: none;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
        <h3>Tareas de Startup Asignadas</h3>
        <button id="btn-open-stask-modal" class="btn btn-primary">+ Asignar Tarea</button>
      </div>
      <div class="grid-2" id="stasks-list-container">
        <!-- Tareas asignadas -->
      </div>
    </div>

    <!-- MODAL AGREGAR MIEMBRO -->
    <div id="member-modal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Nuevo Miembro del Equipo</h3>
          <button class="btn-close-modal" id="btn-close-member-modal">&times;</button>
        </div>
        <form id="member-form">
          <div class="form-group">
            <label class="form-label">Nombre del Miembro *</label>
            <input type="text" id="member-name" class="form-control" placeholder="Ej: Alex Rivera" required />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Rol en Startup</label>
              <select id="member-role" class="form-control">
                <option value="FOUNDER">Founder</option>
                <option value="CEO">CEO</option>
                <option value="CTO">CTO</option>
                <option value="DEVELOPER" selected>Developer</option>
                <option value="DESIGNER">Designer</option>
                <option value="MARKETING">Marketing</option>
                <option value="ADVISOR">Advisor</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input type="email" id="member-email" class="form-control" placeholder="alex@startup.com" />
            </div>
          </div>
          <div style="display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.5rem;">
            <button type="button" class="btn btn-secondary" id="btn-cancel-member">Cancelar</button>
            <button type="submit" class="btn btn-primary">Agregar Miembro</button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL NUEVO ITEM DE PRODUCTO -->
    <div id="product-modal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Nuevo Item de Producto</h3>
          <button class="btn-close-modal" id="btn-close-product-modal">&times;</button>
        </div>
        <form id="product-form">
          <div class="form-group">
            <label class="form-label">Título del Item *</label>
            <input type="text" id="product-title" class="form-control" placeholder="Ej: Integración con Pasarela de Pago, Bug en Login..." required />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Tipo</label>
              <select id="product-type" class="form-control">
                <option value="FEATURE" selected>Funcionalidad (Feature)</option>
                <option value="IDEA">Idea</option>
                <option value="BUG">Bug / Error</option>
                <option value="MEJORA">Mejora</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Prioridad</label>
              <select id="product-priority" class="form-control">
                <option value="BAJA">Baja</option>
                <option value="MEDIA" selected>Media</option>
                <option value="ALTA">Alta</option>
                <option value="CRITICA">Crítica</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Estado Inicial</label>
            <select id="product-status" class="form-control">
              <option value="BACKLOG">Backlog</option>
              <option value="EN_DESARROLLO">En Desarrollo</option>
              <option value="COMPLETADO">Completado</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Descripción</label>
            <textarea id="product-description" class="form-control" placeholder="Especificaciones o notas..."></textarea>
          </div>
          <div style="display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.5rem;">
            <button type="button" class="btn btn-secondary" id="btn-cancel-product">Cancelar</button>
            <button type="submit" class="btn btn-primary">Guardar en Producto</button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL ASIGNAR TAREA DE STARTUP -->
    <div id="stask-modal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Asignar Tarea de Startup</h3>
          <button class="btn-close-modal" id="btn-close-stask-modal">&times;</button>
        </div>
        <form id="stask-form">
          <div class="form-group">
            <label class="form-label">Título de la Tarea *</label>
            <input type="text" id="stask-title" class="form-control" placeholder="Ej: Diseñar landing page, Configurar CDN..." required />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Asignar a Miembro</label>
              <select id="stask-member" class="form-control">
                <option value="">-- Sin Asignar --</option>
                ${members.map(m => `<option value="${m.id}">${escapeHtml(m.name)} (${m.role})</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Prioridad</label>
              <select id="stask-priority" class="form-control">
                <option value="BAJA">Baja</option>
                <option value="MEDIA" selected>Media</option>
                <option value="ALTA">Alta</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Fecha Límite</label>
            <input type="date" id="stask-date" class="form-control" />
          </div>
          <div style="display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.5rem;">
            <button type="button" class="btn btn-secondary" id="btn-cancel-stask">Cancelar</button>
            <button type="submit" class="btn btn-primary">Asignar Tarea</button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Controladores de Pestañas
  const tabs = container.querySelectorAll('.btn-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      tabs.forEach(t => t.classList.remove('active', 'btn-primary'));
      tabs.forEach(t => t.classList.add('btn-secondary'));
      e.currentTarget.classList.add('active', 'btn-primary');
      e.currentTarget.classList.remove('btn-secondary');

      container.querySelectorAll('.tab-pane').forEach(p => p.style.display = 'none');
      const target = e.currentTarget.dataset.tab;
      container.querySelector(`#tab-content-${target}`).style.display = 'block';
    });
  });

  // Roadmap change listeners
  container.querySelectorAll('.select-roadmap-status').forEach(sel => {
    sel.addEventListener('change', async (e) => {
      const stage = e.target.dataset.stage;
      const status = e.target.value;
      const notes = container.querySelector(`.input-roadmap-notes[data-stage="${stage}"]`)?.value || '';
      
      if (supabaseClient && user && workspace) {
        await supabaseClient.from('startup_roadmap').upsert([{ workspace_id: workspace.id, stage, status, notes }]);
      } else {
        let rList = localDb.get('startup_roadmap');
        const idx = rList.findIndex(r => r.stage === stage);
        if (idx !== -1) {
          rList[idx].status = status;
          rList[idx].notes = notes;
        } else {
          rList.push({ id: crypto.randomUUID(), workspace_id: workspace.id, stage, status, notes });
        }
        localDb.set('startup_roadmap', rList);
      }
      showToast(`Fase ${stage} actualizada a ${status}`, 'success');
    });
  });

  // Renderizar Sublistas (Equipo, Producto, Tareas)
  function renderSubLists() {
    // 1. Equipo
    const mEl = container.querySelector('#members-list-container');
    mEl.innerHTML = members.length === 0 ? `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">👥</div>
        <h3>Sin Miembros en el Equipo</h3>
        <p>Agrega los integrantes de tu startup y asignales un rol.</p>
      </div>
    ` : members.map(m => `
      <div class="card" style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h4 style="font-size: 1rem; font-weight: 700;">${escapeHtml(m.name)}</h4>
          <span class="badge badge-medium" style="margin-top: 0.3rem;">${m.role}</span>
          ${m.email ? `<div style="font-size: 0.8rem; color: var(--text-dim); margin-top: 0.3rem;">📧 ${escapeHtml(m.email)}</div>` : ''}
        </div>
        <button class="btn btn-danger btn-sm btn-delete-member" data-id="${m.id}">🗑️</button>
      </div>
    `).join('');

    mEl.querySelectorAll('.btn-delete-member').forEach(btn => {
      btn.addEventListener('click', (e) => deleteMember(e.currentTarget.dataset.id));
    });

    // 2. Producto
    const pEl = container.querySelector('#products-list-container');
    pEl.innerHTML = products.length === 0 ? `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">📦</div>
        <h3>Sin Items en el Backlog de Producto</h3>
        <p>Registra funcionalidades, ideas o bugs prioritarios para tu producto.</p>
      </div>
    ` : products.map(p => `
      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <span class="badge ${p.type === 'BUG' ? 'badge-urgent' : 'badge-high'}">${p.type}</span>
            <h4 style="font-size: 1.05rem; margin-top: 0.4rem;">${escapeHtml(p.title)}</h4>
          </div>
          <span class="badge badge-medium">${p.status}</span>
        </div>
        ${p.description ? `<p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.5rem;">${escapeHtml(p.description)}</p>` : ''}
        <div style="margin-top: 1rem; text-align: right; border-top: 1px solid var(--border-color); padding-top: 0.6rem;">
          <button class="btn btn-danger btn-sm btn-delete-product" data-id="${p.id}">🗑️ Eliminar</button>
        </div>
      </div>
    `).join('');

    pEl.querySelectorAll('.btn-delete-product').forEach(btn => {
      btn.addEventListener('click', (e) => deleteProduct(e.currentTarget.dataset.id));
    });

    // 3. Tareas Asignadas
    const tEl = container.querySelector('#stasks-list-container');
    tEl.innerHTML = tasks.length === 0 ? `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">✅</div>
        <h3>Sin Tareas de Startup Asignadas</h3>
        <p>Asigna tareas específicas a los miembros de tu equipo.</p>
      </div>
    ` : tasks.map(t => {
      const assignedMember = members.find(m => m.id === t.assigned_member_id);
      const isDone = t.status === 'COMPLETADO';

      return `
        <div class="card" style="opacity: ${isDone ? '0.6' : '1'};">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div style="display: flex; gap: 0.6rem; align-items: flex-start;">
              <input type="checkbox" class="stask-check" data-id="${t.id}" ${isDone ? 'checked' : ''} style="margin-top: 0.25rem; width: 18px; height: 18px; cursor: pointer;" />
              <div>
                <h4 style="font-size: 1rem; ${isDone ? 'text-decoration: line-through;' : ''}">${escapeHtml(t.title)}</h4>
                <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">
                  👤 Asignado a: <strong>${assignedMember ? escapeHtml(assignedMember.name) : 'Sin asignar'}</strong>
                </div>
              </div>
            </div>
            <button class="btn btn-danger btn-sm btn-delete-stask" data-id="${t.id}">🗑️</button>
          </div>
        </div>
      `;
    }).join('');

    tEl.querySelectorAll('.stask-check').forEach(chk => {
      chk.addEventListener('change', async (e) => {
        const id = e.target.dataset.id;
        const status = e.target.checked ? 'COMPLETADO' : 'PENDIENTE';
        if (supabaseClient && user) {
          await supabaseClient.from('startup_tasks').update({ status }).eq('id', id);
        } else {
          localDb.update('startup_tasks', id, { status });
        }
        renderStartup(container);
      });
    });

    tEl.querySelectorAll('.btn-delete-stask').forEach(btn => {
      btn.addEventListener('click', (e) => deleteSTask(e.currentTarget.dataset.id));
    });
  }

  // Modales
  const mModal = container.querySelector('#member-modal');
  const pModal = container.querySelector('#product-modal');
  const sModal = container.querySelector('#stask-modal');

  container.querySelector('#btn-open-member-modal')?.addEventListener('click', () => mModal.classList.add('active'));
  container.querySelector('#btn-close-member-modal')?.addEventListener('click', () => mModal.classList.remove('active'));
  container.querySelector('#btn-cancel-member')?.addEventListener('click', () => mModal.classList.remove('active'));

  container.querySelector('#btn-open-product-modal')?.addEventListener('click', () => pModal.classList.add('active'));
  container.querySelector('#btn-close-product-modal')?.addEventListener('click', () => pModal.classList.remove('active'));
  container.querySelector('#btn-cancel-product')?.addEventListener('click', () => pModal.classList.remove('active'));

  container.querySelector('#btn-open-stask-modal')?.addEventListener('click', () => sModal.classList.add('active'));
  container.querySelector('#btn-close-stask-modal')?.addEventListener('click', () => sModal.classList.remove('active'));
  container.querySelector('#btn-cancel-stask')?.addEventListener('click', () => sModal.classList.remove('active'));

  // Form Submits
  container.querySelector('#member-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      workspace_id: workspace.id,
      name: container.querySelector('#member-name').value.trim(),
      role: container.querySelector('#member-role').value,
      email: container.querySelector('#member-email').value.trim() || null
    };

    if (supabaseClient && user) {
      await supabaseClient.from('startup_members').insert([data]);
    } else {
      localDb.insert('startup_members', data);
    }
    showToast('Miembro agregado al equipo', 'success');
    mModal.classList.remove('active');
    renderStartup(container);
  });

  container.querySelector('#product-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      workspace_id: workspace.id,
      title: container.querySelector('#product-title').value.trim(),
      type: container.querySelector('#product-type').value,
      priority: container.querySelector('#product-priority').value,
      status: container.querySelector('#product-status').value,
      description: container.querySelector('#product-description').value.trim()
    };

    if (supabaseClient && user) {
      await supabaseClient.from('startup_products').insert([data]);
    } else {
      localDb.insert('startup_products', data);
    }
    showToast('Item añadido al backlog de producto', 'success');
    pModal.classList.remove('active');
    renderStartup(container);
  });

  container.querySelector('#stask-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      workspace_id: workspace.id,
      title: container.querySelector('#stask-title').value.trim(),
      assigned_member_id: container.querySelector('#stask-member').value || null,
      priority: container.querySelector('#stask-priority').value,
      due_date: container.querySelector('#stask-date').value || null,
      status: 'PENDIENTE'
    };

    if (supabaseClient && user) {
      await supabaseClient.from('startup_tasks').insert([data]);
    } else {
      localDb.insert('startup_tasks', data);
    }
    showToast('Tarea asignada exitosamente', 'success');
    sModal.classList.remove('active');
    renderStartup(container);
  });

  function deleteMember(id) {
    confirmAction('Eliminar Miembro', '¿Eliminar este miembro del equipo?', async () => {
      if (supabaseClient && user) {
        await supabaseClient.from('startup_members').delete().eq('id', id);
      } else {
        localDb.delete('startup_members', id);
      }
      showToast('Miembro eliminado', 'info');
      renderStartup(container);
    });
  }

  function deleteProduct(id) {
    confirmAction('Eliminar Item', '¿Eliminar este item de producto?', async () => {
      if (supabaseClient && user) {
        await supabaseClient.from('startup_products').delete().eq('id', id);
      } else {
        localDb.delete('startup_products', id);
      }
      showToast('Item eliminado', 'info');
      renderStartup(container);
    });
  }

  function deleteSTask(id) {
    confirmAction('Eliminar Tarea', '¿Eliminar esta tarea de startup?', async () => {
      if (supabaseClient && user) {
        await supabaseClient.from('startup_tasks').delete().eq('id', id);
      } else {
        localDb.delete('startup_tasks', id);
      }
      showToast('Tarea eliminada', 'info');
      renderStartup(container);
    });
  }

  renderSubLists();
}

function escapeHtml(str) {
  return str ? str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]) : '';
}
