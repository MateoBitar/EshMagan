// src/stubs/image-picker.js — stub for web build
// Web uses native file input instead, so this is never actually called
module.exports = {
  launchCamera: () => Promise.resolve({ didCancel: true }),
  launchImageLibrary: () => Promise.resolve({ didCancel: true }),
};
