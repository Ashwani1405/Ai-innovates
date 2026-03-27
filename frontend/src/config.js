// Central API configuration — auto-detects Vercel vs local
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
