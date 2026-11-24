import test from 'node:test';
import assert from 'node:assert/strict';
import { ONLINE_SQL, PHOTOS_SQL, onlineCount, recentPhotos } from '../render/catalog-extras.js';
test('online count is distinct, opt-in, verified and public',async()=>{
 assert.match(ONLINE_SQL,/COUNT\(DISTINCT u.id\)/);
 for(const condition of ["u.visible IS TRUE","u.email_verified_at IS NOT NULL","5 minutes","ml.status='approved'","p.status='approved'","p.messaging_enabled IS TRUE"])assert.ok(ONLINE_SQL.includes(condition));
 assert.deepEqual(await onlineCount({query:async sql=>{assert.equal(sql,ONLINE_SQL);return {rows:[{online:0}]}}}),{online:0});
 await assert.rejects(onlineCount({query:async()=>({rows:[]})}));
});
test('photo feed uses actual member photo timestamp and published verified owners',async()=>{
 for(const condition of ["JOIN mm_media","ml.status='approved'","p.status='approved'","u.email_verified_at IS NOT NULL","p.messaging_enabled IS TRUE","ORDER BY ph.created_at DESC,ph.id DESC LIMIT 48"])assert.ok(PHOTOS_SQL.includes(condition));
 const item={listing_id:'id',display_name:'Public name',city:'Riga',country:'LV',photo_url:'/media/murdilimax/photo',created_at:'2026-11-24',owner_id:'private'};
 const result=await recentPhotos({query:async sql=>{assert.equal(sql,PHOTOS_SQL);return {rows:[item]}}});
 assert.equal(result.photos.length,1);assert.equal(result.photos[0].photo_url,item.photo_url);assert.ok(!('owner_id' in result.photos[0]));
});
