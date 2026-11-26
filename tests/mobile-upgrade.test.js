import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSaveSlots,SAVE_SLOTS_KEY} from '../save-slots.js';
import {createPlayerStorage} from '../player-storage.js';
import {createFishDiscoveries} from '../fish-discoveries.js';
const fixture=JSON.parse(readFileSync(new URL('./fixtures/mobile-v010-saves.json',import.meta.url)));

test('all three 0.1.0 mobile slots retain coins, bag/pile, warehouse, equipment, upgrades, discoveries and original quests',()=>{
 for(const slot of fixture.slots){const saved=structuredClone(fixture);saved.activeId=slot.id;const text=JSON.stringify(saved),data=new Map([[SAVE_SLOTS_KEY,text],['fisher-realm-save-slots-v1','desktop-do-not-touch']]),io={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
  const slots=createSaveSlots({storage:io}),store=createPlayerStorage({storage:slots.storage}),guide=createFishDiscoveries({storage:slots.storage});
  assert.equal(data.get(SAVE_SLOTS_KEY),text);assert.equal(slots.activeId,slot.id);assert.equal(slots.snapshot().slots.length,3);
  const before=slot.data.inventory,after=store.snapshot();assert.deepEqual(after.items,before.items);assert.equal(after.backpackLevel??0,before.backpackLevel);for(const field of ['coins','activeBox','boxes','equipment','quests'])assert.deepEqual(after.storage[field],before.storage[field]);assert.ok(slot.data.discoveries.fishIds.every(id=>guide.has(id)));
  assert.equal(store.run('setCoins',[before.storage.coins+1]).ok,true);const disk=JSON.parse(data.get(SAVE_SLOTS_KEY));for(const other of saved.slots)if(other.id!==slot.id)assert.deepEqual(disk.slots.find(s=>s.id===other.id),other);assert.equal(data.get('fisher-realm-save-slots-v1'),'desktop-do-not-touch');
 }
});
