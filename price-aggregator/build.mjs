// Legacy CenaRadar static build. The old domain is intentionally retired.
// This build must never forward visitors or search engines to murdilimax.com;
// the modern MURDILIMAX encyclopedia lives on the separate main branch.
import {mkdirSync,rmSync,writeFileSync} from 'node:fs';
rmSync('dist',{recursive:true,force:true});
mkdirSync('dist',{recursive:true});
const unavailable=`<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>CenaRadar — сайт отключён</title>
<style>html{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#263238;background:#f7f9fb}body{max-width:600px;margin:16vh auto;padding:24px}h1{font-size:clamp(2rem,7vw,3rem)}p{font-size:1.1rem;line-height:1.7;color:#4f5962}</style>
</head>
<body><main><h1>CenaRadar больше не работает</h1><p>Этот старый проект отключён. Домен больше не перенаправляет посетителей на другой сайт.</p></main></body>
</html>`;
writeFileSync('dist/index.html',unavailable);
writeFileSync('dist/404.html',unavailable);
writeFileSync('dist/robots.txt','User-agent: *\nDisallow: /\n');
console.log('CenaRadar legacy site disabled; no automatic redirects and no sitemap.');
