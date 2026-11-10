(function(){
  'use strict';
  var d=document, w=window;
  var reduce=w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $=function(s){return d.querySelector(s)}, $$=function(s){return [].slice.call(d.querySelectorAll(s))};

  // feature cards: start their loops when visible
  var feats=$$('.pfeat');
  if('IntersectionObserver' in w && !reduce){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){ if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);} })},{threshold:.3});
    feats.forEach(function(f){io.observe(f)});
  } else feats.forEach(function(f){f.classList.add('in')});

  // showcase grows from 90% to 100% while scrolling into view
  var stage=$('.show-stage');
  if(stage && !reduce){
    var t=false;
    var upd=function(){
      t=false;
      var r=stage.getBoundingClientRect(), vh=w.innerHeight;
      var p=Math.min(Math.max((vh - r.top)/(vh*.9),0),1);
      stage.style.setProperty('--s',(0.9+0.1*p).toFixed(4));
      stage.style.setProperty('--ty',((1-p)*40).toFixed(1)+'px');
    };
    w.addEventListener('scroll',function(){ if(!t){t=true;requestAnimationFrame(upd);} },{passive:true});
    w.addEventListener('resize',upd); upd();
  } else if(stage){ stage.style.setProperty('--s',1); }

  // gallery: buttons, drag to scroll, progress
  var gw=$('.gal-wrap'), prog=$('.gal-prog');
  if(!gw) return;
  function setProg(){
    var max=gw.scrollWidth-gw.clientWidth;
    var vis=gw.clientWidth/gw.scrollWidth;
    var p=max>0?gw.scrollLeft/max:1;
    if(prog) prog.style.setProperty('--gp',(vis+(1-vis)*p).toFixed(3));
  }
  gw.addEventListener('scroll',setProg,{passive:true}); w.addEventListener('resize',setProg); setProg();
  $$('.gal-btn').forEach(function(b){
    b.addEventListener('click',function(){
      var shot=gw.querySelector('.shot');
      gw.scrollBy({left:(+b.dataset.dir)*(shot?shot.offsetWidth+28:400),behavior:reduce?'auto':'smooth'});
    });
  });
  gw.addEventListener('keydown',function(e){
    if(e.key==='ArrowRight'){gw.scrollBy({left:300,behavior:'smooth'});e.preventDefault();}
    if(e.key==='ArrowLeft'){gw.scrollBy({left:-300,behavior:'smooth'});e.preventDefault();}
  });
  var down=false,sx=0,sl=0,moved=false;
  gw.addEventListener('pointerdown',function(e){ if(e.pointerType!=='mouse') return; down=true;moved=false;sx=e.clientX;sl=gw.scrollLeft;gw.classList.add('drag'); });
  w.addEventListener('pointermove',function(e){ if(!down) return; var dx=e.clientX-sx; if(Math.abs(dx)>3) moved=true; gw.scrollLeft=sl-dx; });
  w.addEventListener('pointerup',function(){ if(!down) return; down=false; gw.classList.remove('drag'); });
  gw.addEventListener('click',function(e){ if(moved){e.preventDefault();e.stopPropagation();} },true);
})();
