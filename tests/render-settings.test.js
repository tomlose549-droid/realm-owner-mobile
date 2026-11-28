import test from 'node:test';
import assert from 'node:assert/strict';
import {createRenderSettings,RENDER_SETTINGS_KEY,nextFrameTime,createReflectionSchedule} from '../render-settings.js';

test('mobile graphics preferences do not read or overwrite desktop preferences on the same origin',()=>{
 const desktopKey='fisher-realm-render-settings-v1',data=new Map([[desktopKey,'{"quality":"low","maxFps":100}']]),reads=[],io={getItem:k=>{reads.push(k);return data.get(k)??null;},setItem:(k,v)=>data.set(k,v)};
 const mobile=createRenderSettings(io);assert.equal(RENDER_SETTINGS_KEY,'realm-owner-mobile-render-settings-v1');assert.deepEqual(mobile.value,{quality:'high',maxFps:25});mobile.set({quality:'low',maxFps:50});assert.equal(data.get(desktopKey),'{"quality":"low","maxFps":100}');assert.ok(!reads.includes(desktopKey));assert.deepEqual(createRenderSettings(io).value,{quality:'low',maxFps:50});
});
test('render preferences default to high/25, persist independently of progress slots and tolerate unavailable storage',()=>{
 const data=new Map([['realm-owner-mobile-save-slots-v1','untouched-progress']]);const io={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};const s=createRenderSettings(io);assert.deepEqual(s.value,{quality:'high',maxFps:25});assert.equal(data.size,1);s.set({maxFps:100,quality:'low'});assert.deepEqual(createRenderSettings(io).value,{quality:'low',maxFps:100});assert.equal(data.get('realm-owner-mobile-save-slots-v1'),'untouched-progress');data.set(RENDER_SETTINGS_KEY,'broken');assert.equal(createRenderSettings(io).value.maxFps,25);const blocked=createRenderSettings({getItem(){throw Error('denied');},setItem(){throw Error('quota');}});assert.equal(blocked.set({maxFps:50}),false);assert.equal(blocked.value.maxFps,50);
});
test('frame caps remain 25/50/100 and cannot exceed the browser refresh opportunities',()=>{
 for(const cap of [25,50,100]){let next=0,count=0;for(let i=0;i<600;i++){const now=i*1000/60;if(now+1e-8<next)continue;count++;next=nextFrameTime(now,next,cap);}assert.ok(count<=Math.min(cap,60)*10+1);assert.ok(count>=Math.min(cap,60)*10-10);}
 const s=createRenderSettings(null);s.set({maxFps:999,quality:'invalid'});assert.deepEqual(s.value,{quality:'high',maxFps:25});
});
test('25/50/100 frames all perform the same bounded reflection work; pause and forced refresh are handled',()=>{
 for(const interval of [.08,.12,.16]){const counts=[];for(const cap of [25,50,100]){const r=createReflectionSchedule(interval);let n=0;for(let i=0;i<cap*12;i++)if(r.due(i/cap))n++;counts.push(n);assert.equal(r.due(12,true),true);assert.equal(r.due(12),false);assert.equal(r.due(1),true);}assert.deepEqual(counts,Array(3).fill(Math.ceil(12/interval)));}
});
