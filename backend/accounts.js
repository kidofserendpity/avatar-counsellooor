const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const ACCOUNTS_PATH = path.join(__dirname, 'data', 'accounts.json');

function loadAccounts() {
  try {
    const raw = fs.readFileSync(ACCOUNTS_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.accounts) ? parsed.accounts : [];
  } catch {
    return [];
  }
}

function saveAccounts(accounts) {
  fs.mkdirSync(path.dirname(ACCOUNTS_PATH), { recursive: true });
  fs.writeFileSync(ACCOUNTS_PATH, JSON.stringify({ accounts }, null, 2));
}

async function createAccount(username, password) {
  const cleanUsername = (username || '').trim().toLowerCase();
  if (cleanUsername.length < 3) {
    throw new Error('Username needs to be at least 3 characters.');
  }
  if (!password || password.length < 6) {
    throw new Error('Password needs to be at least 6 characters.');
  }

  const accounts = loadAccounts();
  if (accounts.some((a) => a.username === cleanUsername)) {
    throw new Error('That username is already taken.');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const accountId = crypto.randomUUID();
  accounts.push({ username: cleanUsername, passwordHash, accountId, createdAt: Date.now() });
  saveAccounts(accounts);

  return { accountId, username: cleanUsername };
}

async function verifyLogin(username, password) {
  const cleanUsername = (username || '').trim().toLowerCase();
  const accounts = loadAccounts();
  const account = accounts.find((a) => a.username === cleanUsername);
  if (!account) {
    throw new Error('No account with that username.');
  }
  const valid = await bcrypt.compare(password || '', account.passwordHash);
  if (!valid) {
    throw new Error('Incorrect password.');
  }
  return { accountId: account.accountId, username: account.username };
}

function getUsernameByAccountId(accountId) {
  const accounts = loadAccounts();
  const account = accounts.find((a) => a.accountId === accountId);
  return account ? account.username : null;
}

module.exports = { createAccount, verifyLogin, getUsernameByAccountId };