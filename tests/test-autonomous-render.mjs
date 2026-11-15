import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {renderAutonomousAnswers} from '../scripts/render-autonomous-answers.mjs';

// This regression test uses a synthetic, clearly named temporary article and
// removes it after the assertions. It never publishes or commits test content.
const root=await mkdtemp(path.join(os.tmpdir(),'murdilimax-auto-'));
const source=path.resolve('editorial/autonomous');
const sampleFile=path.join(source,'automated-ci-fixture-00000000.json');
const contentText='This paragraph explains the topic with enough detail to demonstrate an informative article section. It uses no dangerous markup, provides coherent background and describes the main idea in useful accessible language. ';
const item={
 id:'automated-ci-fixture-00000000',published:'2026-11-15',
 method:'automated-unsupervised',
 origin:{wiki:'https://en.wikipedia.org/wiki/Aurora',topic:'Aurora',attribution:'Wikipedia contributors',
   license:'https://creativecommons.org/licenses/by-sa/4.0/'},
 en:{title:'A useful explanation of a natural phenomenon',
    description:'This test description contains useful background about a natural phenomenon and the source from which it can be researched.',
    intro:'The test introduction explains why this natural phenomenon interests readers and how the following sections will answer some basic questions.',
    sections:[{heading:'What readers observe first',body:contentText.repeat(2)},
      {heading:'How the visible process works',body:contentText.repeat(2)},
      {heading:'Important points to remember',body:contentText.repeat(2)}]},
 ru:{title:'Подробное объяснение природного явления',
    description:'Это подробное тестовое описание природного явления, которое читатель сможет изучить на основе открытого научного источника.',
    intro:'Это подробное введение объясняет, почему такое природное явление вызывает интерес, какие вопросы возникают и что можно узнать из дальнейшего текста.',
    sections:[{heading:'Что наблюдают люди на практике',body:'Это развернутое объяснение явления описывает последовательность наблюдений и помогает читателю понять простые факты без непроверенных технических утверждений. '.repeat(2)},
      {heading:'Как можно понять происходящее',body:'Это развернутое объяснение явления описывает последовательность наблюдений и помогает читателю понять простые факты без непроверенных технических утверждений. '.repeat(2)},
      {heading:'Какие сведения важно уточнять',body:'Это развернутое объяснение явления описывает последовательность наблюдений и помогает читателю понять простые факты без непроверенных технических утверждений. '.repeat(2)}]}
};
try {
 await mkdir(source,{recursive:true});
 await writeFile(sampleFile,JSON.stringify(item),'utf8');
 await mkdir(path.join(root,'ru'),{recursive:true});
 await writeFile(path.join(root,'index.html'),'<html><body><main>Test home</main></body></html>');
 await writeFile(path.join(root,'ru/index.html'),'<html><body><main>Тест</main></body></html>');
 await writeFile(path.join(root,'search-index.json'),'[]');
 await writeFile(path.join(root,'ru/search-index.json'),'[]');
 await writeFile(path.join(root,'sitemap.xml'),'<?xml version="1.0"?><urlset xmlns:xhtml="http://www.w3.org/1999/xhtml"></urlset>');
 assert.equal(await renderAutonomousAnswers(root),1);
 const en=await readFile(path.join(root,'answers/automated-ci-fixture-00000000/index.html'),'utf8');
 const ru=await readFile(path.join(root,'ru/answers/automated-ci-fixture-00000000/index.html'),'utf8');
 assert(en.includes('https://en.wikipedia.org/wiki/Aurora'));
 assert(ru.includes('lang="ru"'));
 assert((await readFile(path.join(root,'sitemap.xml'),'utf8')).includes('/ru/answers/automated-ci-fixture-00000000/'));
 assert((await readFile(path.join(root,'index.html'),'utf8')).includes('/answers/automated-ci-fixture-00000000/'));
 assert.equal(JSON.parse(await readFile(path.join(root,'search-index.json'),'utf8')).length,1);
 console.log('PASS: autonomous source-linked bilingual static pages, homepage, search, sitemap');
} finally {
 await rm(sampleFile,{force:true});
 await rm(root,{force:true,recursive:true});
}
