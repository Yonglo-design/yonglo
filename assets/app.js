(function(){
  'use strict';
  var d=document, w=window;
  var reduce=w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine=w.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $=function(s,c){return (c||d).querySelector(s)}, $$=function(s,c){return Array.prototype.slice.call((c||d).querySelectorAll(s))};

  // year
  $$('.yr').forEach(function(e){e.textContent=new Date().getFullYear()});

  // split headline into words
  $$('.split').forEach(function(h){
    var i=0;
    (function walk(node){
      Array.prototype.slice.call(node.childNodes).forEach(function(n){
        if(n.nodeType===3){
          var frag=d.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function(part){
            if(!part) return;
            if(/^\s+$/.test(part)){frag.appendChild(d.createTextNode(' '));return;}
            var o=d.createElement('span');o.className='w';
            var s=d.createElement('span');s.textContent=part;s.style.setProperty('--i',i++);
            o.appendChild(s);frag.appendChild(o);
          });
          node.replaceChild(frag,n);
        } else if(n.nodeType===1){ walk(n); }
      });
    })(h);
    requestAnimationFrame(function(){requestAnimationFrame(function(){h.classList.add('in')})});
  });

  // reveal on scroll
  var revealEls=$$('.rv, .panel');
  if('IntersectionObserver' in w && !reduce){
    var io=new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target);} });
    },{threshold:.18, rootMargin:'0px 0px -6% 0px'});
    revealEls.forEach(function(el){io.observe(el)});
  } else revealEls.forEach(function(el){el.classList.add('in')});

  // counters
  function count(el){
    var to=+el.dataset.to, t0=null, dur=1400;
    function step(t){ if(!t0)t0=t; var p=Math.min((t-t0)/dur,1); p=1-Math.pow(1-p,3); el.textContent=Math.round(to*p); if(p<1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }
  var counters=$$('.count');
  if('IntersectionObserver' in w && !reduce){
    var co=new IntersectionObserver(function(es){es.forEach(function(e){ if(e.isIntersecting){count(e.target);co.unobserve(e.target);} })},{threshold:.6});
    counters.forEach(function(c){co.observe(c)});
  } else counters.forEach(function(c){c.textContent=c.dataset.to});

  // header, progress, floating buttons, rail, timeline
  var hdr=$('.hdr'), prog=$('.progress'), wa=$('.float-wa'), mob=$('.mobbar');
  var work=$('.work'), pin=$('.work-pin'), rail=$('.rail'), railWrap=$('.rail-wrap');
  var tl=$('.timeline'), fill=$('.tl-fill'), steps=$$('.step');
  var desktopRail=function(){return w.innerWidth>1023 && !reduce};

  function sizeWork(){
    if(!work) return;
    if(desktopRail()){
      var extra=Math.max(0, rail.scrollWidth - railWrap.clientWidth);
      work.style.height=(pin.offsetHeight + extra*(parseFloat(rail.dataset.speed)||1))+'px';
    } else { work.style.height=''; rail.style.transform=''; }
  }

  var ticking=false;
  function onScroll(){
    if(ticking) return; ticking=true;
    requestAnimationFrame(function(){
      ticking=false;
      var y=w.scrollY, vh=w.innerHeight, H=d.documentElement.scrollHeight-vh;
      hdr.classList.toggle('scrolled', y>80);
      prog.style.transform='scaleX('+(H>0?y/H:0)+')';
      var show=y>600; if(wa) wa.classList.toggle('show',show); if(mob) mob.classList.toggle('show',y>300);

      if(work && desktopRail()){
        var r=work.getBoundingClientRect();
        var travel=work.offsetHeight - pin.offsetHeight;
        var p=travel>0 ? Math.min(Math.max(-r.top/travel,0),1) : 0;
        var max=Math.max(0, rail.scrollWidth - railWrap.clientWidth);
        rail.style.transform='translate3d('+(-p*max)+'px,0,0)';
      }
      if(tl){
        var tr=tl.getBoundingClientRect();
        var start=vh*.8, end=vh*.35;
        var tp=Math.min(Math.max((start-tr.top)/(tr.height+start-end),0),1);
        if(reduce) tp=1;
        fill.style.setProperty('--p',tp);
        steps.forEach(function(s,i){ s.classList.toggle('on', tp >= (i/steps.length)+.05 || tp===1); });
      }
    });
  }
  w.addEventListener('scroll',onScroll,{passive:true});
  w.addEventListener('resize',function(){sizeWork();onScroll();});
  w.addEventListener('load',function(){sizeWork();onScroll();});
  if(d.fonts&&d.fonts.ready) d.fonts.ready.then(function(){sizeWork();onScroll();});
  sizeWork(); onScroll();

  // mega menu
  var mega=$('.has-mega'), mbtn=$('.nav-btn');
  if(mega){
    var closeT;
    var open=function(){clearTimeout(closeT);mega.classList.add('open');mbtn.setAttribute('aria-expanded','true')};
    var close=function(){mega.classList.remove('open');mbtn.setAttribute('aria-expanded','false')};
    if(fine){ mega.addEventListener('mouseenter',open); mega.addEventListener('mouseleave',function(){closeT=setTimeout(close,180)}); }
    mbtn.addEventListener('click',function(){ mega.classList.contains('open')?close():open(); });
    $$('#mega a').forEach(function(a){a.addEventListener('click',close)});
    d.addEventListener('keydown',function(e){ if(e.key==='Escape') close(); });
    d.addEventListener('click',function(e){ if(!mega.contains(e.target)) close(); });
  }

  // mobile menu
  var burger=$('.burger'), mm=$('#mobmenu');
  function setMenu(on){
    burger.setAttribute('aria-expanded',on); burger.setAttribute('aria-label',on?'Menu sluiten':'Menu openen');
    if(on){ mm.hidden=false; d.body.style.overflow='hidden'; hdr.classList.add('scrolled'); }
    else { mm.hidden=true; d.body.style.overflow=''; onScroll(); }
  }
  burger.addEventListener('click',function(){ setMenu(mm.hidden); });
  $$('#mobmenu a').forEach(function(a){a.addEventListener('click',function(){setMenu(false)})});

  // magnetic buttons + spotlight cards
  if(fine && !reduce){
    $$('.spot').forEach(function(c){
      c.addEventListener('mousemove',function(e){
        var r=c.getBoundingClientRect();
        c.style.setProperty('--mx',(e.clientX-r.left)+'px'); c.style.setProperty('--my',(e.clientY-r.top)+'px');
      });
    });
    // hero parallax tilt
    var hero=$('.hero'), stack=$('.stack');
    if(hero&&stack){
      hero.addEventListener('mousemove',function(e){
        var x=(e.clientX/w.innerWidth-.5), y=(e.clientY/w.innerHeight-.5);
        stack.style.transform='rotateY('+x*8+'deg) rotateX('+(-y*8)+'deg) translate('+x*-14+'px,'+y*-14+'px)';
      });
      hero.addEventListener('mouseleave',function(){stack.style.transform=''});
      stack.style.transition='transform .6s cubic-bezier(.22,1,.36,1)';
    }
  }

  // tabs
  var ind=$('.tab-ind'), tbtns=$$('.tab-btns button');
  function moveInd(b){ if(!ind) return; ind.style.width=b.offsetWidth+'px'; ind.style.transform='translateX('+(b.offsetLeft-4)+'px)'; }
  tbtns.forEach(function(b){
    b.addEventListener('click',function(){
      tbtns.forEach(function(x){x.setAttribute('aria-selected','false')});
      b.setAttribute('aria-selected','true');
      $$('.tab-panel').forEach(function(p){p.classList.remove('active')});
      $('#'+b.dataset.tab).classList.add('active');
      moveInd(b);
    });
  });
  var sel=$('.tab-btns [aria-selected=true]'); if(sel){ moveInd(sel); w.addEventListener('resize',function(){moveInd($('.tab-btns [aria-selected=true]'))}); if(d.fonts&&d.fonts.ready) d.fonts.ready.then(function(){moveInd($('.tab-btns [aria-selected=true]'))}); }

  // toast
  var toast=$('.toast'), toastT;
  function say(msg){ toast.textContent=msg; toast.classList.add('show'); clearTimeout(toastT); toastT=setTimeout(function(){toast.classList.remove('show')},3200); }

  // copy e-mail on click (keeps mailto as fallback)
  $$('.copy').forEach(function(a){
    a.addEventListener('click',function(){
      if(navigator.clipboard){ navigator.clipboard.writeText(a.dataset.copy).then(function(){say('E-mailadres gekopieerd')}).catch(function(){}); }
    });
  });

  // formulieren -> Wix Forms (e-mailmelding naar Yonglo), daarna naar de bedanktpagina
  function labelOf(el){
    var fs=el.closest('fieldset'); if(fs&&fs.querySelector('legend')) return fs.querySelector('legend').textContent.trim();
    var l=el.closest('label'); var sp=l&&l.querySelector('span'); if(sp&&sp.textContent.trim()) return sp.textContent.trim();
    return el.name.charAt(0).toUpperCase()+el.name.slice(1);
  }
  function thanksType(f){
    if(f.dataset.thanks) return f.dataset.thanks;
    var s=(f.dataset.subject||'').toLowerCase();
    if(/seo/.test(s)) return 'seo-scan'; if(/offerte/.test(s)) return 'offerte'; if(/terugbel/.test(s)) return 'terugbellen';
    if(/optimaal/.test(s)) return 'optimaal'; if(/ecommerce/.test(s)) return 'ecommerce'; if(/webdesign/.test(s)) return 'webdesign';
    if(/branding/.test(s)) return 'branding'; if(/wix websites/.test(s)) return 'wix'; if(/development/.test(s)) return 'development';
    if(/^ai /.test(s)) return 'ai'; if(/api/.test(s)) return 'api'; if(/project|nieuws/.test(s)) return 'project';
    return 'kennismaking';
  }
  function mailtoFallback(f){
    var data=new FormData(f), lines=[];
    data.forEach(function(v,k){ lines.push(k.charAt(0).toUpperCase()+k.slice(1)+': '+v); });
    w.location.href='mailto:contact@yonglo.com?subject='+encodeURIComponent(f.dataset.subject||'Aanvraag via website')+'&body='+encodeURIComponent(lines.join('\n'));
  }
  $$('form').forEach(function(f){
    f.addEventListener('submit',function(e){
      e.preventDefault();
      if(f.dataset.busy) return;
      if(!f.checkValidity()){ f.reportValidity(); return; }
      var v=function(n){ var el=f.elements[n]; return el&&el.value?el.value.trim():''; };
      var naam=v('naam')||[v('voornaam'),v('achternaam')].filter(Boolean).join(' ');
      var skip={naam:1,voornaam:1,achternaam:1,email:1,telefoon:1,website:1,url:1};
      var lines=[], detail='', seen={};
      [].forEach.call(f.elements,function(el){
        if(!el.name||skip[el.name]||seen[el.name]) return;
        if((el.type==='radio'||el.type==='checkbox')&&!el.checked) return;
        if(!el.value||!el.value.trim()) return;
        if(el.type==='radio'){ seen[el.name]=1; if(!detail) detail=el.value; }
        lines.push(labelOf(el)+': '+el.value.trim());
      });
      var payload={ formulier:(f.dataset.subject||'Aanvraag via website').replace(/&amp;/g,'&'), naam:naam, email:v('email'),
        telefoon:v('telefoon'), website:v('website')||v('url'), aanvraag:lines.join('\n'), pagina:location.pathname };
      var btn=f.querySelector('button[type=submit],button:not([type])'), label=btn?btn.innerHTML:'';
      f.dataset.busy='1'; if(btn){ btn.disabled=true; btn.textContent='Versturen…'; }
      var type=thanksType(f);
      import('/assets/wix/forms-submit.js').then(function(m){ return m.submitWebsiteForm(payload); }).then(function(){
        try{ sessionStorage.setItem('yl-thanks',JSON.stringify({type:type,naam:(naam||'').split(' ')[0],detail:detail,website:payload.website})); }catch(_){}
        w.location.href='/bedankt.html?f='+encodeURIComponent(type);
      }).catch(function(err){
        if(w.console) console.error(err);
        delete f.dataset.busy; if(btn){ btn.disabled=false; btn.innerHTML=label; }
        say('Versturen lukte niet. Je mailprogramma opent als alternatief.');
        setTimeout(function(){ mailtoFallback(f); },900);
      });
    });
  });
})();

// Diensten-menu: de afbeelding rechts wisselt mee met de dienst waar de bezoeker naar wijst.
(function(){
  var d=document, feat=d.querySelector('#mega .mega-feat');
  if(!feat) return;
  var links=[].slice.call(d.querySelectorAll('#mega .mega-col a'));
  if(!links.length) return;

  function g(id,a,b){return '<defs><linearGradient id="'+id+'" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="'+a+'"/><stop offset="1" stop-color="'+b+'"/></linearGradient></defs><rect width="320" height="200" fill="url(#'+id+')"/>';}
  var W='#fff', INK='#0E0F1A';
  var V={
    webdesign: g('mg1','#325FFC','#99AFFE')+
      '<rect x="40" y="26" width="240" height="152" rx="12" fill="'+W+'"/>'+
      '<circle cx="54" cy="38" r="3" fill="#FF7A59"/><circle cx="64" cy="38" r="3" fill="#FFC857"/><circle cx="74" cy="38" r="3" fill="#5EEAD4"/>'+
      '<rect x="40" y="49" width="240" height="1" fill="'+INK+'" opacity=".08"/>'+
      '<rect x="56" y="62" width="116" height="10" rx="5" fill="'+INK+'"/><rect x="56" y="78" width="92" height="6" rx="3" fill="'+INK+'" opacity=".25"/><rect x="56" y="88" width="70" height="6" rx="3" fill="'+INK+'" opacity=".25"/>'+
      '<rect x="56" y="102" width="54" height="16" rx="8" fill="#325FFC"/>'+
      '<rect x="188" y="58" width="76" height="62" rx="8" fill="#7A97FD" opacity=".55"/><circle cx="210" cy="78" r="7" fill="'+W+'" opacity=".8"/><path d="M188 120l26-24 18 16 12-10 20 18z" fill="#325FFC" opacity=".7"/>'+
      '<rect x="56" y="132" width="64" height="34" rx="6" fill="#EEF0FF"/><rect x="128" y="132" width="64" height="34" rx="6" fill="#EEF0FF"/><rect x="200" y="132" width="64" height="34" rx="6" fill="#EEF0FF"/>',
    ecommerce: g('mg2','#FF7A59','#FFB36B')+
      '<rect x="36" y="32" width="104" height="138" rx="14" fill="'+W+'"/><rect x="46" y="42" width="84" height="70" rx="9" fill="#FFE6DC"/><circle cx="88" cy="77" r="20" fill="#FF7A59" opacity=".85"/><rect x="46" y="122" width="62" height="7" rx="3.5" fill="'+INK+'" opacity=".8"/><rect x="46" y="134" width="40" height="6" rx="3" fill="'+INK+'" opacity=".25"/><rect x="46" y="148" width="44" height="14" rx="7" fill="#FF7A59"/>'+
      '<rect x="152" y="48" width="104" height="138" rx="14" fill="'+W+'"/><rect x="162" y="58" width="84" height="70" rx="9" fill="#EEF0FF"/><rect x="186" y="74" width="36" height="40" rx="6" fill="#325FFC" opacity=".8"/><rect x="162" y="138" width="62" height="7" rx="3.5" fill="'+INK+'" opacity=".8"/><rect x="162" y="150" width="40" height="6" rx="3" fill="'+INK+'" opacity=".25"/><rect x="162" y="164" width="44" height="14" rx="7" fill="#FF7A59"/>'+
      '<circle cx="270" cy="40" r="24" fill="'+W+'"/><path d="M256 31h5l4 15h13l3-10h-18" fill="none" stroke="#FF7A59" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="267" cy="51" r="2.4" fill="#FF7A59"/><circle cx="277" cy="51" r="2.4" fill="#FF7A59"/>'+
      '<circle cx="286" cy="24" r="9" fill="'+INK+'"/><text x="286" y="28" text-anchor="middle" font-family="Outfit,sans-serif" font-size="11" font-weight="700" fill="'+W+'">3</text>',
    wix: g('mg3','#116DFF','#325FFC')+
      '<circle cx="270" cy="34" r="60" fill="'+W+'" opacity=".08"/><circle cx="40" cy="180" r="70" fill="'+W+'" opacity=".07"/>'+
      '<g transform="translate(74 50) scale(1.28)" fill="'+W+'"><path d="M61.1,6.3c-2.1,1.8-2.7,4.8-2.7,4.8l-6.9,26.7l-5.7-21.9c-0.6-2.3-1.6-5.2-3.2-7.1c-2-2.5-6.2-2.6-6.6-2.6c-0.4,0-4.6,0.2-6.6,2.6c-1.6,1.9-2.6,4.8-3.2,7.1l-5.7,21.9l-6.9-26.7c0,0-0.6-2.9-2.7-4.8C7.5,3.4,2.5,4,2.5,4l13.2,50c0,0,4.4,0.3,6.5-0.8c2.9-1.5,4.2-2.6,6-9.4c1.5-6.1,5.9-23.9,6.3-25.1c0.2-0.6,0.5-2.1,1.6-2.1c1.1,0,1.4,1.5,1.6,2.1c0.4,1.3,4.7,19.1,6.3,25.1c1.7,6.8,3.1,7.9,6,9.4c2.2,1.1,6.5,0.8,6.5,0.8L69.5,4C69.5,4,64.5,3.4,61.1,6.3z"/><path d="M81.7,4.6C81.7,4.6,81.7,4.6,81.7,4.6c0-0.2,0-0.4,0-0.7c0,0-3.5-0.1-5.5,0.9c-2,1-3,2.7-3.4,6.3c-0.1,0.4-0.1,0.8-0.1,1.2v8.2v2.6v0.1v0.6v30c0,0,3.3,0.4,5.5-0.7c2.8-1.4,3.5-2.8,3.5-9V14l0,0V4.6z"/><path d="M114.7,29.1l16.8-24.9c0,0-7.1-1.2-10.6,2c-2.2,2-4.7,5.7-4.7,5.7l-6.2,8.9c-0.3,0.5-0.7,1-1.3,1s-1-0.5-1.3-1l-6.2-8.9c0,0-2.5-3.7-4.7-5.7c-3.5-3.2-10.6-2-10.6-2l16.8,24.9L85.8,53.9c0,0,7.4,0.9,10.9-2.3c2.2-2,4.4-5.4,4.4-5.4l6.2-8.9c0.3-0.5,0.7-1,1.3-1s1,0.5,1.3,1l6.2,8.9c0,0,2.3,3.3,4.5,5.4c3.5,3.2,10.7,2.3,10.7,2.3L114.7,29.1z"/></g>'+
      '<rect x="108" y="146" width="104" height="24" rx="12" fill="'+W+'" opacity=".2"/><text x="160" y="162" text-anchor="middle" font-family="Outfit,sans-serif" font-size="11" font-weight="600" letter-spacing="1.2" fill="'+W+'">WIX PARTNER</text>',
    seo: g('mg4','#0EA5A0','#325FFC')+
      '<rect x="40" y="22" width="240" height="32" rx="16" fill="'+W+'"/><circle cx="60" cy="37" r="6.5" fill="none" stroke="#0EA5A0" stroke-width="2.4"/><path d="M65 42l5 5" stroke="#0EA5A0" stroke-width="2.4" stroke-linecap="round"/><rect x="80" y="33" width="128" height="8" rx="4" fill="'+INK+'" opacity=".2"/>'+
      '<rect x="56" y="150" width="28" height="34" rx="6" fill="'+W+'" opacity=".3"/><rect x="96" y="136" width="28" height="48" rx="6" fill="'+W+'" opacity=".45"/><rect x="136" y="118" width="28" height="66" rx="6" fill="'+W+'" opacity=".6"/><rect x="176" y="100" width="28" height="84" rx="6" fill="'+W+'" opacity=".78"/><rect x="216" y="80" width="28" height="104" rx="6" fill="'+W+'"/>'+
      '<path d="M70 140L110 124L150 106L190 88L230 66" fill="none" stroke="'+W+'" stroke-width="2" stroke-dasharray="4 5" opacity=".7"/>'+
      '<rect x="252" y="60" width="40" height="22" rx="11" fill="'+INK+'"/><text x="272" y="75" text-anchor="middle" font-family="Outfit,sans-serif" font-size="12" font-weight="700" fill="'+W+'">#1</text>',
    optimaal: g('mg5','#7A97FD','#FF7A59')+
      '<path d="M86 138A74 74 0 0 1 234 138" fill="none" stroke="'+W+'" stroke-opacity=".25" stroke-width="14" stroke-linecap="round"/>'+
      '<path d="M86 138A74 74 0 0 1 234 138" fill="none" stroke="'+W+'" stroke-width="14" stroke-linecap="round" pathLength="100" stroke-dasharray="96 100"/>'+
      '<text x="160" y="132" text-anchor="middle" font-family="Outfit,sans-serif" font-size="46" font-weight="700" fill="'+W+'">98</text>'+
      '<text x="160" y="156" text-anchor="middle" font-family="Outfit,sans-serif" font-size="11" font-weight="600" letter-spacing="1.4" fill="'+W+'" opacity=".8">PERFORMANCE</text>'+
      '<rect x="218" y="26" width="72" height="24" rx="12" fill="'+W+'"/><text x="254" y="42" text-anchor="middle" font-family="Outfit,sans-serif" font-size="11.5" font-weight="700" fill="#FF7A59">↑ sneller</text>'+
      '<rect x="30" y="26" width="60" height="24" rx="12" fill="'+INK+'" opacity=".85"/><text x="60" y="42" text-anchor="middle" font-family="Outfit,sans-serif" font-size="11.5" font-weight="700" fill="'+W+'">Upgrade</text>',
    branding: g('mg6','#FF5C8A','#FF9F6B')+
      '<text x="48" y="128" font-family="Outfit,sans-serif" font-weight="600" font-size="96" fill="'+W+'">Aa</text>'+
      '<rect x="180" y="34" width="44" height="44" rx="12" fill="'+W+'"/><rect x="232" y="34" width="44" height="44" rx="12" fill="'+INK+'"/><rect x="180" y="86" width="44" height="44" rx="12" fill="#FFE45C"/><rect x="232" y="86" width="44" height="44" rx="12" fill="#325FFC"/>'+
      '<rect x="48" y="150" width="228" height="8" rx="4" fill="'+W+'" opacity=".45"/><rect x="48" y="164" width="150" height="8" rx="4" fill="'+W+'" opacity=".28"/>',
    development: g('mg7','#1B1D2E','#3B3F9E')+
      '<rect x="34" y="24" width="252" height="152" rx="12" fill="'+INK+'" stroke="'+W+'" stroke-opacity=".1"/>'+
      '<circle cx="48" cy="38" r="3" fill="#FF7A59"/><circle cx="58" cy="38" r="3" fill="#FFC857"/><circle cx="68" cy="38" r="3" fill="#5EEAD4"/>'+
      '<g opacity=".95"><rect x="50" y="58" width="36" height="7" rx="3.5" fill="#7A97FD"/><rect x="92" y="58" width="60" height="7" rx="3.5" fill="'+W+'" opacity=".6"/>'+
      '<rect x="66" y="74" width="44" height="7" rx="3.5" fill="#FF7A59"/><rect x="116" y="74" width="80" height="7" rx="3.5" fill="#5EEAD4"/>'+
      '<rect x="82" y="90" width="30" height="7" rx="3.5" fill="#7A97FD"/><rect x="118" y="90" width="96" height="7" rx="3.5" fill="'+W+'" opacity=".45"/>'+
      '<rect x="82" y="106" width="58" height="7" rx="3.5" fill="#FFC857"/><rect x="146" y="106" width="40" height="7" rx="3.5" fill="'+W+'" opacity=".45"/>'+
      '<rect x="66" y="122" width="22" height="7" rx="3.5" fill="#FF7A59"/><rect x="50" y="138" width="14" height="7" rx="3.5" fill="#7A97FD"/></g>'+
      '<rect x="214" y="144" width="56" height="22" rx="11" fill="#325FFC"/><text x="242" y="159" text-anchor="middle" font-family="Outfit,sans-serif" font-size="12" font-weight="700" fill="'+W+'">&lt;/&gt;</text>',
    ai: g('mg8','#6D3AED','#325FFC')+
      '<rect x="148" y="28" width="132" height="32" rx="16" fill="'+W+'" opacity=".22"/><rect x="164" y="40" width="96" height="7" rx="3.5" fill="'+W+'" opacity=".8"/>'+
      '<rect x="36" y="74" width="178" height="62" rx="16" fill="'+W+'"/><circle cx="58" cy="94" r="10" fill="#6D3AED"/><path d="M58 87c.8 4 2.6 5.8 6.6 6.6c-4 .8-5.8 2.6-6.6 6.6c-.8-4-2.6-5.8-6.6-6.6c4-.8 5.8-2.6 6.6-6.6z" fill="'+W+'"/>'+
      '<rect x="76" y="89" width="118" height="7" rx="3.5" fill="#6D3AED" opacity=".85"/><rect x="76" y="102" width="96" height="7" rx="3.5" fill="'+INK+'" opacity=".2"/><rect x="76" y="115" width="70" height="7" rx="3.5" fill="'+INK+'" opacity=".2"/>'+
      '<path d="M256 104c2.6 18 9 24.4 27 27c-18 2.6-24.4 9-27 27c-2.6-18-9-24.4-27-27c18-2.6 24.4-9 27-27z" fill="'+W+'"/>'+
      '<path d="M232 150c1 7 3.6 9.6 10.6 10.6c-7 1-9.6 3.6-10.6 10.6c-1-7-3.6-9.6-10.6-10.6c7-1 9.6-3.6 10.6-10.6z" fill="'+W+'" opacity=".7"/>',
    api: g('mg9','#0E7490','#325FFC')+
      '<g stroke="'+W+'" stroke-opacity=".55" stroke-width="2" stroke-dasharray="4 5"><path d="M160 100L66 46"/><path d="M160 100L254 46"/><path d="M160 100L66 154"/><path d="M160 100L254 154"/></g>'+
      '<g fill="'+W+'"><circle cx="66" cy="46" r="20" fill-opacity=".22"/><rect x="57" y="37" width="18" height="18" rx="5"/><circle cx="254" cy="46" r="20" fill-opacity=".22"/><rect x="245" y="37" width="18" height="18" rx="9"/><circle cx="66" cy="154" r="20" fill-opacity=".22"/><path d="M66 144l10 18H56z"/><circle cx="254" cy="154" r="20" fill-opacity=".22"/><rect x="245" y="145" width="18" height="18" rx="3" transform="rotate(45 254 154)"/></g>'+
      '<circle cx="160" cy="100" r="34" fill="'+W+'"/><text x="160" y="106" text-anchor="middle" font-family="Outfit,sans-serif" font-size="17" font-weight="700" fill="#0E7490">API</text>'
  };
  function key(a){var m=(a.getAttribute('href')||'').match(/([a-z-]+)\.html/);return m&&V[m[1]]?m[1]:null;}

  var items=links.map(function(a){return{a:a,k:key(a),t:(a.querySelector('b')||a).textContent,s:(a.querySelector('span')||{}).textContent||''};}).filter(function(i){return i.k;});
  if(!items.length) return;
  var here=(location.pathname.match(/([a-z-]+)\.html/)||[])[1];
  var def=items.filter(function(i){return i.k===here;})[0]||items[0];

  feat.innerHTML='<span class="mf-vis" aria-hidden="true">'+items.map(function(i){return '<svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" data-k="'+i.k+'">'+V[i.k]+'</svg>';}).join('')+'</span>'+
    '<span class="mf-txt"><span class="eyebrow">Onze dienst</span><b></b><span class="mf-desc"></span><span class="mf-go">Bekijk de pagina <i>→</i></span></span>';
  var svgs=[].slice.call(feat.querySelectorAll('.mf-vis svg')), tb=feat.querySelector('.mf-txt b'), ts=feat.querySelector('.mf-desc'), txt=feat.querySelector('.mf-txt');
  var cur=null, tT;
  function show(i){
    if(cur===i) return; cur=i;
    svgs.forEach(function(s){s.classList.toggle('on',s.getAttribute('data-k')===i.k);});
    feat.setAttribute('href',i.a.getAttribute('href'));
    feat.setAttribute('aria-label',i.t);
    items.forEach(function(x){x.a.classList.toggle('is-prev',x===i);});
    txt.classList.add('swap'); clearTimeout(tT);
    tT=setTimeout(function(){tb.textContent=i.t; ts.textContent=i.s; txt.classList.remove('swap');},120);
  }
  items.forEach(function(i){
    i.a.addEventListener('mouseenter',function(){show(i);});
    i.a.addEventListener('focus',function(){show(i);});
  });
  tb.textContent=def.t; ts.textContent=def.s; show(def); tb.textContent=def.t; ts.textContent=def.s;
  var li=d.querySelector('.has-mega');
  if(li&&window.MutationObserver){ new MutationObserver(function(){ if(!li.classList.contains('open')) setTimeout(function(){ if(!li.classList.contains('open')) show(def); },300); }).observe(li,{attributes:true,attributeFilter:['class']}); }
})();

// Snelheid: niet-noodzakelijke media pas na het laden van de pagina ophalen
(function(){
  function later(){
    // klantlogo's in de scrollbalk alvast laden, zodat er geen lege plekken ontstaan
    document.querySelectorAll('.marquee img[loading="lazy"]').forEach(function(i){ i.loading='eager'; });
    // video in de hero pas starten als de pagina klaar is
    document.querySelectorAll('video[data-defer]').forEach(function(v){
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      v.muted=true; v.preload='auto'; v.autoplay=true;
      var p=v.play(); if(p&&p.catch) p.catch(function(){});
    });
  }
  function go(){ setTimeout(function(){ ('requestIdleCallback' in window) ? requestIdleCallback(later,{timeout:2000}) : later(); }, 600); }
  if (document.readyState==='complete') go(); else window.addEventListener('load', go, {once:true});
})();
