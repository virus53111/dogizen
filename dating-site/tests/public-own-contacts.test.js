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

test('ordinary punctuation around voluntarily shared contacts does not block publication',()=>{
 for(const contact of ['Telegram: https://t.me/example_contact.','Email: hello@example.invalid.','Telegram: (https://t.me/example_contact).','Телефон: +371 2000 0000.','Telegram: @example_contact.']){
  assert.equal(selfPublication({...consent,description:'Ищу компанию для общения. '+contact}).allowed,true,contact);
 }
 for(const contact of ['https://t.me/example_contact?start=spam','https://t.me/example_contact/other','https://example.invalid','https://t.me/example_contact.invalid']){
  assert.equal(selfPublication({...consent,description:'Ищу компанию для общения. '+contact}).allowed,false,contact);
 }
});
test('both forms show specific errors while keeping contact consent and publication rules',async()=>{
 const app=await readFile(new URL('../public/app.js',import.meta.url),'utf8');
 const edit=await readFile(new URL('../public/catalog-v2.js',import.meta.url),'utf8');
 assert.match(app,/function profilePolicyMessage\(response\)/);
 assert.match(app,/possible_paid_service:"profilePolicyPaid"/);
 assert.match(app,/profilePolicyMessage\(j\)/);
 assert.match(edit,/profilePolicyMessage\(j\)/);
 for(const lang of ['ru','en','de','lv','lt','et']){
  const page=await readFile(new URL('../public/'+(lang==='ru'?'':lang+'/')+'index.html',import.meta.url),'utf8');
  assert.match(page,/id="commercialNote" data-t="photoPolicy"/);
  assert.doesNotMatch(page,/class="compliance-note" id="commercialNote"/);
  assert.match(page,/name="publicContactsConfirmed"/);
 }
});

test('contact labels, separators and multiline ordinary descriptions allow opted-in own contacts',()=>{
 const base='Looking for company for a walk and a friendly conversation.';
 for(const details of [
  'Telegram --@example_contact',
  'Telegram: @example_contact',
  'Telegram — @example_contact',
  'Email: hello@example.invalid',
  'Phone: +47 400 00 000',
  'Telegram --@example_contact\nEmail: hello@example.invalid\nPhone: +47 400 00 000'
 ]){
  assert.equal(selfPublication({...consent,description:base+'\n'+details}).allowed,true,details);
 }
 const description=base+'\nTelegram --@example_contact';
 assert.equal(selfPublication({...consent,description,publicContactsConfirmed:false}).allowed,false);
 assert.equal(selfPublication({...consent,description:description+'\nhttps://example.invalid'}).allowed,false);
 for(const offer of ['paid sexual video calls','sex video call and it is affordable','erotic video calls for money']){
  const decision=selfPublication({...consent,description:description+'\n'+offer});
  assert.equal(decision.allowed,false);
  assert.ok(decision.signals.includes('possible_paid_service'));
 }
});
