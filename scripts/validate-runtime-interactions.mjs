import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Smoke-test the browser entry point instead of merely searching its source for
// a plausible selector. A single querySelector(...).forEach used to crash this
// entire script, disabling the search form, filters and calculator listeners.
const source=readFileSync('public/site.js','utf8');
const node=dataset=>({
 dataset,hidden:false,value:'',
 events:Object.create(null),
 classList:{toggle(){},add(){},remove(){}},
 addEventListener(type,handler){(this.events[type]??=[]).push(handler)},
 setAttribute(){},appendChild(){},append(){},replaceChildren(){},
});
const filters=[node({filter:'all'}),node({filter:'tech'}),node({filter:'digital'})];
const links=[node({filterLink:'tech'}),node({filterLink:'digital'})];
const stories=[node({topic:'tech',search:'ryzen upgrade'}),node({topic:'digital',search:'wifi speed'})];
const search=node(),form=node(),grid=node(),bar=node(),universal=node(),list=node(),empty=node();
const elements={
 '.filter-btn':filters[0],'.filters':bar,'#story-grid':grid,
 '#site-search':search,'#search-form':form,'#no-results':empty,
 '#universal-results':universal,'#universal-list':list
};
const selectAll={'.filter-btn':filters,'[data-filter-link]':links,'.story-wrap':stories};
const document={
 body:{dataset:{lang:'en'}},
 querySelector(s){return elements[s]||null},
 querySelectorAll(s){return selectAll[s]||[]},
 addEventListener(type,handler){this.events[type]=handler},
 events:{},
 createElement(){return node()}
};
vm.runInNewContext(source,{document,console,window:{location:{search:''}},location:{},navigator:{},URLSearchParams,setTimeout(){}},{timeout:1500});
for(const [kind,items] of [['category filter',filters],['topic link',links]]){
 for(const el of items)assert.equal(el.events.click?.length,1,kind+' missing listener');
}
assert.equal(form.events.submit?.length,1,'search form must initialize');
assert.equal(typeof document.events.error,'function','image fallback must initialize');
filters[1].events.click[0]();
assert.equal(stories[0].hidden,false,'selected topic content should be visible');
assert.equal(stories[1].hidden,true,'unselected topic content should be hidden');
filters[0].events.click[0]();
assert.equal(stories[0].hidden,false);
assert.equal(stories[1].hidden,false);
console.log('PASS: browser JS initializes fully and all filters work; search form and image fallback are registered.');
