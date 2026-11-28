import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {WORLD_IMAGE,WORLD_LOCATIONS} from '../world-map-data.js';
const require=createRequire(import.meta.url),{metadata}=require('../scripts/build-release.cjs'),pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url)));
test('content cache keys and preload graph match source files, without preloading other maps',async()=>{
 const actual=await metadata(pkg);for(const field of Object.keys(actual))assert.deepEqual(pkg.fisherRealm[field],actual[field]);
 const closure=entry=>{const found=new Set(),queue=[entry];while(queue.length){const file=queue.pop();if(found.has(file))continue;found.add(file);queue.push(...actual.dependencies[file]);}return found;};
 const world=closure('world-map.js');assert.ok(!world.has('main.js'));assert.ok(!world.has('vendor/three.core.js'));for(const scene of Object.values(actual.mapModules)){assert.ok(!world.has(scene));assert.ok(!closure('main.js').has(scene));}
 assert.equal(Object.keys(actual.mapModules).length,4);assert.ok(closure('main.js').has('vendor/three.core.js'));assert.equal(actual.assets[WORLD_IMAGE].length,16);
});
test('all map display images fit the mobile budget and retain original source PNGs',async()=>{
 let before=0,after=0;for(const file of [WORLD_IMAGE,...WORLD_LOCATIONS.map(x=>x.preview)]){const source=file.replace('/mobile/','/').replace('.webp','.png'),[a,b]=await Promise.all([readFile(new URL('../'+source,import.meta.url)),readFile(new URL('../'+file,import.meta.url))]);before+=a.length;after+=b.length;assert.equal(b.subarray(8,12).toString(),'WEBP');assert.ok(b.length<(file===WORLD_IMAGE?400000:150000));}assert.ok(after<before*.12);
});
