(function(){
  'use strict';
  var d=document, w=window;
  var reduce=w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $$=function(s){return [].slice.call(d.querySelectorAll(s))};

  // case visuals: reveal + gentle scroll parallax
  var cases=$$('.case-vis');
  if('IntersectionObserver' in w && !reduce){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){ if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);} })},{threshold:.3});
    cases.forEach(function(c){io.observe(c)});
  } else cases.forEach(function(c){c.classList.add('in')});
  if(!reduce){
    var tick=false;
    w.addEventListener('scroll',function(){
      if(tick) return; tick=true;
      requestAnimationFrame(function(){
        tick=false;
        if(w.innerWidth<768) return;
        var vh=w.innerHeight;
        cases.forEach(function(c){
          var r=c.getBoundingClientRect();
          if(r.bottom<0||r.top>vh) return;
          var p=(r.top+r.height/2-vh/2)/vh; // -1..1
          c.style.setProperty('--py',(p*-30).toFixed(1)+'px');
        });
      });
    },{passive:true});
  }

  // filters
  var btns=$$('.fbtn'), cards=$$('.pcard'), empty=d.querySelector('.pf-empty');
  function matches(c,f){ return f==='all' || (' '+c.dataset.cat+' ').indexOf(' '+f+' ')>-1; }
  btns.forEach(function(b){
    var n=cards.filter(function(c){return !c.classList.contains('pcard-cta') && matches(c,b.dataset.f)}).length;
    var sup=b.querySelector('sup'); if(sup) sup.textContent=n;
  });
  var busy=null;
  function apply(f){
    clearTimeout(busy);
    cards.forEach(function(c){ if(!matches(c,f)) c.classList.add('out'); });
    busy=setTimeout(function(){
      var shown=0;
      cards.forEach(function(c){
        if(matches(c,f)){
          c.classList.remove('gone'); c.classList.add('out');
          (function(el,i){ setTimeout(function(){el.classList.remove('out')},i*55+20); })(c,shown++);
        } else c.classList.add('gone');
      });
      if(empty) empty.hidden = shown>1;
    }, reduce?0:300);
  }
  btns.forEach(function(b){
    b.addEventListener('click',function(){
      btns.forEach(function(x){x.setAttribute('aria-pressed', x===b?'true':'false')});
      apply(b.dataset.f);
    });
  });

  // grid cards: staggered entrance
  if('IntersectionObserver' in w && !reduce){
    cards.forEach(function(c,i){ c.classList.add('out'); c.style.transitionDelay=((i%3)*80)+'ms'; });
    var gio=new IntersectionObserver(function(es){es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.remove('out'); var t=e.target; setTimeout(function(){t.style.transitionDelay=''},700); gio.unobserve(t);} })},{threshold:.15});
    cards.forEach(function(c){gio.observe(c)});
  }
})();
