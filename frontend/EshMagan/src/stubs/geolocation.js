// src/stubs/geolocation.js — stub for web build
// Web uses navigator.geolocation directly in location.service.js
module.exports = {
  default: {
    getCurrentPosition: (success, error, options) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(success, error, options);
      } else {
        error({ message: 'Geolocation not supported' });
      }
    },
    watchPosition: (success, error, options) => {
      if (navigator.geolocation) {
        return navigator.geolocation.watchPosition(success, error, options);
      }
      return null;
    },
    clearWatch: (id) => {
      if (navigator.geolocation) navigator.geolocation.clearWatch(id);
    },
  },
};
