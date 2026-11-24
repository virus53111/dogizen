import test from 'node:test';
import assert from 'node:assert/strict';
import { db } from 'hatchable';
import locations from '../api/locations.js';
import listings from '../api/listings.js';

test('city picker reads distinct public locations independently of catalog pagination', async (t) => {
  const rows = [{country: 'LV', city: 'Огре'}];
  t.mock.method(db, 'query', async sql => {
    assert.match(sql, /SELECT DISTINCT country, city FROM mm_public_listings/);
    assert.match(sql, /status = 'approved'/);
    assert.doesNotMatch(sql, /LIMIT/i);
    return {rows};
  });
  await locations({}, {json: body => assert.deepEqual(body, {locations: rows})});
});

test('country and city constrain both the result count and the listings', async (t) => {
  const query = t.mock.method(db, 'query', async (sql, args) => {
    assert.match(sql, /country = \$1 AND city = \$2/);
    assert.deepEqual(args, ['LV', 'Огре']);
    return {rows: []};
  });
  await listings({query: {country:'LV', city:'Огре'}}, {json: body => assert.equal(body.total, 0)});
  assert.equal(query.mock.callCount(), 2);
});
