
  # Taste Buddy app

  This is a code bundle for Taste Buddy app. The original project is available at https://www.figma.com/design/hyTfgIbrYgoXL2lTgUFE4N/Taste-Buddy-app.

  ## Documentation

  - Product experience source of truth: [src/guidelines/TASTE_BUDDY_PRODUCT_EXPERIENCE_GUIDELINES.md](./src/guidelines/TASTE_BUDDY_PRODUCT_EXPERIENCE_GUIDELINES.md)
  - Current visual design source of truth: [DESIGN.md](./DESIGN.md)
  - Supporting docs index: [docs/README.md](./docs/README.md)

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  The local app runs on port `3001`.
  On the same machine, you can use `http://127.0.0.1:3001` or `http://localhost:3001`.
  On a phone or another device on the same Wi-Fi, use your computer's local network IP such as `http://192.168.0.10:3001`.

  Direct design system routes:

  - App shell: `http://localhost:3001/`
  - Design system: `http://localhost:3001/design-system`
  - Design system update preview: `http://localhost:3001/design-system-updates`

  To open the app directly in Chrome, run `npm run dev:app`.
  If you want to jump straight into the design system, run `npm run dev:design-system`.
  That command reuses an existing server on `3001` when it is already running, and starts Vite for you when it is not.
  For the update preview, run `npm run dev:design-system-updates`.
  
