# LanceBuddy — React Single Page Application

This folder contains the complete, modern React 18 + Vite SPA edition of LanceBuddy.

## Project Structure
- `src/components/`: Reusable Neo-Brutalist React components (layout, scout, pipeline, notes, common).
- `src/pages/`: All page views (Home, About, Blog, BlogPost, Contact, Help, Login, Legal, 404).
- `src/context/`: State management (ThemeContext, AuthContext, LeadsContext).
- `src/data/`: Mock datasets (mockLeads, blogArticles, emailTemplates, faqData).
- `src/services/`: Firebase Auth configuration.
- `src/styles/`: Design tokens, theme variables, and component stylesheets.
- `public/`: Static assets (Logo.png, icons).

## Available Scripts

In this directory (`react-web`), you can run:

### `npm run dev`
Runs the app in development mode with Hot Module Replacement (HMR) at `http://localhost:3000`.

### `npm run build`
Builds the app for production to the `dist/` folder with minification and gzip optimization.

### `npm run preview`
Locally previews the production build.
