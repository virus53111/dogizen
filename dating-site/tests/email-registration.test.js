import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {sendVerificationWithFallback,verifiedToken,registerOrSignIn,sendResetWithFallback} from '../public/auth/email-flow.js';
test('verification email falls back to Firebase hosted action only for rejected continue URL',async()=>{const calls=[];const user={};await sendVerificationWithFallback(async(...args)=>{calls.push(args);if(args.length===2)throw {code:'auth/unauthorized-continue-uri'};},user,{url:'https://murdilimax.com/login'});assert.equal(calls.length,2);assert.deepEqual(calls[1],[user]);});
test('delivery and quota errors never trigger another send or claim success',async()=>{let n=0;await assert.rejects(sendVerificationWithFallback(async()=>{n++;throw new Error('quota');},{},{}),/quota/);assert.equal(n,1);});
test('explicit verification check only returns a refreshed verified token',async()=>{let tokens=0;const u={emailVerified:false,reload:async()=>{},getIdToken:async()=>{tokens++;return 'token'}};assert.equal(await verifiedToken(u),null);assert.equal(tokens,0);u.reload=async()=>{u.emailVerified=true};u.getIdToken=async(force)=>{assert.equal(force,true);return 'fresh'};assert.equal(await verifiedToken(u),'fresh');});

test('repeat registration authenticates the existing account using the supplied password',async()=>{const auth={},user={emailVerified:false};let calls=0;const result=await registerOrSignIn(async()=>{throw {code:'auth/email-already-in-use'}},async(a,e,p)=>{calls++;assert.equal(a,auth);assert.equal(e,'test@example.test');assert.equal(p,'original-password');return {user}},auth,'test@example.test','original-password');assert.equal(result.user,user);assert.equal(calls,1);});
test('repeat registration cannot bypass a wrong password or retry unrelated errors',async()=>{let n=0;await assert.rejects(registerOrSignIn(async()=>{throw {code:'auth/email-already-in-use'}},async()=>{throw new Error('wrong password')},{},'test@example.test','wrong'),/wrong password/);await assert.rejects(registerOrSignIn(async()=>{throw new Error('network')},async()=>{n++},{},'test@example.test','x'),/network/);assert.equal(n,0);});
test('password reset falls back only for a rejected continue URL',async()=>{const calls=[],auth={};await sendResetWithFallback(async(...args)=>{calls.push(args);if(args.length===3)throw {code:'auth/unauthorized-continue-uri'}},auth,'test@example.test',{url:'https://murdilimax.com/login'});assert.deepEqual(calls[1],[auth,'test@example.test']);let n=0;await assert.rejects(sendResetWithFallback(async()=>{n++;throw new Error('quota')},auth,'test@example.test',{}),/quota/);assert.equal(n,1);});


test('normal member routes are accessible without verified email; admin and claim are protected',async()=>{
 const {permitsPendingMember}=await import('../render/pending-member.js');
 for(const path of ['/api/session','/api/favorites','/api/mine','/api/chat/messages','/api/create','/api/room','/api/privacy/export'])assert.ok(permitsPendingMember(path,'POST'));
 for(const path of ['/api/admin/me','/api/ADMIN/manage/','/api/claim','/api/legacy/claim'])assert.equal(permitsPendingMember(path,'POST'),false);
});
test('login page contains only normal sign-in, registration and password recovery, with Google unchanged',async()=>{
 const html=await fs.readFile('public/auth/login.html','utf8'),js=await fs.readFile('public/auth/login.js','utf8'),refresh=await fs.readFile('public/auth/refresh.js','utf8');
 for(const id of ['registerMode','loginMode','email','password','submit','reset','google'])assert.ok(html.includes('id="'+id+'"'));
 assert.doesNotMatch(html,/verifyPanel|checkVerified|id="resend"/);
 assert.doesNotMatch(js,/sendEmailVerification|verifiedToken|showVerification|user\.emailVerified/);
 assert.doesNotMatch(refresh,/sendEmailVerification|verifyText|member\.emailVerified/);
 assert.match(js,/signInWithPopup\(auth,googleProvider\)/);
 assert.match(js,/sendResetWithFallback\(sendPasswordResetEmail/);
 for(const p of ['public/app.js','public/social-v4.js'])assert.doesNotMatch(await fs.readFile(p,'utf8'),/emailVerified===false/);
});
test('existing unconfirmed session restores and new email signup reaches the destination without any email',async()=>{
 const src=(await fs.readFile('public/auth/login.js','utf8')).replace(/^import .*;\s*$/gm,'');
 const {registerOrSignIn,sendResetWithFallback}=await import('../public/auth/email-flow.js');
 const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
 for(const scenario of ['existing','register','login']){
  const nodes=new Map();
  const node=sel=>{if(!nodes.has(sel))nodes.set(sel,{value:'',setAttribute(){},reportValidity(){return true},focus(){}});return nodes.get(sel)};
  const document={documentElement:{},querySelector:node,querySelectorAll:()=>[]};
  const user={uid:'uid',emailVerified:false,getIdToken:async(force)=>{assert.equal(force,true);return 'signed-token'}};
  const auth={currentUser:scenario==='existing'?user:null,authStateReady:async()=>{}};
  let creates=0,signs=0;const destinations=[],requests=[];
  const location={origin:'https://murdilimax.com',search:'?next=%2Fen%2F'+(scenario==='register'?'&mode=register':''),replace:value=>destinations.push(value)};
  const fetch=async(url,options)=>{if(url==='/auth/config')return {json:async()=>({})};requests.push([url,JSON.parse(options.body)]);return {ok:true}};
  const exec=new AsyncFunction('document','location','fetch','initializeApp','getAuth','setPersistence','browserLocalPersistence','GoogleAuthProvider','signInWithPopup','signInWithEmailAndPassword','createUserWithEmailAndPassword','sendPasswordResetEmail','registerOrSignIn','sendResetWithFallback',src);
  await exec(document,location,fetch,()=>({}),()=>auth,async()=>{},null,class{setCustomParameters(){}},async()=>{throw Error('unexpected Google')},async()=>{signs++;return {user}},async()=>{creates++;return {user}},async()=>{throw Error('unexpected reset email')},registerOrSignIn,sendResetWithFallback);
  if(scenario!=='existing'){node('#email').value='test@example.test';node('#password').value='long-password-123';node('#account').onsubmit({preventDefault(){}});await new Promise(resolve=>setImmediate(resolve));}
  assert.deepEqual(requests,[['/auth/session',{idToken:'signed-token'}]]);
  assert.deepEqual(destinations,['/login?next=%2Fen%2F']);
  assert.equal(creates,scenario==='register'?1:0);assert.equal(signs,scenario==='login'?1:0);
 }
});
