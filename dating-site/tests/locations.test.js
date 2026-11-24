import test from 'node:test';
import assert from 'node:assert/strict';
import { db } from 'hatchable';
import locations from '../api/locations.js';
import listings from '../api/listings.js';

test('city picker reads distinct public locations independently of catalog pagination', async (t) => {
  const rows = [{country: 'LV', city: 'Огре',count:1}];
  t.mock.method(db, 'query', async sql => {
    assert.match(sql, /GROUP BY country, city/);
    assert.match(sql, /status = 'approved'/);
    assert.doesNotMatch(sql, /LIMIT/i);
    return {rows};
  });
  await locations({}, {json: body => assert.equal(body.locations.find(x=>x.city==='Огре').count,1)});
});

test('country and city constrain both the result count and the listings', async (t) => {
  const query = t.mock.method(db, 'query', async (sql, args) => {
    assert.match(sql, /country = \$1 AND city = ANY\(\$2::text\[\]\)/);
    assert.deepEqual(args, ['LV', ['Огре','Ogre']]);
    return {rows: []};
  });
  await listings({query: {country:'LV', city:'Огре'}}, {json: body => assert.equal(body.total, 0)});
  assert.equal(query.mock.callCount(), 2);
});

test('Latvian radius uses city centres and keeps exact search as the default', async () => {
  const {cities,cityNamesInRange} = await import('../render/latvia-cities.js');
  assert.equal(cities.length,81);
  assert.deepEqual(cityNamesInRange('Ogre',''), ['Огре','Ogre']);
  assert.ok(cityNamesInRange('Огре','25').includes('Икшкиле'));
  assert.ok(!cityNamesInRange('Огре','25').includes('Рига'));
  assert.ok(cityNamesInRange('Огре','50').includes('Рига'));
  assert.ok(!cityNamesInRange('Огре','50').includes('Вентспилс'));
});
