import { projectId, publicAnonKey } from './supabase/info';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-f8517b5b`;

export async function clearAllTimesheets() {
  try {
    const response = await fetch(`${API_URL}/timesheets/clear/all`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${publicAnonKey}` },
    });

    if (!response.ok) {
      throw new Error('Failed to clear timesheets');
    }

    const data = await response.json();
    console.log('✅ All timesheets cleared:', data);
    return data;
  } catch (error) {
    console.error('❌ Error clearing timesheets:', error);
    throw error;
  }
}

// Make it available globally for console access
if (typeof window !== 'undefined') {
  (window as any).clearAllTimesheets = clearAllTimesheets;
}
