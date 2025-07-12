// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{html,ts}",  // importante para Angular
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  corePlugins: {
    preflight: false, // Esto evita que Tailwind normalice algunos estilos que pueden afectar a PrimeNG
  },
}
