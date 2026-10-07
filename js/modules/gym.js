// ==========================================
// LIFEOS - GYM MODULE (WORKOUTS & EXERCISES LOG)
// ==========================================
import { supabaseClient, localDb } from '../supabase.js';
import { getCurrentUser } from './auth.js';
import { showToast, confirmAction } from '../components/notifications.js';

export async function renderGym(container) {
  const user = getCurrentUser();
  let workouts = [];
  let exercises = [];

  if (supabaseClient && user) {
    const { data: wData } = await supabaseClient.from('workouts').select('*').eq('user_id', user.id).order('date', { ascending: false });
    const { data: eData } = await supabaseClient.from('workout_exercises').select('*');
    workouts = wData || [];
    exercises = eData || [];
  } else {
    workouts = localDb.get('workouts');
    exercises = localDb.get('workout_exercises');
  }

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h1>🏋️ Registro de Gimnasio</h1>
        <p>Planifica tus sesiones de fuerza, registra pesos y evalúa tus récords personales.</p>
      </div>
      <button id="btn-open-workout-modal" class="btn btn-primary">+ Nuevo Entrenamiento</button>
    </div>

    <!-- Historial de Entrenamientos -->
    <div class="grid-2" id="workouts-list-container">
      <!-- Entrenamientos dinámicos -->
    </div>

    <!-- Modal Nuevo Entrenamiento -->
    <div id="workout-modal" class="modal-overlay">
      <div class="modal-content" style="max-width: 600px;">
        <div class="modal-header">
          <h3>Nuevo Entrenamiento</h3>
          <button class="btn-close-modal" id="btn-close-workout-modal">&times;</button>
        </div>
        <form id="workout-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Nombre del Entrenamiento *</label>
              <input type="text" id="workout-name" class="form-control" placeholder="Ej: Pecho y Tríceps, Pierna Hipertrofia..." required />
            </div>
            <div class="form-group">
              <label class="form-label">Fecha</label>
              <input type="date" id="workout-date" class="form-control" value="${new Date().toISOString().split('T')[0]}" required />
            </div>
          </div>

          <div style="margin-top: 1rem;">
            <label class="form-label">Ejercicios de la Sesión</label>
            <div id="exercises-inputs-container">
              <div class="form-row exercise-row" style="margin-bottom: 0.5rem;">
                <input type="text" class="form-control ex-name" placeholder="Ejercicio (Ej: Press de Banca)" required />
                <input type="number" class="form-control ex-sets" placeholder="Series" value="4" style="width: 75px;" required />
                <input type="number" class="form-control ex-reps" placeholder="Reps" value="10" style="width: 75px;" required />
                <input type="number" class="form-control ex-weight" placeholder="Kg" value="60" step="0.5" style="width: 85px;" required />
              </div>
            </div>
            <button type="button" id="btn-add-exercise-row" class="btn btn-secondary btn-sm" style="margin-top: 0.5rem;">+ Agregar Otro Ejercicio</button>
          </div>

          <div style="display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.5rem;">
            <button type="button" class="btn btn-secondary" id="btn-cancel-workout">Cancelar</button>
            <button type="submit" class="btn btn-primary">Guardar Entrenamiento</button>
          </div>
        </form>
      </div>
    </div>
  `;

  function renderWorkoutsList() {
    const listEl = container.querySelector('#workouts-list-container');
    if (workouts.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">🏋️</div>
          <h3>Sin Entrenamientos Registrados</h3>
          <p>Registra tu primera rutina de gym con tus series y kilajes.</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = workouts.map(w => {
      const wExs = exercises.filter(e => e.workout_id === w.id);

      return `
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h3 style="font-size: 1.15rem;">${escapeHtml(w.name)}</h3>
              <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">📅 ${w.date}</div>
            </div>
            <button class="btn btn-danger btn-sm btn-delete-workout" data-id="${w.id}">🗑️</button>
          </div>

          <div style="margin-top: 1rem; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
            <table style="width: 100%; font-size: 0.85rem; border-collapse: collapse;">
              <thead>
                <tr style="color: var(--text-dim); text-align: left; border-bottom: 1px solid var(--border-color);">
                  <th style="padding-bottom: 0.4rem;">Ejercicio</th>
                  <th style="padding-bottom: 0.4rem; text-align: center;">Series</th>
                  <th style="padding-bottom: 0.4rem; text-align: center;">Reps</th>
                  <th style="padding-bottom: 0.4rem; text-align: right;">Peso</th>
                </tr>
              </thead>
              <tbody>
                ${wExs.map(e => `
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                    <td style="padding: 0.4rem 0; font-weight: 600;">${escapeHtml(e.exercise)}</td>
                    <td style="text-align: center;">${e.sets}</td>
                    <td style="text-align: center;">${e.reps}</td>
                    <td style="text-align: right; color: var(--accent-warning); font-weight: 700;">${e.weight || 0} kg</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('.btn-delete-workout').forEach(btn => {
      btn.addEventListener('click', (e) => deleteWorkout(e.currentTarget.dataset.id));
    });
  }

  // Row Generator
  const exContainer = container.querySelector('#exercises-inputs-container');
  container.querySelector('#btn-add-exercise-row').addEventListener('click', () => {
    const row = document.createElement('div');
    row.className = 'form-row exercise-row';
    row.style.marginBottom = '0.5rem';
    row.innerHTML = `
      <input type="text" class="form-control ex-name" placeholder="Ejercicio" required />
      <input type="number" class="form-control ex-sets" placeholder="Series" value="4" style="width: 75px;" required />
      <input type="number" class="form-control ex-reps" placeholder="Reps" value="10" style="width: 75px;" required />
      <input type="number" class="form-control ex-weight" placeholder="Kg" value="60" step="0.5" style="width: 85px;" required />
    `;
    exContainer.appendChild(row);
  });

  // Modal
  const modal = container.querySelector('#workout-modal');
  container.querySelector('#btn-open-workout-modal').addEventListener('click', () => modal.classList.add('active'));
  container.querySelector('#btn-close-workout-modal').addEventListener('click', () => modal.classList.remove('active'));
  container.querySelector('#btn-cancel-workout').addEventListener('click', () => modal.classList.remove('active'));

  container.querySelector('#workout-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const wName = container.querySelector('#workout-name').value.trim();
    const wDate = container.querySelector('#workout-date').value;

    const rows = container.querySelectorAll('.exercise-row');
    const exsData = Array.from(rows).map(r => ({
      exercise: r.querySelector('.ex-name').value.trim(),
      sets: parseInt(r.querySelector('.ex-sets').value) || 1,
      reps: parseInt(r.querySelector('.ex-reps').value) || 1,
      weight: parseFloat(r.querySelector('.ex-weight').value) || 0
    }));

    if (supabaseClient && user) {
      const { data: wRes, error } = await supabaseClient.from('workouts').insert([{ name: wName, date: wDate, user_id: user.id }]).select();
      if (!error && wRes[0]) {
        const wId = wRes[0].id;
        const mappedExs = exsData.map(e => ({ ...e, workout_id: wId }));
        await supabaseClient.from('workout_exercises').insert(mappedExs);
      }
    } else {
      const wObj = localDb.insert('workouts', { name: wName, date: wDate, user_id: user?.id });
      exsData.forEach(e => localDb.insert('workout_exercises', { ...e, workout_id: wObj.id }));
    }

    showToast('Entrenamiento guardado', 'success');
    modal.classList.remove('active');
    renderGym(container);
  });

  function deleteWorkout(id) {
    confirmAction('Eliminar Entrenamiento', '¿Estás seguro de eliminar esta sesión y sus ejercicios?', async () => {
      if (supabaseClient && user) {
        await supabaseClient.from('workouts').delete().eq('id', id);
      } else {
        localDb.delete('workouts', id);
      }
      showToast('Entrenamiento eliminado', 'info');
      renderGym(container);
    });
  }

  renderWorkoutsList();
}

function escapeHtml(str) {
  return str ? str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]) : '';
}
