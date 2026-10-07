// ==========================================
// LIFEOS - SPORTS SESSIONS MODULE
// ==========================================
import { supabaseClient, localDb } from '../supabase.js';
import { getCurrentUser } from './auth.js';
import { showToast, confirmAction } from '../components/notifications.js';

export async function renderSports(container) {
  const user = getCurrentUser();
  let sessions = [];

  if (supabaseClient && user) {
    const { data } = await supabaseClient.from('sports_sessions').select('*').eq('user_id', user.id).order('date', { ascending: false });
    sessions = data || [];
  } else {
    sessions = localDb.get('sports_sessions');
  }

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h1>⚽ Actividad Deportiva</h1>
        <p>Registra tus partidos, carreras, natación y entrenamientos de cardio.</p>
      </div>
      <button id="btn-open-sport-modal" class="btn btn-primary">+ Nueva Sesión</button>
    </div>

    <div class="grid-3" id="sports-list-container">
      <!-- Sesiones dinámicas -->
    </div>

    <!-- Modal Nueva Sesión Deportiva -->
    <div id="sport-modal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Registrar Actividad Deportiva</h3>
          <button class="btn-close-modal" id="btn-close-sport-modal">&times;</button>
        </div>
        <form id="sport-form">
          <div class="form-group">
            <label class="form-label">Deporte / Actividad *</label>
            <input type="text" id="sport-name" class="form-control" placeholder="Ej: Fútbol, Natación, Running 5k, Padel..." required />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Duración (minutos)</label>
              <input type="number" id="sport-duration" class="form-control" value="60" min="10" step="5" required />
            </div>
            <div class="form-group">
              <label class="form-label">Intensidad</label>
              <select id="sport-intensity" class="form-control">
                <option value="SUAVE">Suave</option>
                <option value="MODERADA" selected>Moderada</option>
                <option value="ALTA">Alta</option>
                <option value="EXTREMA">Extrema</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Fecha</label>
            <input type="date" id="sport-date" class="form-control" value="${new Date().toISOString().split('T')[0]}" required />
          </div>

          <div class="form-group">
            <label class="form-label">Notas / Sensaciones</label>
            <textarea id="sport-notes" class="form-control" placeholder="Marcador, distancia recorrida, estado físico..."></textarea>
          </div>

          <div style="display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.5rem;">
            <button type="button" class="btn btn-secondary" id="btn-cancel-sport">Cancelar</button>
            <button type="submit" class="btn btn-primary">Guardar Sesión</button>
          </div>
        </form>
      </div>
    </div>
  `;

  function renderSportsList() {
    const listEl = container.querySelector('#sports-list-container');
    if (sessions.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">⚽</div>
          <h3>Sin Sesiones Deportivas</h3>
          <p>Registra tus actividades de cardio o deportes en equipo.</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = sessions.map(s => {
      const intClass = s.intensity === 'EXTREMA' ? 'badge-urgent' : s.intensity === 'ALTA' ? 'badge-high' : 'badge-medium';

      return `
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h3 style="font-size: 1.15rem;">${escapeHtml(s.sport)}</h3>
              <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">📅 ${s.date}</div>
            </div>
            <span class="badge ${intClass}">${s.intensity}</span>
          </div>

          <div style="margin-top: 1rem; font-size: 1.2rem; font-weight: 700; color: var(--accent-primary);">
            ⏱️ ${s.duration_minutes} min
          </div>

          ${s.notes ? `<p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.5rem;">${escapeHtml(s.notes)}</p>` : ''}

          <div style="margin-top: 1rem; text-align: right; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
            <button class="btn btn-danger btn-sm btn-delete-sport" data-id="${s.id}">🗑️ Eliminar</button>
          </div>
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('.btn-delete-sport').forEach(btn => {
      btn.addEventListener('click', (e) => deleteSport(e.currentTarget.dataset.id));
    });
  }

  // Modal
  const modal = container.querySelector('#sport-modal');
  container.querySelector('#btn-open-sport-modal').addEventListener('click', () => modal.classList.add('active'));
  container.querySelector('#btn-close-sport-modal').addEventListener('click', () => modal.classList.remove('active'));
  container.querySelector('#btn-cancel-sport').addEventListener('click', () => modal.classList.remove('active'));

  container.querySelector('#sport-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      sport: container.querySelector('#sport-name').value.trim(),
      duration_minutes: parseInt(container.querySelector('#sport-duration').value),
      intensity: container.querySelector('#sport-intensity').value,
      date: container.querySelector('#sport-date').value,
      notes: container.querySelector('#sport-notes').value.trim(),
      user_id: user?.id
    };

    if (supabaseClient && user) {
      await supabaseClient.from('sports_sessions').insert([data]);
    } else {
      localDb.insert('sports_sessions', data);
    }

    showToast('Sesión deportiva registrada', 'success');
    modal.classList.remove('active');
    renderSports(container);
  });

  function deleteSport(id) {
    confirmAction('Eliminar Sesión', '¿Eliminar este registro deportivo?', async () => {
      if (supabaseClient && user) {
        await supabaseClient.from('sports_sessions').delete().eq('id', id);
      } else {
        localDb.delete('sports_sessions', id);
      }
      showToast('Sesión eliminada', 'info');
      renderSports(container);
    });
  }

  renderSportsList();
}

function escapeHtml(str) {
  return str ? str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]) : '';
}
