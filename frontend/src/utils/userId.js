import axios from "axios";

const GUEST_ID_KEY = "aria-guest-id";
const ACCOUNT_ID_KEY = "aria-account-id";
const GUEST_CHOSEN_KEY = "aria-guest-chosen";
const USERNAME_KEY = "aria-username";

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

export function clearGuestChoice() {
  try {
    localStorage.removeItem(GUEST_CHOSEN_KEY);
  } catch {
    // ignore
  }
}

export function setUsername(username) {
  try {
    localStorage.setItem(USERNAME_KEY, username);
  } catch {
    // ignore
  }
}

export function getUsername() {
  try {
    return localStorage.getItem(USERNAME_KEY);
  } catch {
    return null;
  }
}

export function clearUsername() {
  try {
    localStorage.removeItem(USERNAME_KEY);
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

export function hasResolvedIdentity() {
  try {
    if (localStorage.getItem(ACCOUNT_ID_KEY)) return true;
    if (localStorage.getItem(GUEST_CHOSEN_KEY) === "true") return true;
    return false;
  } catch {
    return true;
  }
}

export function markGuestChosen() {
  try {
    localStorage.setItem(GUEST_CHOSEN_KEY, "true");
  } catch {
    // ignore
  }
}

export function refreshUserIdHeader() {
  axios.defaults.headers.common['X-User-Id'] = getActiveUserId();
}

export function getOrCreateUserId() {
  return getActiveUserId();
}