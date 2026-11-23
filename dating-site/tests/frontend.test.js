import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const pages = [
  ['ru', 'public/index.html'],
  ['en', 'public/en/index.html'],
  ['de', 'public/de/index.html'],
  ['lv', 'public/lv/index.html']
];

for (const [lang, filename] of pages) {
  test(lang + ' page restores the Firebase session before gated actions', async () => {
    const src = await fs.readFile(filename, 'utf8');
    assert.match(src, /window\.MM_authReady=new Promise/);
    assert.match(src, /src="\/auth\/refresh\.js"/);
    assert.ok(src.indexOf('MM_authReady') < src.indexOf('src="/app.js"'));
    assert.ok(src.includes('lang="' + lang + '"'));
  });
}
test('member chat client does not require premium subscription', async () => {
  const src = await fs.readFile('public/social-v4.js', 'utf8');
  assert.match(src, /window\.mmStartChat/);
  assert.doesNotMatch(src, /state\.user\.canMessage/);
  assert.doesNotMatch(src, /paidDm/);
  assert.match(src, /fetch\("\/api\/chat\/start"/);
  assert.match(src, /fetch\("\/api\/chat\/messages"/);
});

test('public login uses the same existing Firebase project', async () => {
  const config = JSON.parse(await fs.readFile('render/firebase.public.json', 'utf8'));
  assert.equal(config.projectId, 'murdilimax');
  assert.equal(config.authDomain, 'murdilimax.firebaseapp.com');
  const js = await fs.readFile('public/auth/login.js', 'utf8');
  assert.match(js, /signInWithEmailAndPassword/);
  assert.match(js, /createUserWithEmailAndPassword/);
  assert.match(js, /signInWithPopup/);
  assert.match(js, /sendEmailVerification/);
  assert.match(js, /sendPasswordResetEmail/);
});

test('public profile list does not expose account identifiers', async () => {
  const src = await fs.readFile('api/listings.js', 'utf8');
  assert.doesNotMatch(src, /SELECT\s+[^"']*owner_id/i);
  assert.match(src, /status = 'approved'/);
});
