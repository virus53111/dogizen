import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import fs from 'node:fs/promises';
import {processVip,recordVipSession,awardReferral,vipLock,gift} from '../render/vip.js';
const url=process.env.VIP_TEST_DATABASE_URL;
if(!url||new URL(url).hostname!=='127.0.0.1'||new URL(url).pathname!=='/vip_test')throw Error('Use isolated local vip_test database only');
test('PostgreSQL migration, repeat awards, account eligibility and concurrent gifts',async()=>{
 const pool=new pg.Pool({connectionString:url});
 const db={query:(s,p)=>pool.query(s,p),transaction:async fn=>{const c=await pool.connect();try{await c.query('BEGIN');const result=await fn((s,p)=>c.query(s,p));await c.query('COMMIT');return result}catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}}};
 try{
  await db.query("CREATE TABLE users(id TEXT PRIMARY KEY,email TEXT NOT NULL,email_verified_at TIMESTAMPTZ,visible BOOLEAN DEFAULT FALSE,last_seen TIMESTAMPTZ)");
  for(const file of (await fs.readdir('migrations')).filter(x=>x.endsWith('.sql')).sort())await db.query(await fs.readFile('migrations/'+file,'utf8'));
  await db.query('CREATE TABLE IF NOT EXISTS mm_media(id TEXT PRIMARY KEY,mime TEXT NOT NULL,body BYTEA NOT NULL,created_at TIMESTAMPTZ DEFAULT NOW())');
  for(const id of ['a','b','c','d'])await db.query("INSERT INTO users(id,email,email_verified_at) VALUES($1,$2,NULL)",[id,id+'@example.test']);
  const code=(await db.query("INSERT INTO mm_vip_accounts(user_id) VALUES('a') RETURNING code")).rows[0].code;
  const to=(await db.query("INSERT INTO mm_listings(owner_id,display_name,age,country,city,description,status,created_at) VALUES('c','Recipient',30,'LV','Riga','A recipient profile without any VIP code.','approved','2026-11-26') RETURNING id")).rows[0].id;
  await db.transaction(q=>recordVipSession(q,'a',null,'203.0.113.1',false));
  await db.transaction(q=>recordVipSession(q,'b',code,'203.0.113.3',true));
  await db.transaction(q=>recordVipSession(q,'d',code,'203.0.113.1',true));

  await processVip(db);
  assert.equal((await db.query("SELECT state FROM mm_vip_referrals WHERE invitee='b'")).rows[0].state,'pending');
  const id=(await db.query("INSERT INTO mm_listings(owner_id,display_name,age,country,city,description,status,created_at) VALUES('b','Test',30,'LV','Riga','An authentic description for a test profile.','approved','2026-11-26') RETURNING id")).rows[0].id;
  await db.query("INSERT INTO mm_media(id,mime,body) VALUES('murdilimax/photos/test.webp','image/webp',decode('00','hex'))");
  await db.query("INSERT INTO mm_listing_photos(listing_id,photo_url) VALUES($1,'/media/murdilimax/photos/test.webp')",[id]);
  const dup=(await db.query("INSERT INTO mm_listings(owner_id,display_name,age,country,city,description,status,created_at) VALUES('d','Duplicate',30,'LV','Riga','Another complete profile using the same IP.','approved','2026-11-26') RETURNING id")).rows[0].id;
  await db.query("INSERT INTO mm_listing_photos(listing_id,photo_url) VALUES($1,'/media/murdilimax/photos/test.webp')",[dup]);
  await Promise.all([processVip(db),processVip(db)]);
  assert.equal((await db.query("SELECT COUNT(*)::integer n FROM mm_vip_events WHERE user_id='d'")).rows[0].n,0);
  assert.equal((await db.query("SELECT SUM(months)::integer n FROM mm_vip_events WHERE user_id='b'")).rows[0].n,6);
  assert.equal((await db.query("SELECT state FROM mm_vip_referrals WHERE invitee='b'")).rows[0].state,'confirmed');
  assert.equal((await db.query("SELECT reason FROM mm_vip_referrals WHERE invitee='d'")).rows[0].reason,'duplicate_ip');
  assert.equal(await db.transaction(async q=>{await vipLock(q);return awardReferral(q,'b')}),false);
  assert.equal((await db.query("SELECT SUM(days)::integer n FROM mm_vip_events WHERE user_id='a'")).rows[0].n,5);
  const g1='11111111-1111-4111-8111-111111111111',g2='22222222-2222-4222-8222-222222222222';
  const transfer=id=>db.transaction(q=>gift(q,'a',to,5,id));
  const result=await Promise.all([transfer(g1),transfer(g2)]);
  assert.deepEqual(result.slice().sort(),['balance','ok']);
  assert.equal(await transfer(result[0]==='ok'?g1:g2),'ok');
  assert.equal((await db.query("SELECT SUM(days)::integer n FROM mm_vip_events WHERE user_id='c'")).rows[0].n,5);
  await db.query("INSERT INTO mm_vip_bans(user_id,reason) VALUES('b','test fraud')");
  await db.query("UPDATE mm_listings SET status='rejected' WHERE id=$1",[id]);
  await assert.rejects(db.query("UPDATE mm_listings SET status='approved' WHERE id=$1",[id]),/Banned account/);
 }finally{await pool.end()}
});
