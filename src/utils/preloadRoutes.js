/**
 * Preload route bundles ahead of user clicks for 0ms instantaneous navigation.
 */
const loaders = {
  '/about': () => import('../pages/AboutPage'),
  '/founder': () => import('../pages/FounderPage'),
  '/blog': () => import('../pages/BlogPage'),
  '/contact': () => import('../pages/ContactPage'),
  '/help': () => import('../pages/HelpPage'),
  '/login': () => import('../pages/LoginPage'),
  '/signup': () => import('../pages/LoginPage'),
  '/privacy-policy': () => import('../pages/LegalPage'),
  '/terms-of-service': () => import('../pages/LegalPage'),
  '/security': () => import('../pages/LegalPage'),
  '/cookie-policy': () => import('../pages/LegalPage'),
  '/checkout': () => import('../pages/CheckoutPage'),
  '/status': () => import('../pages/StatusPage'),
  '/scout': () => import('../pages/ScoutPage'),
};

const preloaded = new Set();

export const preloadRoute = (path) => {
  if (!path) return;
  const base = path.split('?')[0].split('#')[0].toLowerCase();
  if (loaders[base] && !preloaded.has(base)) {
    preloaded.add(base);
    loaders[base]().catch(() => {
      preloaded.delete(base);
    });
  }
};

/**
 * Idle background prefetch for primary SaaS conversion pages
 */
export const preloadCommonRoutes = () => {
  const common = ['/scout', '/about', '/pricing', '/login', '/help', '/status', '/blog'];
  const run = () => {
    common.forEach((route, idx) => {
      setTimeout(() => preloadRoute(route), idx * 250);
    });
  };

  if (typeof window !== 'undefined') {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => run(), { timeout: 3000 });
    } else {
      setTimeout(run, 1200);
    }
  }
};
