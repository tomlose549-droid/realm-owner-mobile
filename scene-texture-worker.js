// No Three.js or WebGL in the worker. Transfer only immutable color/normal pixels.
if(typeof WorkerGlobalScope!=='undefined'&&globalThis instanceof WorkerGlobalScope){
 let modulePromise;
 self.addEventListener('message',async({data})=>{const {key,kind,w,h,moduleUrl}=data;try{modulePromise??=import(moduleUrl);const {texturePixels}=await modulePromise,result=texturePixels(kind,w,h);self.postMessage({key,pixels:result.pixels.buffer,normal:result.normal.buffer},[result.pixels.buffer,result.normal.buffer]);}catch(error){self.postMessage({key,error:error.message});}});
}
