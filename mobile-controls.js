// Touch gestures and the hold button own separate pointers, so either finger can lift independently.
export function createMobileControls({canvas,fishing,blocked,onLook}){
  const button=document.querySelector('#mobile-action');
  let actionPointer=null,dragPointer=null,lastX=0,lastY=0,holding=false,lastLabel='';
  function stopHold(){holding=false;fishing.touchReel(false);button.classList.remove('holding');button.setAttribute('aria-pressed','false');}
  function release(){stopHold();actionPointer=dragPointer=null;update();}
  function update(){
    const state=fishing.inputState(),labels={idle:'抛竿',casting:'抛竿中',waiting:'等待咬钩',bite:'提竿',fighting:'收线',caught:'收竿中'};
    button.hidden=blocked();button.disabled=!['idle','bite','fighting'].includes(state);
    const label=labels[state]??'抛竿';if(label!==lastLabel){button.textContent=label;button.setAttribute('aria-label',state==='fighting'?'按住收线，松开停止':label);lastLabel=label;}
    if(state!=='fighting'&&holding)stopHold();
  }
  button.addEventListener('contextmenu',event=>event.preventDefault());
  button.addEventListener('pointerdown',event=>{
    if(blocked()||button.disabled||actionPointer!==null||(event.pointerType!=='touch'&&event.button!==0))return;
    event.preventDefault();actionPointer=event.pointerId;button.setPointerCapture(event.pointerId);
    const state=fishing.inputState();
    if(state==='idle'||state==='bite')fishing.key({code:'Space',repeat:false});
    if(fishing.isFighting()){holding=true;fishing.touchReel(true);button.classList.add('holding');button.setAttribute('aria-pressed','true');}
    update();
  });
  function endAction(event){if(event.pointerId!==actionPointer)return;actionPointer=null;stopHold();update();}
  for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,endAction);
  canvas.addEventListener('pointerdown',event=>{
    if(event.pointerType!=='touch'||blocked()||dragPointer!==null)return;
    event.preventDefault();dragPointer=event.pointerId;lastX=event.clientX;lastY=event.clientY;canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove',event=>{
    if(event.pointerId!==dragPointer||blocked())return;event.preventDefault();
    const dx=event.clientX-lastX,dy=event.clientY-lastY;lastX=event.clientX;lastY=event.clientY;
    if(fishing.isFighting())fishing.touchTurn(dx);else onLook(dx,dy);
  });
  function endDrag(event){if(event.pointerId===dragPointer)dragPointer=null;}
  for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,endDrag);
  window.addEventListener('blur',release);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)release();});
  window.addEventListener('pagehide',release);
  update();
  return {update,release,snapshot:()=>({holding,actionPointer,dragPointer})};
}
