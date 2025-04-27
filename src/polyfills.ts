// Polyfills needed by Angular
import 'zone.js';  // Angular potrzebuje zone.js do zarządzania asynchronicznością

// Polyfille dla starszych przeglądarek
// Importowanie core-js może być konieczne w przypadku niektórych starszych przeglądarek, np. Internet Explorer 11
// Jeśli nie używasz IE11, to tego nie musisz dodawać
// import 'core-js/es6';   // dla starszych przeglądarek

// Możesz dodać również inne polyfille, w zależności od potrzeb:
import 'core-js/stable'; // Jest to bardziej zaawansowane podejście do wsparcia polyfill
