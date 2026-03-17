// src/stubs/async-storage.js — stub for web build
// Web uses localStorage directly in api.js and AuthContext.js
module.exports = {
  default: {
    getItem: (key) => Promise.resolve(localStorage.getItem(key)),
    setItem: (key, value) => { localStorage.setItem(key, value); return Promise.resolve(); },
    removeItem: (key) => { localStorage.removeItem(key); return Promise.resolve(); },
    multiRemove: (keys) => { keys.forEach(k => localStorage.removeItem(k)); return Promise.resolve(); },
  },
};
