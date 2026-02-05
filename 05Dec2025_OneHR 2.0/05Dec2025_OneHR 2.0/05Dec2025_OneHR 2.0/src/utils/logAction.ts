export function logAction(action: string, detail?: any) {
  const time = new Date().toISOString();
  try {
    if (detail !== undefined) {
      console.log(`[ACTION] ${time} - ${action}`, detail);
    } else {
      console.log(`[ACTION] ${time} - ${action}`);
    }
  } catch (err) {
    // swallow logging errors
  }
}

export default logAction;
