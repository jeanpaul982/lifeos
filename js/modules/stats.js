// ==========================================
// LIFEOS - STATISTICS MODULE (DYNAMIC CHART.JS ANALYTICS)
// ==========================================
import { supabaseClient, localDb } from '../supabase.js';
import { getCurrentUser } from './auth.js';

let chartInstance1 = null;
let chartInstance2 = null;

export async function renderStats(container) {
  const user = getCurrentUser();
  let studySessions = [];
  let sportsSessions = [];
  let workouts = [];
  let tasks = [];
  let habitLogs = [];

  if (supabaseClient && user) {
    const { data: st } = await supabaseClient.from('study_sessions').select('*').eq('user_id', user.id);
    const { data: sp } = await supabaseClient.from('sports_sessions').select('*').eq('user_id', user.id);
    const { data: wo } = await supabaseClient.from('workouts').select('*').eq('user_id', user.id);
    const { data: tk } = await supabaseClient.from('tasks').select('*').eq('user_id', user.id);
    const { data: hl } = await supabaseClient.from('habit_logs').select('*').eq('user_id', user.id);
    studySessions = st || [];
    sportsSessions = sp || [];
    workouts = wo || [];
    tasks = tk || [];
    habitLogs = hl || [];
  } else {
    studySessions = localDb.get('study_sessions');
    sportsSessions = localDb.get('sports_sessions');
    workouts = localDb.get('workouts');
    tasks = localDb.get('tasks');
    habitLogs = localDb.get('habit_logs');
  }

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h1>📊 Estadísticas y Analítica Personal</h1>
        <p>Visualiza tu rendimiento, tiempo invertido por áreas y consistencia de hábitos.</p>
      </div>

      <!-- Filtros de Tiempo -->
      <div style="display: flex; gap: 0.5rem;">
        <button class="btn btn-primary btn-filter-period active" data-period="TODOS">Todo</button>
        <button class="btn btn-secondary btn-filter-period" data-period="MES">Este Mes</button>
        <button class="btn btn-secondary btn-filter-period" data-period="SEMANA">Esta Semana</button>
        <button class="btn btn-secondary btn-filter-period" data-period="HOY">Hoy</button>
      </div>
    </div>

    <!-- KPIs Totales -->
    <div class="grid-4" style="margin-bottom: 2rem;">
      <div class="card" style="border-left: 4px solid var(--accent-primary);">
        <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700;">📚 HORAS DE ESTUDIO</div>
        <div id="kpi-study" style="font-size: 2rem; font-weight: 700; color: var(--text-main); margin-top: 0.3rem;">0h</div>
      </div>
      <div class="card" style="border-left: 4px solid var(--accent-warning);">
        <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700;">🏋️ ENTRENAMIENTOS</div>
        <div id="kpi-gym" style="font-size: 2rem; font-weight: 700; color: var(--text-main); margin-top: 0.3rem;">0</div>
      </div>
      <div class="card" style="border-left: 4px solid var(--accent-success);">
        <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700;">✅ TAREAS COMPLETADAS</div>
        <div id="kpi-tasks" style="font-size: 2rem; font-weight: 700; color: var(--text-main); margin-top: 0.3rem;">0</div>
      </div>
      <div class="card" style="border-left: 4px solid var(--accent-purple);">
        <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700;">🧠 HÁBITOS CUMPLIDOS</div>
        <div id="kpi-habits" style="font-size: 2rem; font-weight: 700; color: var(--text-main); margin-top: 0.3rem;">0</div>
      </div>
    </div>

    <!-- Gráficos de Analítica -->
    <div class="grid-2">
      <div class="card">
        <h3 style="font-size: 1.1rem; margin-bottom: 1rem;">⏱️ Distribución del Tiempo por Área (Horas)</h3>
        <div style="position: relative; height: 290px;">
          <canvas id="chart-hours-distribution"></canvas>
        </div>
      </div>

      <div class="card">
        <h3 style="font-size: 1.1rem; margin-bottom: 1rem;">🔥 Comparativa Tareas vs Hábitos</h3>
        <div style="position: relative; height: 290px;">
          <canvas id="chart-completion"></canvas>
        </div>
      </div>
    </div>
  `;

  function filterByDate(items, dateField, period) {
    if (period === 'TODOS') return items;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return items.filter(item => {
      if (!item[dateField]) return false;
      const itemDateStr = item[dateField].split('T')[0];
      const itemDate = new Date(itemDateStr);

      if (period === 'HOY') {
        return itemDateStr === todayStr;
      }
      if (period === 'SEMANA') {
        const diffDays = (now - itemDate) / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays <= 7;
      }
      if (period === 'MES') {
        const diffDays = (now - itemDate) / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays <= 30;
      }
      return true;
    });
  }

  function updateCharts(period = 'TODOS') {
    const fStudy = filterByDate(studySessions, 'date', period);
    const fSports = filterByDate(sportsSessions, 'date', period);
    const fWorkouts = filterByDate(workouts, 'date', period);
    const fTasks = filterByDate(tasks, 'created_at', period);
    const fHabits = filterByDate(habitLogs, 'date', period);

    const studyHours = (fStudy.reduce((a, b) => a + (b.duration_minutes || 0), 0) / 60).toFixed(1);
    const sportsHours = (fSports.reduce((a, b) => a + (b.duration_minutes || 0), 0) / 60).toFixed(1);
    const gymHours = (fWorkouts.length * 1.0).toFixed(1); // 1 hora prom gym
    const completedTasksCount = fTasks.filter(t => t.status === 'COMPLETADO').length;
    const completedHabitsCount = fHabits.filter(h => h.completed).length;

    container.querySelector('#kpi-study').textContent = `${studyHours}h`;
    container.querySelector('#kpi-gym').textContent = fWorkouts.length;
    container.querySelector('#kpi-tasks').textContent = completedTasksCount;
    container.querySelector('#kpi-habits').textContent = completedHabitsCount;

    if (window.Chart) {
      if (chartInstance1) chartInstance1.destroy();
      if (chartInstance2) chartInstance2.destroy();

      const ctx1 = container.querySelector('#chart-hours-distribution').getContext('2d');
      chartInstance1 = new window.Chart(ctx1, {
        type: 'doughnut',
        data: {
          labels: ['Estudios', 'Deporte', 'Gimnasio'],
          datasets: [{
            data: [parseFloat(studyHours), parseFloat(sportsHours), parseFloat(gymHours)],
            backgroundColor: ['#3b82f6', '#10b981', '#f59e0b']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: '#f3f4f6', font: { family: 'Plus Jakarta Sans' } } }
          }
        }
      });

      const ctx2 = container.querySelector('#chart-completion').getContext('2d');
      chartInstance2 = new window.Chart(ctx2, {
        type: 'bar',
        data: {
          labels: ['Tareas Completadas', 'Hábitos Registrados'],
          datasets: [{
            label: 'Total Realizado',
            data: [completedTasksCount, completedHabitsCount],
            backgroundColor: ['#10b981', '#8b5cf6'],
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            x: { ticks: { color: '#9ca3af' }, grid: { display: false } }
          },
          plugins: { legend: { display: false } }
        }
      });
    }
  }

  container.querySelectorAll('.btn-filter-period').forEach(btn => {
    btn.addEventListener('click', (e) => {
      container.querySelectorAll('.btn-filter-period').forEach(b => {
        b.classList.remove('active', 'btn-primary');
        b.classList.add('btn-secondary');
      });
      e.currentTarget.classList.add('active', 'btn-primary');
      e.currentTarget.classList.remove('btn-secondary');
      updateCharts(e.currentTarget.dataset.period);
    });
  });

  updateCharts('TODOS');
}
