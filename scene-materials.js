import * as THREE from './vendor/three.module.js';
import {assetUrl} from './release-assets.js';
import {texturePixels} from './scene-texture-data.js';
const cache=new Map(),pending=new Map(),MAX_BYTES=12*1024*1024;let bytes=0,worker=null,workerUnavailable=false,workerJobs=0,mainJobs=0;
const kinds={"summer-pond":['bark','wood','grassland','ground','stone','leaf'],"amazon-confluence":['bark','wood','ground','leaf'],"amazon-flooded-forest":['bark','wood','ground','leaf'],"sac-actun":['stone','bark','leaf']};
const keyFor=(kind,w,h)=>kind+':'+w+':'+h,yieldTask=()=>new Promise(resolve=>setTimeout(resolve,0));
function remember(key,value){if(cache.has(key))return cache.get(key);const size=value.pixels.byteLength+value.normal.byteLength;if(size>MAX_BYTES)return value;while(cache.size&&bytes+size>MAX_BYTES){const first=cache.keys().next().value,old=cache.get(first);bytes-=old.pixels.byteLength+old.normal.byteLength;cache.delete(first);}cache.set(key,value);bytes+=size;return value;}
function local(kind,w,h){const key=keyFor(kind,w,h);if(cache.has(key))return cache.get(key);mainJobs++;return remember(key,texturePixels(kind,w,h));}
function finish(key,value){const job=pending.get(key);if(!job)return;clearTimeout(job.timer);pending.delete(key);if(value)remember(key,value);job.resolve();if(!pending.size){worker?.terminate();worker=null;}}
function failWorker(){workerUnavailable=true;worker?.terminate();worker=null;for(const [key,job]of [...pending]){clearTimeout(job.timer);pending.delete(key);job.resolve();}}
function prepare(kind,w,h){const key=keyFor(kind,w,h);if(cache.has(key))return Promise.resolve();if(pending.has(key))return pending.get(key).promise;if(typeof Worker==='undefined'||workerUnavailable)return Promise.resolve();
 if(!worker)try{worker=new Worker(assetUrl('./scene-texture-worker.js'),{type:'module'});worker.onmessage=({data})=>{if(data.error){finish(data.key);return;}workerJobs++;finish(data.key,{pixels:new Uint8Array(data.pixels),normal:new Uint8Array(data.normal)});};worker.onerror=failWorker;}catch{workerUnavailable=true;return Promise.resolve();}
 let resolve;const promise=new Promise(r=>resolve=r),timer=setTimeout(failWorker,4000);pending.set(key,{promise,resolve,timer});worker.postMessage({key,kind,w,h,moduleUrl:assetUrl('./scene-texture-data.js')});return promise;
}
export async function prepareSurfaceTextures(id){const list=kinds[id]??[];await Promise.all(list.map(kind=>prepare(kind,kind==='leaf'?128:512,kind==='leaf'?256:512)));for(const kind of list){const w=kind==='leaf'?128:512,h=kind==='leaf'?256:512;if(!cache.has(keyFor(kind,w,h))){await yieldTask();local(kind,w,h);}}}
export function surfaceTextureStats(){return {entries:cache.size,bytes,maxBytes:MAX_BYTES,pending:pending.size,workerActive:!!worker,workerJobs,mainJobs};}
export function surfaceTexture(kind,w,h){const {pixels,normal}=local(kind,w,h);const make=(data,color)=>{const t=new THREE.DataTexture(data,w,h);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.colorSpace=color?THREE.SRGBColorSpace:THREE.NoColorSpace;t.needsUpdate=true;return t;};return {map:make(pixels,true),normalMap:make(normal,false)};}
