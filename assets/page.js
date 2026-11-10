(function(){
  'use strict';
  var d=document, w=window;
  var reduce=w.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // reveal for subpage cards that carry their own .in animations
  var els=[].slice.call(d.querySelectorAll('.feat, .duo-card'));
  if('IntersectionObserver' in w && !reduce){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){ if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);} })},{threshold:.3});
    els.forEach(function(el){io.observe(el)});
  } else els.forEach(function(el){el.classList.add('in')});

  // responsive demo: device switcher with auto-play
  var btns=[].slice.call(d.querySelectorAll('.dev-btns button')), ind=d.querySelector('.dev-ind'), screen=d.querySelector('.screen');
  if(!btns.length||!screen) return;
  var order=['desk','tab','mob'], cur=0, timer=null, userPicked=false;
  function move(b){ ind.style.width=b.offsetWidth+'px'; ind.style.transform='translateX('+(b.offsetLeft-4)+'px)'; }
  function set(i){
    cur=i;
    btns.forEach(function(b,j){b.setAttribute('aria-selected', j===i ? 'true':'false')});
    screen.className='screen '+order[i];
    move(btns[i]);
  }
  btns.forEach(function(b,i){ b.addEventListener('click',function(){ userPicked=true; clearInterval(timer); set(i); }); });
  set(0);
  w.addEventListener('resize',function(){move(btns[cur])});
  if(d.fonts&&d.fonts.ready) d.fonts.ready.then(function(){move(btns[cur])});
  if(!reduce && 'IntersectionObserver' in w){
    var stage=d.querySelector('.devices-sec');
    new IntersectionObserver(function(es){
      es.forEach(function(e){
        clearInterval(timer);
        if(e.isIntersecting && !userPicked){ timer=setInterval(function(){ set((cur+1)%order.length); },2600); }
      });
    },{threshold:.4}).observe(stage);
  }
})();
