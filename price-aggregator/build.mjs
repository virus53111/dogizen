import { mkdirSync, rmSync, copyFileSync, writeFileSync } from 'node:fs';

// LeadRadar runs on the already configured Render static site.
// No additional subscription, customer tracking script, or paid authentication.
rmSync('dist', { recursive: true, force: true });
mkdirSync('dist', { recursive: true });
copyFileSync('public/leads.html', 'dist/index.html');
copyFileSync('public/leads.css', 'dist/leads.css');
copyFileSync('public/leads.js', 'dist/leads.js');
writeFileSync('dist/robots.txt', 'User-agent: *\nAllow: /\nSitemap: https://cenaradar.online/sitemap.xml\n');
writeFileSync('dist/sitemap.xml',
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
  '<url><loc>https://cenaradar.online/</loc></url></urlset>');
console.log('LeadRadar: free zero-install B2B prospecting tool is ready');
