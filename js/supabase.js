// ==========================================
// LIFEOS - SUPABASE CLIENT & LOCAL STORAGE FALLBACK
// ==========================================
import { SUPABASE_URL, SUPABASE_ANON_KEY, IS_SUPABASE_CONFIGURED } from './config.js';

let supabaseClient = null;

if (IS_SUPABASE_CONFIGURED && window.supabase) {
  try {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("⚡ Supabase Client conectado exitosamente.");
  } catch (err) {
    console.warn("⚠️ No se pudo inicializar cliente Supabase, usando LocalStorage fallback:", err);
  }
} else {
  console.log("ℹ️ Supabase no configurado aún. Utilizando modo Demo LocalStorage.");
}

// LocalStorage Helper para cuando no hay credenciales de Supabase
class LocalDatabase {
  constructor() {
    this.prefix = "lifeos_local_";
  }

  get(table) {
    const data = localStorage.getItem(this.prefix + table);
    return data ? JSON.parse(data) : [];
  }

  set(table, items) {
    localStorage.setItem(this.prefix + table, JSON.stringify(items));
  }

  insert(table, item) {
    const items = this.get(table);
    const newItem = {
      id: item.id || crypto.randomUUID(),
      created_at: new Date().toISOString(),
      ...item
    };
    items.unshift(newItem);
    this.set(table, items);
    return newItem;
  }

  update(table, id, updates) {
    const items = this.get(table);
    const index = items.findIndex(i => i.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...updates };
      this.set(table, items);
      return items[index];
    }
    return null;
  }

  delete(table, id) {
    let items = this.get(table);
    items = items.filter(i => i.id !== id);
    this.set(table, items);
    return true;
  }
}

export const localDb = new LocalDatabase();

// Sembrado inicial de datos demo en LocalStorage si está vacío
export function seedLocalDemoData() {
  if (localDb.get('tasks').length === 0) {
    localDb.set('tasks', [
      {
        id: crypto.randomUUID(),
        title: "Estudiar SQL y Normalización",
        description: "Repasar llaves primarias, foráneas e índices",
        priority: "ALTA",
        category: "Estudios",
        due_date: new Date(Date.now() + 86400000).toISOString(),
        estimated_minutes: 50,
        status: "PENDIENTE",
        created_at: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        title: "Rutina de Fuerza - Pecho y Tríceps",
        description: "4 series de Press Plano, 3 series de Fondos",
        priority: "MEDIA",
        category: "Gym",
        due_date: new Date().toISOString(),
        estimated_minutes: 60,
        status: "PENDIENTE",
        created_at: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        title: "Meditar 10 minutos por la mañana",
        description: "Hábito diario de atención plena",
        priority: "BAJA",
        category: "Hábitos",
        due_date: new Date().toISOString(),
        estimated_minutes: 10,
        status: "COMPLETADO",
        created_at: new Date().toISOString()
      }
    ]);

    localDb.set('goals', [
      {
        id: crypto.randomUUID(),
        title: "Dominar PostgreSQL y Arquitectura de BD",
        description: "Aprender RLS, triggers y optimizaciones",
        category: "Estudios",
        level: "GRANDE",
        progress: 40,
        status: "EN_PROGRESO",
        created_at: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        title: "Aumentar masa muscular 2kg",
        description: "Consistencia en gym 4 veces por semana",
        category: "Gym",
        level: "MENSUAL",
        progress: 60,
        status: "EN_PROGRESO",
        created_at: new Date().toISOString()
      }
    ]);

    localDb.set('habits', [
      { id: crypto.randomUUID(), name: "Leer 20 páginas", frequency: "DIARIO", active: true },
      { id: crypto.randomUUID(), name: "Beber 2.5L de Agua", frequency: "DIARIO", active: true },
      { id: crypto.randomUUID(), name: "Entrenamiento Gym", frequency: "DIARIO", active: true }
    ]);

    localDb.set('projects', [
      { id: crypto.randomUUID(), name: "LIFEOS App Web", description: "Sistema Operativo Personal", status: "DESARROLLO", priority: "ALTA", progress: 50 }
    ]);
  }
}

export { supabaseClient };
