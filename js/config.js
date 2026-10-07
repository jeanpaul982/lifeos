// ==========================================
// LIFEOS - CONFIGURATION & CONSTANTS
// ==========================================

export const SUPABASE_URL = "https://gtqrrqycruglpuojqavx.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0cXJycXljcnVnbHB1b2pxYXZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzODk3ODksImV4cCI6MjEwNjk2NTc4OX0.6iLmEz9v9J6Iki6w6gAX0DaQtt7rOhqOhU-l32B9BGM";

// Detectar si las credenciales predeterminadas han sido reemplazadas
export const IS_SUPABASE_CONFIGURED = 
  SUPABASE_URL !== "https://YOUR_SUPABASE_PROJECT_ID.supabase.co" && 
  SUPABASE_ANON_KEY !== "YOUR_SUPABASE_ANON_KEY" &&
  SUPABASE_URL.trim() !== "" &&
  SUPABASE_ANON_KEY.trim() !== "";

export const CATEGORIES = [
  'Estudios',
  'Gym',
  'Deporte',
  'Hábitos',
  'Proyectos',
  'Startup',
  'Personal'
];

export const PRIORITIES = [
  { id: 'BAJA', label: 'Baja', class: 'badge-low' },
  { id: 'MEDIA', label: 'Media', class: 'badge-medium' },
  { id: 'ALTA', label: 'Alta', class: 'badge-high' },
  { id: 'URGENTE', label: 'Urgente', class: 'badge-urgent' }
];

export const GOAL_LEVELS = ['GRANDE', 'MENSUAL', 'SEMANAL'];

export const STARTUP_STAGES = [
  'IDEA',
  'VALIDACIÓN',
  'MVP',
  'PRIMER USUARIO',
  'PRIMER CLIENTE',
  'INGRESOS'
];
