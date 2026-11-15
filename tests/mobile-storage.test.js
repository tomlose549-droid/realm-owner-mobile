import test from 'node:test';
import assert from 'node:assert/strict';
import {createSaveSlots,SAVE_SLOTS_KEY} from '../save-slots.js';
import {createPlayerStorage,PLAYER_STORAGE_KEY} from '../player-storage.js';
import {DISCOVERIES_KEY} from '../fish-discoveries.js';
test('mobile saves never read, migrate, overwrite or remove desktop save keys on the same origin',()=>{
 const original=['fisher-realm-save-slots-v1','fisher-realm-inventory-v1','fisher-realm-discoveries-v1'];
 const data=new Map(original.map(k=>[k,JSON.stringify({version:1,items:[],fishIds:['TILAPIA'],storage:{version:1,coins:999999}})])),before=new Map(data),reads=[];
 const storage={getItem:k=>{reads.push(k);return data.get(k)??null;},setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
 const slots=createSaveSlots({storage}),store=createPlayerStorage({storage:slots.storage});assert.equal(store.model.coins,0);assert.equal(store.model.inventory.items.length,0);
 store.run('setCoins',[42]);assert.equal(JSON.parse(data.get(SAVE_SLOTS_KEY)).slots[0].data.inventory.storage.coins,42);
 assert.ok([SAVE_SLOTS_KEY,PLAYER_STORAGE_KEY,DISCOVERIES_KEY].every(k=>k.startsWith('realm-owner-mobile-')));
 assert.ok(reads.every(k=>!original.includes(k)));for(const k of original)assert.equal(data.get(k),before.get(k));
});
