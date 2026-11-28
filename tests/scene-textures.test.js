import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {texturePixels} from '../scene-texture-data.js';
import {prepareSurfaceTextures,surfaceTexture,surfaceTextureStats} from '../scene-materials.js';
test('background pixel preparation retains the existing texture colors and normal values',()=>{
 const expected={bark:'89ff706b622403f4cb0f8b6e0d144745ad82f7eb21681cb9b581b454ee92b766',wood:'152c96cdefaea89fffb1ca244ed457ec89183a176167246c76858fcb63857a00',ground:'416de0d813c75f98bd512b9dc466ad6851eeecb8de8d2d1a2154898535a67121',stone:'776525a4d63c0457b2622875766db760a76e731630201d47caf8c1c22f0bdd88',grassland:'0cb6d54da7ebe6dc2dfd9f91beadc6ec5bafbfdda5e7fe1be799eff9515c9bd5',leaf:'f08d17cb9008a5946dc833feb47fe5950c4167abf3bf7dc144a98473598b9e08'};for(const [kind,hash]of Object.entries(expected)){const t=texturePixels(kind,16,32);assert.equal(createHash('sha256').update(t.pixels).update(t.normal).digest('hex'),hash,kind);}
});
test('worker-free preparation yields between textures, reuses bounded CPU data, and creates independently disposable GPU textures',async()=>{
 let ticks=0;const timer=setInterval(()=>ticks++,0);try{await prepareSurfaceTextures('summer-pond');}finally{clearInterval(timer);}assert.ok(ticks>0);const a=surfaceTextureStats();assert.ok(a.bytes<=a.maxBytes);assert.equal(a.pending,0);assert.equal(a.workerActive,false);assert.ok(a.entries>=6);await prepareSurfaceTextures('amazon-confluence');assert.equal(surfaceTextureStats().mainJobs,a.mainJobs);
 const t=surfaceTexture('bark',512,512),u=surfaceTexture('bark',512,512);assert.notEqual(t.map,u.map);assert.equal(t.map.image.data,u.map.image.data);t.map.dispose();t.normalMap.dispose();assert.equal(u.map.image.data.length,512*512*4);u.map.dispose();u.normalMap.dispose();
});
