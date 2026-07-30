import axios from "axios";

const GUEST_ID_KEY = "aria-guest-id";
const ACCOUNT_ID_KEY = "aria-account-id";

function getOrCreateGuestId() {
  try {
    let id = localStorage.getItem(GUEST_ID_KEY);
    if (!id) {
      id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(GUEST_ID_KEY, id);
    }
    return id;
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

export function getActiveUserId() {
  try {
    const accountId = localStorage.getItem(ACCOUNT_ID_KEY);
    if (accountId) return accountId;
  } catch {
    // ignore
  }
  return getOrCreateGuestId();
}

export function setAccountId(accountId) {
  try {
    localStorage.setItem(ACCOUNT_ID_KEY, accountId);
  } catch {
    // ignore
  }
}

export function clearAccountId() {
  try {
    localStorage.removeItem(ACCOUNT_ID_KEY);
  } catch {
    // ignore
  }
}

export function isLoggedIn() {
  try {
    return !!localStorage.getItem(ACCOUNT_ID_KEY);
  } catch {
    return false;
  }
}

export function refreshUserIdHeader() {
  axios.defaults.headers.common['X-User-Id'] = getActiveUserId();
}

// Kept for backward compatibility — App.jsx and MoodChart.jsx already import this exact name.
export function getOrCreateUserId() {
  return getActiveUserId();
}