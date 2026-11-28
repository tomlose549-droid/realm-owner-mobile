import {prepareSurfaceTextures} from './scene-materials.js';
import {createReflectionSchedule} from './render-settings.js';
import * as THREE from './vendor/three.module.js';
import {getMapDefinition,getMapContext,DEFAULT_MAP_ID} from './map-registry.js';

// One map instance at a time. This factory does not create UI, saves or a render loop.
export async function createMapRuntime({scene,camera,renderer,id=DEFAULT_MAP_ID,fine=true,sharedResources=new Set()}){
  const definition=getMapDefinition(id),context=getMapContext(id);
  const [{createMap}]=await Promise.all([definition.load(),prepareSurfaceTextures(id)]);
  await new Promise(resolve=>setTimeout(resolve,0));
  const view=createMap(scene,camera,renderer,definition.config,{sharedResources});
  const reflections=createReflectionSchedule((definition.config.quality.fine.reflectionEvery??3)/25);
  camera.position.set(...context.spawn.position);camera.rotation.set(context.spawn.pitch,context.spawn.yaw,0);
  try{
    view.setQuality(fine);
    if(renderer.compileAsync){
      // Three.compile traverses hidden resource holders too. Compile only visible
      // drawables, with the actual scene supplying its lights/fog exactly once.
      const visible=new THREE.Group();visible.traverse=visit=>scene.traverseVisible(o=>{if(o.isMesh||o.isPoints||o.isLine||o.isSprite)visit(o);});
      await renderer.compileAsync(visible,camera,scene);
    }
  }catch(error){view.dispose();throw error;}
  return Object.freeze({context,playerPosition:new THREE.Vector3(...context.spawn.position),
    update:elapsed=>view.update(elapsed),setQuality:fine=>view.setQuality(fine),
    renderReflection:options=>{if(Number.isFinite(options.time)){if(reflections.due(options.time,options.force))view.renderReflection({...options,fine:true,force:true});}else view.renderReflection(options);},
    getDiagnostics:()=>view.getDiagnostics(),dispose:()=>view.dispose()});
}
