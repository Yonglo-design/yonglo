(function(){
  'use strict';
  var d=document, w=window;
  var reduce=w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $=function(s){return d.querySelector(s)}, $$=function(s){return [].slice.call(d.querySelectorAll(s))};
  function onView(els, cls, thr){
    if('IntersectionObserver' in w && !reduce){
      var io=new IntersectionObserver(function(es){es.forEach(function(e){ if(e.isIntersecting){e.target.classList.add(cls);io.unobserve(e.target);} })},{threshold:thr||.3});
      els.forEach(function(el){io.observe(el)});
    } else els.forEach(function(el){el.classList.add(cls)});
  }
  onView($$('.feat, .journey, .dash'),'in');

  // hero shop: products fly into the cart, orders come in
  var shop=$('.shop'), prods=$$('.prod'), cart=$('.cart'), cn=$('.cart-n'), fly=$('.fly'), toast=$('.ec-toast');
  if(shop && prods.length && !reduce){
    var n=0, i=0;
    var tick=function(){
      if(d.hidden) return;
      var p=prods[i%prods.length]; i++;
      p.classList.add('adding');
      var sr=shop.getBoundingClientRect(), br=p.querySelector('button').getBoundingClientRect(), cr=cart.getBoundingClientRect();
      var x0=br.left-sr.left+br.width/2-6, y0=br.top-sr.top+br.height/2-6, x1=cr.left-sr.left+cr.width/2-6, y1=cr.top-sr.top+cr.height/2-6;
      if(fly.animate){
        fly.animate([
          {opacity:1,transform:'translate('+x0+'px,'+y0+'px) scale(1)'},
          {opacity:1,transform:'translate('+((x0+x1)/2)+'px,'+(Math.min(y0,y1)-60)+'px) scale(1.3)',offset:.5},
          {opacity:0,transform:'translate('+x1+'px,'+y1+'px) scale(.5)'}
        ],{duration:800,easing:'cubic-bezier(.22,1,.36,1)'});
      }
      setTimeout(function(){
        n++; cn.textContent=n; cart.classList.remove('bump'); void cart.offsetWidth; cart.classList.add('bump');
        p.classList.remove('adding');
        if(n%3===0){ toast.classList.add('show'); setTimeout(function(){toast.classList.remove('show'); n=0; cn.textContent=0;},2200); }
      },780);
    };
    setTimeout(function(){ tick(); setInterval(tick,2000); },1800);
  }

  // checkout demo
  var pc=$('.paycard');
  if(pc){
    var label=pc.querySelector('.pc-m');
    pc.querySelectorAll('input[name=pm]').forEach(function(r){
      r.addEventListener('change',function(){ label.textContent = r.value==='creditcard' ? 'creditcard' : r.value; });
    });
    pc.querySelector('.pc-btn').addEventListener('click',function(){
      pc.classList.add('paid');
      setTimeout(function(){pc.classList.remove('paid')},2600);
    });
  }

  // dashboard: orders flip from "Betaald" to "Verzonden"
  var sts=$$('.dash .st');
  if(sts.length && !reduce){
    var k=0;
    setInterval(function(){
      if(d.hidden) return;
      var s=sts[k%sts.length]; k++;
      var sent=s.classList.toggle('sent');
      s.textContent= sent ? 'Verzonden' : 'Betaald';
    },1400);
  }
})();
