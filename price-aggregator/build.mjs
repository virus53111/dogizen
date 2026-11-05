import { mkdirSync, rmSync, copyFileSync, writeFileSync } from 'node:fs';
rmSync('dist', {recursive:true,force:true});
mkdirSync('dist/downloads', {recursive:true});
copyFileSync('public/recovery.html','dist/index.html');
copyFileSync('public/MURDILIMAX_Recovery_Pro_0.3.zip','dist/downloads/MURDILIMAX_Recovery_Pro_0.3.zip');
copyFileSync('desktop/README-v03-RU-EN.md','dist/downloads/README-v03-RU-EN.md');
writeFileSync('dist/robots.txt','User-agent: *\nAllow: /\nSitemap: https://cenaradar.online/sitemap.xml\n');
writeFileSync('dist/sitemap.xml','<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://cenaradar.online/</loc></url></urlset>');
console.log('MURDILIMAX Recovery v0.3 Crystal Motion site built');
