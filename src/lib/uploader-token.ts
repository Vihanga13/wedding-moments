/**
 * Generates or retrieves a persistent anonymous guest uploader token for this device/browser.
 * This ensures guests can view their own upload history without needing to create an account.
 */
export function getOrCreateUploaderToken(): string {
  if (typeof window === 'undefined') return '';
  const STORAGE_KEY = 'wm_guest_uploader_token';
  let token = localStorage.getItem(STORAGE_KEY);
  if (!token) {
    const randomHex = Math.random().toString(36).substring(2, 10);
    token = `gst_${Date.now().toString(36)}_${randomHex}`;
    localStorage.setItem(STORAGE_KEY, token);
  }
  return token;
}

