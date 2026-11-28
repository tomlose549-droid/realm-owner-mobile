// Metadata only: no saves, gameplay parameters, fish images or external downloads.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..'),hash=data=>crypto.createHash('sha256').update(data).digest('hex').slice(0,16);
async function metadata(pkg){
 const modules=fs.readdirSync(root).filter(n=>n.endsWith('.js')&&n!=='release-loader.js');
 for(const name of fs.readdirSync(path.join(root,'maps')))if(name.endsWith('.js'))modules.push('maps/'+name);
 modules.push('vendor/three.module.js','vendor/three.core.js');modules.sort();const moduleSet=new Set(modules),dependencies={};
 for(const file of modules){const source=fs.readFileSync(path.join(root,file),'utf8'),links=[];for(const m of source.matchAll(/(?:\bfrom\s*|\bimport\s*)['"](\.[^'"]+)['"]/g)){const target=path.posix.normalize(path.posix.join(path.posix.dirname(file),m[1]));if(!moduleSet.has(target))throw Error('Unregistered module '+target+' from '+file);if(!links.includes(target))links.push(target);}dependencies[file]=links.sort();}
 const {WORLD_IMAGE,WORLD_LOCATIONS}=await import(pathToFileURL(path.join(root,'world-map-data.js')).href),{listMaps,getMapDefinition}=await import(pathToFileURL(path.join(root,'map-registry.js')).href),mapModules={};
 for(const {id}of listMaps()){const match=getMapDefinition(id).load.toString().match(/import\(['"]\.\/([^'"]+)['"]\)/);if(!match||!moduleSet.has(match[1]))throw Error('Missing lazy scene entry for '+id);mapModules[id]=match[1];}
 const assets={};for(const file of [...modules,...pkg.fisherRealm.styles,...pkg.fisherRealm.preloadImages,WORLD_IMAGE,...WORLD_LOCATIONS.map(x=>x.preview),'audio/hooked.wav','audio/line-broken.wav','audio/caught.wav'])assets[file]=hash(fs.readFileSync(path.join(root,file)));
 return {modules,dependencies,mapModules,assets};
}
async function main(){const file=path.join(root,'package.json'),pkg=JSON.parse(fs.readFileSync(file)),next=await metadata(pkg);if(process.argv.includes('--check')){for(const key of Object.keys(next))if(JSON.stringify(pkg.fisherRealm[key])!==JSON.stringify(next[key]))throw Error('Release metadata stale: '+key+'; run npm run build:release');console.log('Release hashes and preload graph verified');}else{Object.assign(pkg.fisherRealm,next);fs.writeFileSync(file,JSON.stringify(pkg,null,2)+'\n');console.log('Built content hashes and static preload graph for '+next.modules.length+' modules');}}
module.exports={metadata};if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
