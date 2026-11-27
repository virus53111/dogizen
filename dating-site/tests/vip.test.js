import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {CODE,CUTOFF,DAYS,POINTS_PER_MONTH,CAMPAIGN_POINTS,POINTS_SUM,ipDigest,telegramIdentity,gift,awardReferral,recordVipSession} from '../render/vip.js';
test('campaign cutoff is Riga midnight, five days per referral',()=>{assert.equal(DAYS,5);assert.equal(new Date(CUTOFF).toISOString(),'2026-12-31T22:00:00.000Z');assert.equal(CODE.test('not-a-code'),false)});
test('IP hash normalizes mapped IPv4 and is keyed',()=>{assert.equal(ipDigest('::ffff:203.0.113.4','key'),ipDigest('203.0.113.4','key'));assert.notEqual(ipDigest('203.0.113.4','key'),ipDigest('203.0.113.4','other'));assert.equal(ipDigest('bad','key'),null)});
test('Telegram validates server HMAC, expiry and duplicate fields',()=>{const token='test-token',now=1700000000000,p=new URLSearchParams({auth_date:String(now/1000),user:JSON.stringify({id:123})});const check=[...p].sort().map(([k,v])=>k+'='+v).join('\n');p.set('hash',createHmac('sha256',createHmac('sha256','WebAppData').update(token).digest()).update(check).digest('hex'));assert.equal(telegramIdentity(p.toString(),token,now),'123');assert.equal(telegramIdentity(p.toString(),'wrong',now),null);assert.equal(telegramIdentity(p.toString(),token,now+301000),null);assert.equal(telegramIdentity(p.toString()+'&user=%7B%7D',token,now),null)});
test('invalid or insufficient gifts do not write balances',async()=>{const code='11111111-1111-4111-8111-111111111111';assert.equal(await gift(()=>{throw Error('no queries')},'a',code,-5,code),'invalid');let calls=[];const q=async(sql)=>{calls.push(sql);if(sql.includes('SELECT u.id AS user_id'))return {rows:[{user_id:'b'}]};if(sql.includes(POINTS_SUM))return {rows:[{points:'4'}]};return {rows:[]}};assert.equal(await gift(q,'a',code,5,code),'balance');assert.ok(!calls.some(x=>x.includes('INSERT')));});
test('referral cannot be rewarded without eligibility and uses stable event key',async()=>{assert.equal(await awardReferral(async()=>({rows:[]}),'new'),false);const calls=[];const q=async(sql,args)=>{calls.push({sql,args});return {rows:sql.includes('SELECT r.inviter')?[{inviter:'original',invitee:'new'}]:[]}};assert.equal(await awardReferral(q,'new'),true);assert.deepEqual(calls[1].args,['original','referral:new',5]);assert.match(calls[1].sql,/ON CONFLICT/);});
test('existing account cannot be attributed as a new referral',async()=>{const calls=[];await recordVipSession(async(sql)=>{calls.push(sql);return {rows:[{ip_key:'test'}]}},'old','11111111-1111-4111-8111-111111111111','203.0.113.4',false);assert.ok(!calls.some(s=>s.includes('INSERT INTO mm_vip_referrals')))});


test('180 MP equals six fixed 30-day reward months; one ledger balance includes both legacy sources',()=>{assert.equal(CAMPAIGN_POINTS,6*POINTS_PER_MONTH);assert.match(POINTS_SUM,/days::bigint \+ 30 \* months::bigint/)});


test('live mode exposes only neutral invitations, no reward processing or public balance',async()=>{
 const fs=await import('node:fs/promises');
 const server=await fs.readFile('render/server.js','utf8'),route=await fs.readFile('api/invitations.js','utf8'),ui=await fs.readFile('public/invite.js','utf8');
 assert.doesNotMatch(server,/runVip|processVip|recordVipSession/);
 assert.match(server,/recordInvitation\(q,user.id,getCookie\(req,'mm_ref'\),inserted.rows.length>0\)/);
 assert.match(server,/'invitations', 'private-album'/);
 assert.match(server,/app.all\(\['\/api\/vip','\/api\/points-leaderboard','\/api\/admin\/vip'\]/);
 assert.match(route,/invitationCode/);
 assert.match(ui,/searchParams.set\('ref',d.code\)/);
 for(const l of ['ru','en','de','lv','lt','et']){
  const html=await fs.readFile('public/'+(l==='ru'?'':l+'/')+'index.html','utf8');
  assert.match(html,/\/invite.html\?lang=/);
  assert.doesNotMatch(html,/mmVipBanner|mmPointsLeaderboard|points-ui|\/vip\.html|180 MurdiliMax Points/);
 }
 for(const name of ['app.js','catalog-v2.js'])assert.doesNotMatch(await fs.readFile('public/'+name,'utf8'),/mmPointsBadge|mmMountPointsProfile/);
 for(const name of ['listing.js','listings.js'])assert.doesNotMatch(await fs.readFile('api/'+name,'utf8'),/publicPoints|giftableProfile/);
});
test('existing invitation attribution is idempotent and does not collect IP or issue rewards',async()=>{
 const {recordInvitation,invitationCode}=await import('../render/invitations.js');
 const calls=[],code='11111111-1111-4111-8111-111111111111';
 const q=async(sql,args)=>{calls.push({sql,args});return {rows:[{code}]}};
 await recordInvitation(q,'new',code,true);
 await recordInvitation(q,'existing',code,false);
 await recordInvitation(q,'new','invalid',true);
 assert.equal(calls.length,1);assert.match(calls[0].sql,/ON CONFLICT\(invitee\) DO NOTHING/);
 assert.doesNotMatch(calls[0].sql,/mm_vip_events|mm_vip_activity|ip_hash/);
 assert.equal(await invitationCode({query:q},'existing'),code);
});
