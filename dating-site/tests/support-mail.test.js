import test from 'node:test';
import assert from 'node:assert/strict';
import { sendPending } from '../render/support-mail.js';

test('support notification clears the retry only after mail is accepted', async () => {
  const queries = [];
  const db = {async query(sql, args) { queries.push({sql,args}); return {rows:[{id:'ticket-id'}]}; }};
  const recipient = 'owner@example.test';
  await assert.rejects(sendPending(db, recipient, async () => {throw Error('offline');}));
  assert.equal(queries.length, 1);
  assert.match(queries[0].sql, /SKIP LOCKED/);
  await sendPending(db, recipient, async (to,id) => {
    assert.equal(to, recipient);
    assert.equal(id, 'ticket-id');
  });
  assert.deepEqual(queries.at(-1).args, ['ticket-id']);
  assert.match(queries.at(-1).sql, /notify_after = NULL/);
});

test('invalid mail destination cannot inject a second recipient', async () => {
  await sendPending({query:assert.fail}, 'owner@example.test\nBcc: other@example.test', assert.fail);
});
