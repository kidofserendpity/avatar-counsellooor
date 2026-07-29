const USER_ID_KEY = "aria-user-id";

export function getOrCreateUserId() {
  try {
    let id = localStorage.getItem(USER_ID_KEY);
    if (!id) {
      id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(USER_ID_KEY, id);
    }
    return id;
  } catch {
    // localStorage unavailable (private browsing, etc.) — session-only fallback
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}