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

test('VIP page needs no email verification and offers recipient search',async()=>{
 const fs=await import('node:fs/promises');
 const html=await fs.readFile('public/vip.html','utf8'),js=await fs.readFile('public/vip.js','utf8'),api=await fs.readFile('api/vip.js','utf8');
 assert.doesNotMatch(html,/vipVerify|vip-verify\.js/);
 assert.doesNotMatch(js,/d\.verified|vipVerify/);
 assert.match(html,/id="vipRecipientChoice"/);
 assert.match(js,/\/api\/vip\?recipient=/);
 assert.match(api,/await processVip\(db\)/);
});

test('180 MP equals six fixed 30-day reward months; one ledger balance includes both legacy sources',()=>{assert.equal(CAMPAIGN_POINTS,6*POINTS_PER_MONTH);assert.match(POINTS_SUM,/days::bigint \+ 30 \* months::bigint/)});
