// ==========================================
// LIFEOS - HABITS MODULE (STREAKS & LOGS TRACKER)
// ==========================================
import { supabaseClient, localDb } from '../supabase.js';
import { getCurrentUser } from './auth.js';
import { showToast, confirmAction } from '../components/notifications.js';

export async function renderHabits(container) {
  const user = getCurrentUser();
  let habits = [];
  let habitLogs = [];

  if (supabaseClient && user) {
    const { data: hData } = await supabaseClient.from('habits').select('*').eq('user_id', user.id);
    const { data: lData } = await supabaseClient.from('habit_logs').select('*').eq('user_id', user.id);
    habits = hData || [];
    habitLogs = lData || [];
  } else {
    habits = localDb.get('habits');
    habitLogs = localDb.get('habit_logs');
  }

  const todayStr = new Date().toISOString().split('T')[0];

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h1>🧠 Registro de Hábitos</h1>
        <p>Construye disciplina diaria y monitorea tus rachas de consistencia.</p>
      </div>
      <button id="btn-open-habit-modal" class="btn btn-primary">+ Nuevo Hábito</button>
    </div>

    <!-- Lista de Hábitos -->
    <div class="grid-2" id="habits-list-container">
      <!-- Se genera dinámicamente -->
    </div>

    <!-- Modal Nuevo Hábito -->
    <div id="habit-modal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Nuevo Hábito</h3>
          <button class="btn-close-modal" id="btn-close-habit-modal">&times;</button>
        </div>
        <form id="habit-form">
          <div class="form-group">
            <label class="form-label">Nombre del Hábito *</label>
            <input type="text" id="habit-name" class="form-control" placeholder="Ej: Meditar, Leer 20 páginas, Caminar 10k pasos..." required />
          </div>

          <div class="form-group">
            <label class="form-label">Frecuencia</label>
            <select id="habit-frequency" class="form-control">
              <option value="DIARIO">Diario</option>
              <option value="SEMANAL">Semanal</option>
              <option value="DIAS_LABORABLES">Días Laborables</option>
            </select>
          </div>

          <div style="display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.5rem;">
            <button type="button" class="btn btn-secondary" id="btn-cancel-habit">Cancelar</button>
            <button type="submit" class="btn btn-primary">Crear Hábito</button>
          </div>
        </form>
      </div>
    </div>
  `;

  function renderHabitsList() {
    const listEl = container.querySelector('#habits-list-container');
    if (habits.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">🧠</div>
          <h3>Sin Hábitos Registrados</h3>
          <p>Crea tu primer hábito para comenzar a hacer seguimiento diario.</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = habits.map(h => {
      const isCompletedToday = habitLogs.some(l => l.habit_id === h.id && l.date === todayStr && l.completed);
      
      // Métricas de Racha, Semanal y Mensual
      const streak = calculateStreak(h.id, habitLogs);
      const weeklyCompliance = calculateWeeklyCompliance(h.id, habitLogs);
      const monthlyCompliance = calculateMonthlyCompliance(h.id, habitLogs);

      return `
        <div class="card" style="position: relative;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h3 style="font-size: 1.1rem; margin-bottom: 0.2rem;">${escapeHtml(h.name)}</h3>
              <span class="badge badge-medium">${h.frequency}</span>
            </div>

            <button class="btn ${isCompletedToday ? 'btn-primary' : 'btn-secondary'} btn-toggle-habit" data-id="${h.id}" data-completed="${isCompletedToday}">
              ${isCompletedToday ? '✅ Completado Hoy' : '⏳ Marcar Hoy'}
            </button>
          </div>

          <div class="grid-3" style="margin-top: 1.25rem; background: var(--bg-secondary); padding: 0.85rem; border-radius: var(--radius-md); text-align: center;">
            <div>
              <div style="font-size: 1.2rem; font-weight: 700; color: var(--accent-warning);">🔥 ${streak}</div>
              <div style="font-size: 0.75rem; color: var(--text-dim);">Racha Actual</div>
            </div>
            <div>
              <div style="font-size: 1.2rem; font-weight: 700; color: var(--accent-primary);">${weeklyCompliance}%</div>
              <div style="font-size: 0.75rem; color: var(--text-dim);">Semanal</div>
            </div>
            <div>
              <div style="font-size: 1.2rem; font-weight: 700; color: var(--accent-success);">${monthlyCompliance}%</div>
              <div style="font-size: 0.75rem; color: var(--text-dim);">Mensual</div>
            </div>
          </div>

          <div style="margin-top: 0.75rem; text-align: right;">
            <button class="btn btn-danger btn-sm btn-delete-habit" data-id="${h.id}">🗑️ Eliminar</button>
          </div>
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('.btn-toggle-habit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const currentCompleted = e.currentTarget.dataset.completed === 'true';
        toggleHabitToday(id, !currentCompleted);
      });
    });

    listEl.querySelectorAll('.btn-delete-habit').forEach(btn => {
      btn.addEventListener('click', (e) => deleteHabit(e.currentTarget.dataset.id));
    });
  }

  // Toggle habit log
  async function toggleHabitToday(habitId, completed) {
    if (supabaseClient && user) {
      if (completed) {
        await supabaseClient.from('habit_logs').upsert([{ habit_id: habitId, user_id: user.id, date: todayStr, completed: true }]);
      } else {
        await supabaseClient.from('habit_logs').delete().eq('habit_id', habitId).eq('date', todayStr);
      }
    } else {
      let logs = localDb.get('habit_logs');
      if (completed) {
        logs.unshift({ id: crypto.randomUUID(), habit_id: habitId, user_id: user?.id, date: todayStr, completed: true });
      } else {
        logs = logs.filter(l => !(l.habit_id === habitId && l.date === todayStr));
      }
      localDb.set('habit_logs', logs);
    }
    showToast(completed ? '¡Hábito marcado para hoy! 🔥' : 'Hábito desmarcado', 'info');
    renderHabits(container);
  }

  // Modal handlers
  const modal = container.querySelector('#habit-modal');
  const openBtn = container.querySelector('#btn-open-habit-modal');
  const closeBtn = container.querySelector('#btn-close-habit-modal');
  const cancelBtn = container.querySelector('#btn-cancel-habit');
  const form = container.querySelector('#habit-form');

  openBtn.addEventListener('click', () => modal.classList.add('active'));
  closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  cancelBtn.addEventListener('click', () => modal.classList.remove('active'));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const habitData = {
      name: container.querySelector('#habit-name').value.trim(),
      frequency: container.querySelector('#habit-frequency').value,
      active: true,
      user_id: user?.id
    };

    if (supabaseClient && user) {
      await supabaseClient.from('habits').insert([habitData]);
    } else {
      localDb.insert('habits', habitData);
    }
    showToast('Hábito creado', 'success');
    modal.classList.remove('active');
    form.reset();
    renderHabits(container);
  });

  function deleteHabit(id) {
    confirmAction('Eliminar Hábito', '¿Estás seguro de eliminar este hábito y todo su historial?', async () => {
      if (supabaseClient && user) {
        await supabaseClient.from('habits').delete().eq('id', id);
      } else {
        localDb.delete('habits', id);
      }
      showToast('Hábito eliminado', 'info');
      renderHabits(container);
    });
  }

  renderHabitsList();
}

// Métricas de Racha y Cumplimiento
function calculateStreak(habitId, logs) {
  const hLogs = new Set(logs.filter(l => l.habit_id === habitId && l.completed).map(l => l.date));
  let streak = 0;
  let curr = new Date();

  while (true) {
    const dStr = curr.toISOString().split('T')[0];
    if (hLogs.has(dStr)) {
      streak++;
      curr.setDate(curr.getDate() - 1);
    } else {
      // Permitir check de hoy sin romper la racha de ayer
      if (streak === 0 && dStr === new Date().toISOString().split('T')[0]) {
        curr.setDate(curr.getDate() - 1);
        continue;
      }
      break;
    }
  }
  return streak;
}

function calculateWeeklyCompliance(habitId, logs) {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  });
  const completedCount = logs.filter(l => l.habit_id === habitId && l.completed && last7Days.includes(l.date)).length;
  return Math.round((completedCount / 7) * 100);
}

function calculateMonthlyCompliance(habitId, logs) {
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  });
  const completedCount = logs.filter(l => l.habit_id === habitId && l.completed && last30Days.includes(l.date)).length;
  return Math.round((completedCount / 30) * 100);
}

function escapeHtml(str) {
  return str ? str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]) : '';
}
