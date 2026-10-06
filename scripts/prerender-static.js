import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');

if (!fs.existsSync(distDir)) {
  console.error('[prerender-static] dist directory does not exist!');
  process.exit(1);
}

const baseHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');

const routes = [
  {
    path: 'founder',
    title: 'Shaurya Pratap Singh (Jakadwangdu) — Founder of LanceBuddy',
    description: 'Shaurya Pratap Singh, publicly known as Jakadwangdu, is the founder of LanceBuddy — the free local business lead finder and client acquisition platform.',
    canonical: 'https://www.lancebuddy.in/founder',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Person',
      '@id': 'https://www.lancebuddy.in/founder#person',
      'name': 'Shaurya Pratap Singh',
      'alternateName': 'Jakadwangdu',
      'jobTitle': 'Founder',
      'worksFor': {
        '@type': 'Organization',
        '@id': 'https://www.lancebuddy.in/#organization',
        'name': 'LanceBuddy',
        'url': 'https://www.lancebuddy.in/'
      },
      'url': 'https://www.lancebuddy.in/founder',
      'sameAs': [
        'https://jakadwangdu.github.io/Portfolio',
        'https://github.com/jakadwangdu',
        'https://linkedin.com/in/jakadwangdu',
        'https://www.instagram.com/shaurya__5656'
      ]
    }
  },
  {
    path: 'about',
    title: 'About LanceBuddy — Freelance Client Discovery Engine',
    description: 'Learn about LanceBuddy, founded by Shaurya Pratap Singh (Jakadwangdu) to empower independent professionals with free local business lead discovery.',
    canonical: 'https://www.lancebuddy.in/about'
  },
  {
    path: 'blog',
    title: 'Freelance Growth Blog — Lead Generation & Client Acquisition Guides | LanceBuddy',
    description: 'Actionable guides, proven cold email templates, and lead generation workflows to help freelancers and digital agencies land high-paying clients.',
    canonical: 'https://www.lancebuddy.in/blog'
  },
  {
    path: 'contact',
    title: 'Contact LanceBuddy — Support, Feedback & Partnerships',
    description: 'Have questions about scouting local business leads or upgrading to LanceBuddy Pro? Reach out directly to the LanceBuddy team.',
    canonical: 'https://www.lancebuddy.in/contact'
  },
  {
    path: 'help',
    title: 'Help Center & FAQs — LanceBuddy Freelancer Knowledge Base',
    description: 'Got questions about prospecting local clients, extracting leads, cold email templates, or pricing? Explore LanceBuddy knowledge base and FAQs.',
    canonical: 'https://www.lancebuddy.in/help'
  }
];

routes.forEach((route) => {
  let html = baseHtml;

  // Replace Title
  html = html.replace(/<title>.*?<\/title>/, `<title>${route.title}</title>`);

  // Replace Meta Description
  html = html.replace(
    /<meta name="description" content=".*?" \/>/,
    `<meta name="description" content="${route.description}" />`
  );

  // Replace Canonical Link
  html = html.replace(
    /<link rel="canonical" href=".*?" \/>/,
    `<link rel="canonical" href="${route.canonical}" />`
  );

  // Replace OpenGraph Title & Description & URL
  html = html.replace(
    /<meta property="og:title" content=".*?" \/>/,
    `<meta property="og:title" content="${route.title}" />`
  );
  html = html.replace(
    /<meta property="og:description" content=".*?" \/>/,
    `<meta property="og:description" content="${route.description}" />`
  );
  html = html.replace(
    /<meta property="og:url" content=".*?" \/>/,
    `<meta property="og:url" content="${route.canonical}" />`
  );

  // Replace Twitter Title & Description
  html = html.replace(
    /<meta name="twitter:title" content=".*?" \/>/,
    `<meta name="twitter:title" content="${route.title}" />`
  );
  html = html.replace(
    /<meta name="twitter:description" content=".*?" \/>/,
    `<meta name="twitter:description" content="${route.description}" />`
  );

  // Replace Schema if specified
  if (route.schema) {
    const schemaJson = JSON.stringify(route.schema, null, 2);
    html = html.replace(
      /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
      `<script type="application/ld+json">\n${schemaJson}\n    </script>`
    );
  }

  const targetDir = path.join(distDir, route.path);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  fs.writeFileSync(path.join(targetDir, 'index.html'), html, 'utf-8');
  console.log(`[prerender-static] Generated static shell for /${route.path}`);
});

// Ensure 404.html fallback exists for SPA routing
fs.copyFileSync(path.join(distDir, 'index.html'), path.join(distDir, '404.html'));
console.log('[prerender-static] Synced dist/404.html fallback');
