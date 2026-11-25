import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {sendVerificationWithFallback,verifiedToken,registerOrSignIn,sendResetWithFallback} from '../public/auth/email-flow.js';
test('verification email falls back to Firebase hosted action only for rejected continue URL',async()=>{const calls=[];const user={};await sendVerificationWithFallback(async(...args)=>{calls.push(args);if(args.length===2)throw {code:'auth/unauthorized-continue-uri'};},user,{url:'https://murdilimax.com/login'});assert.equal(calls.length,2);assert.deepEqual(calls[1],[user]);});
test('delivery and quota errors never trigger another send or claim success',async()=>{let n=0;await assert.rejects(sendVerificationWithFallback(async()=>{n++;throw new Error('quota');},{},{}),/quota/);assert.equal(n,1);});
test('explicit verification check only returns a refreshed verified token',async()=>{let tokens=0;const u={emailVerified:false,reload:async()=>{},getIdToken:async()=>{tokens++;return 'token'}};assert.equal(await verifiedToken(u),null);assert.equal(tokens,0);u.reload=async()=>{u.emailVerified=true};u.getIdToken=async(force)=>{assert.equal(force,true);return 'fresh'};assert.equal(await verifiedToken(u),'fresh');});
test('login page separates registration and provides resend and verification check',async()=>{const html=await fs.readFile('public/auth/login.html','utf8'),js=await fs.readFile('public/auth/login.js','utf8');for(const id of ['registerMode','loginMode','verifyPanel','resend','checkVerified'])assert.ok(html.includes('id="'+id+'"'));assert.match(js,/createUserWithEmailAndPassword/);assert.match(js,/verifiedToken\(user\)/);assert.match(js,/sendVerificationWithFallback\(sendEmailVerification,user,emailAction\)/);assert.match(js,/Date.now\(\)-lastSent<60000/);});

test('repeat registration authenticates the existing account using the supplied password',async()=>{const auth={},user={emailVerified:false};let calls=0;const result=await registerOrSignIn(async()=>{throw {code:'auth/email-already-in-use'}},async(a,e,p)=>{calls++;assert.equal(a,auth);assert.equal(e,'test@example.test');assert.equal(p,'original-password');return {user}},auth,'test@example.test','original-password');assert.equal(result.user,user);assert.equal(calls,1);});
test('repeat registration cannot bypass a wrong password or retry unrelated errors',async()=>{let n=0;await assert.rejects(registerOrSignIn(async()=>{throw {code:'auth/email-already-in-use'}},async()=>{throw new Error('wrong password')},{},'test@example.test','wrong'),/wrong password/);await assert.rejects(registerOrSignIn(async()=>{throw new Error('network')},async()=>{n++},{},'test@example.test','x'),/network/);assert.equal(n,0);});
test('password reset falls back only for a rejected continue URL',async()=>{const calls=[],auth={};await sendResetWithFallback(async(...args)=>{calls.push(args);if(args.length===3)throw {code:'auth/unauthorized-continue-uri'}},auth,'test@example.test',{url:'https://murdilimax.com/login'});assert.deepEqual(calls[1],[auth,'test@example.test']);let n=0;await assert.rejects(sendResetWithFallback(async()=>{n++;throw new Error('quota')},auth,'test@example.test',{}),/quota/);assert.equal(n,1);});
test('password recovery remains visible during registration and pending verification',async()=>{const js=await fs.readFile('public/auth/login.js','utf8');assert.match(js,/registerOrSignIn\(createUserWithEmailAndPassword/);assert.match(js,/sendResetWithFallback\(sendPasswordResetEmail/);assert.doesNotMatch(js,/querySelector\("#reset"\)\.hidden=true/);assert.match(js,/setMode\(false\);status.textContent=R\[0\]/);});

test('pending members can use their own favorites and session only',async()=>{
 const {permitsPendingMember}=await import('../render/pending-member.js');
 assert.ok(permitsPendingMember('/api/session','GET'));
 for(const method of ['GET','POST'])assert.ok(permitsPendingMember('/api/favorites',method));
 for(const path of ['/api/create','/api/chat/messages','/api/claim','/api/admin/me','/media/private','/api/room','/api/favorites/other'])
   assert.equal(permitsPendingMember(path,'POST'),false);
});
