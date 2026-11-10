(function(){
  'use strict';
  var d=document, w=window;
  var reduce=w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine=w.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $$=function(s){return [].slice.call(d.querySelectorAll(s))};

  // greeting rotator: Yo, Hello, Bonjour, Hi!
  var gs=$$('.greet .g'), gi=0;
  if(gs.length && !reduce){
    setInterval(function(){
      var cur=gs[gi]; gi=(gi+1)%gs.length; var nxt=gs[gi];
      cur.classList.remove('on'); cur.classList.add('out');
      nxt.classList.remove('out'); nxt.classList.add('on');
      setTimeout(function(){cur.classList.remove('out')},700);
    },2200);
  }

  // 3D tilt on value cards
  if(fine && !reduce){
    $$('.tilt').forEach(function(c){
      c.addEventListener('mousemove',function(e){
        var r=c.getBoundingClientRect(), x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
        c.style.transform='rotateY('+(x*14)+'deg) rotateX('+(-y*14)+'deg) translateY(-6px)';
      });
      c.addEventListener('mouseleave',function(){c.style.transform=''});
    });
  }

  // map: draw route when visible; link cards with pins
  var map=d.querySelector('.map');
  if(map){
    if('IntersectionObserver' in w && !reduce){
      var io=new IntersectionObserver(function(es){es.forEach(function(e){ if(e.isIntersecting){map.classList.add('in');io.unobserve(map);} })},{threshold:.4});
      io.observe(map);
    } else map.classList.add('in');
    $$('.loc').forEach(function(l){
      var pin=map.querySelector('.pin.'+l.dataset.pin);
      if(!pin) return;
      l.addEventListener('mouseenter',function(){pin.classList.add('hl')});
      l.addEventListener('mouseleave',function(){pin.classList.remove('hl')});
    });
  }
})();
