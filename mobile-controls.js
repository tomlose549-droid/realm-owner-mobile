// Steering and the hold button own separate touch pointers across all maps.
export function createMobileControls({canvas,fishing,blocked,onLook}){
 const button=document.querySelector('#mobile-action');let actionPointer=null,dragPointer=null,lastX=0,lastY=0,holding=false,lastLabel='';
 function stopHold(){holding=false;fishing.touchReel(false);button.classList.remove('holding');button.setAttribute('aria-pressed','false');}
 function release(){stopHold();actionPointer=dragPointer=null;update();}
 function update(){
  const state=fishing.inputState(),canCast=fishing.canTouchCast(),labels={casting:'抛竿中',waiting:canCast?'再抛一竿':'静候咬钩',bite:canCast?'再抛一竿':'点咬钩竿',fighting:'收线','net-ready':'点水波抄鱼','net-scooping':'抄鱼中','net-struggling':'确认抄起',caught:'收竿中',idle:'抛竿'};
  button.hidden=blocked();button.disabled=!(canCast||state==='fighting'||state==='net-struggling');
  const label=labels[state]??'抛竿';if(label!==lastLabel){button.textContent=label;button.setAttribute('aria-label',state==='fighting'?'按住收线，松开停止':label);lastLabel=label;}
  if(state!=='fighting'&&holding)stopHold();
 }
 button.addEventListener('contextmenu',e=>e.preventDefault());
 button.addEventListener('pointerdown',e=>{
  if(blocked()||button.disabled||actionPointer!==null||(e.pointerType!=='touch'&&e.button!==0))return;
  e.preventDefault();actionPointer=e.pointerId;button.setPointerCapture(e.pointerId);
  if(fishing.inputState()==='net-struggling')fishing.touchTap(e);
  else if(fishing.canTouchCast())fishing.key({code:'Space',repeat:false});
  else if(fishing.isFighting()){holding=true;fishing.touchReel(true);button.classList.add('holding');button.setAttribute('aria-pressed','true');}
  update();
 });
 function endAction(e){if(e.pointerId!==actionPointer)return;actionPointer=null;stopHold();update();}
 for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,endAction);
 canvas.addEventListener('pointerdown',e=>{
  if(e.pointerType!=='touch'||blocked()||dragPointer!==null)return;e.preventDefault();
  if(fishing.touchTap(e))return;
  dragPointer=e.pointerId;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId);
 });
 canvas.addEventListener('pointermove',e=>{
  if(e.pointerId!==dragPointer||blocked())return;e.preventDefault();const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;
  if(fishing.isFighting())fishing.touchTurn(dx);else onLook(dx,dy);
 });
 function endDrag(e){if(e.pointerId===dragPointer)dragPointer=null;}
 for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,endDrag);
 window.addEventListener('blur',release);document.addEventListener('visibilitychange',()=>{if(document.hidden)release();});window.addEventListener('pagehide',release);update();
 return {update,release,snapshot:()=>({holding,actionPointer,dragPointer})};
}
