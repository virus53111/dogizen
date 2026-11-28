import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { choosePublication, selfPublication } from '../api/publication-policy.js';
const description='Ищу компанию для общения и прогулок в городе. Телефон +371 2000 0000, email hello@example.invalid, Telegram @example_contact, https://t.me/example_contact';
const consent={category:'dating',description,publicContactsConfirmed:true,isCommercial:false};
test('own contacts are optional, only in description and only with explicit consent',()=>{
 assert.equal(selfPublication(consent).allowed,true);
 assert.equal(selfPublication({...consent,publicContactsConfirmed:false}).allowed,false);
 assert.equal(selfPublication({...consent,publicContactsConfirmed:'true'}).allowed,false);
 assert.equal(selfPublication({...consent,isCommercial:true}).allowed,false);
 assert.equal(selfPublication({...consent,headline:'@example_contact'}).allowed,false);
 assert.equal(selfPublication({category:'dating',description:'Ищу компанию для прогулок и общения.'}).allowed,true);
});
test('contact consent never relaxes paid services, minor, spam, duplicate or arbitrary link checks',()=>{
 for(const extra of ['paid sex','секс за деньги','underage','aaaaaaaaaaaa','https://example.invalid','https://t.me/example_contact/other','https://t.me/example_contact?start=spam','https://example.invalid/@example_contact']){
  assert.equal(selfPublication({...consent,description:description+' '+extra}).allowed,false,extra);
 }
 assert.equal(selfPublication({...consent,isDuplicate:true}).allowed,false);
 assert.equal(choosePublication(consent).status,'pending');
});
test('create and edit require explicit own contact consent and keep existing owner and commercial checks',async()=>{
 const create=await readFile(new URL('../api/create.js',import.meta.url),'utf8');
 const mine=await readFile(new URL('../api/mine.js',import.meta.url),'utf8');
 assert.match(create,/publicContactsConfirmed:b\.publicContactsConfirmed===true/);
 assert.match(create,/if\(commercial\)return res\.status\(400\)/);
 assert.match(mine,/publicContactsConfirmed:body\.publicContactsConfirmed===true/);
 assert.match(mine,/isCommercial:profile\.is_commercial===true/);
 assert.match(mine,/WHERE id=\$1 AND owner_id=\$2 FOR UPDATE/);
 for(const lang of ['ru','en','de','lv','lt','et']){
  const page=await readFile(new URL('../public/'+(lang==='ru'?'':lang+'/')+'index.html',import.meta.url),'utf8');
  assert.match(page,/<input type="checkbox" name="publicContactsConfirmed">/);
  assert.match(page,/data-t="publicContactsConsent"/);
 }
 const edit=await readFile(new URL('../public/catalog-v2.js',import.meta.url),'utf8');
 assert.match(edit,/publicContactsConfirmed:form\.elements\.publicContactsConfirmed\.checked/);
});
