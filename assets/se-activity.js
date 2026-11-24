/* School Enterprises staff training: interactive activity engine (sort, sequence, branch). */
(function(){
  'use strict';
  try{ if(window.self!==window.top) document.documentElement.classList.add('embedded'); }catch(e){ document.documentElement.classList.add('embedded'); }
  var data = JSON.parse(document.getElementById('activity-data').textContent);
  var root = document.getElementById('app');
  var live = document.getElementById('live');
  function el(tag, cls, text){var e=document.createElement(tag); if(cls) e.className=cls; if(text!=null) e.textContent=text; return e;}
  function say(t){live.textContent=''; setTimeout(function(){live.textContent=t;},30);}
  function shuffle(a){a=a.slice(); for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)); var t=a[i];a[i]=a[j];a[j]=t;} return a;}
  function progress(done,total,label){
    var w=el('div'); var m=el('div','meta'); m.appendChild(el('span',null,label)); m.appendChild(el('span',null,done+' of '+total));
    var p=el('div','progress'); p.setAttribute('role','progressbar'); p.setAttribute('aria-valuemin','0'); p.setAttribute('aria-valuemax',String(total)); p.setAttribute('aria-valuenow',String(done));
    var s=el('span'); s.style.width=(total?Math.round(done/total*100):0)+'%'; p.appendChild(s); w.appendChild(m); w.appendChild(p); return w;
  }
  function fb(ok, head, text){var f=el('div','fb '+(ok?'ok':'no')); f.appendChild(el('strong',null,head+' ')); f.appendChild(document.createTextNode(text||'')); return f;}
  function finish(card, score, total, lines){
    card.innerHTML='';
    var d=el('div','done'); d.appendChild(el('span','badge','\u2713'));
    d.appendChild(el('h2',null,'Activity complete'));
    if(total){d.appendChild(el('div','score',score+' / '+total)); d.appendChild(el('p',null,'right first time'));}
    if(data.outro) d.appendChild(el('p',null,data.outro));
    if(lines&&lines.length){var ul=el('ul','summary'); lines.forEach(function(l){ul.appendChild(el('li',null,l));}); d.appendChild(ul);}
    var again=el('button','btn primary','Try again'); again.type='button'; again.onclick=start; d.appendChild(again);
    d.appendChild(el('p','note','When you are ready, carry on with the lesson and its knowledge check.'));
    card.appendChild(d); say('Activity complete. '+(total?score+' out of '+total+' right first time.':'')); again.focus();
  }
  function intro(card){ if(data.intro){card.appendChild(el('p','intro',data.intro));} }

  /* SORT: pick the right category for each card */
  function runSort(card){
    var items=shuffle(data.items), i=0, score=0, firstTry=true;
    function show(){
      card.innerHTML=''; intro(card);
      if(i>=items.length) return finish(card,score,items.length,null);
      card.appendChild(progress(i,items.length,data.label||'Sort each example'));
      var it=items[i], box=el('div','item'); box.appendChild(el('span','tag','Example '+(i+1)));
      var q=el('p','q',it.text); q.id='q'+i; box.appendChild(q);
      var ch=el('div','choices'); ch.setAttribute('role','group'); ch.setAttribute('aria-labelledby','q'+i);
      var fbBox=el('div'); fbBox.setAttribute('aria-live','polite');
      data.categories.forEach(function(c){
        var b=el('button','btn',c); b.type='button';
        b.onclick=function(){
          fbBox.innerHTML='';
          if(c===it.answer){
            if(firstTry) score++;
            Array.prototype.forEach.call(ch.children,function(x){x.disabled=true;}); b.classList.add('primary');
            fbBox.appendChild(fb(true,'Correct: '+it.answer+'.',it.why));
            var n=el('button','btn primary',i+1<items.length?'Next example':'See your result'); n.type='button'; n.style.marginTop='12px';
            n.onclick=function(){i++; firstTry=true; show();}; fbBox.appendChild(n); n.focus();
            say('Correct. '+it.answer+'. '+it.why);
          } else {
            firstTry=false; b.disabled=true; b.classList.add('wrong'); box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
            fbBox.appendChild(fb(false,'Not quite.',(it.hint||'Think again about what the lesson says, then try another option.')));
            say('Not quite. Try another option.');
          }
        };
        ch.appendChild(b);
      });
      box.appendChild(ch); box.appendChild(fbBox); card.appendChild(box);
    }
    show();
  }

  /* SEQUENCE: tap the steps in the right order */
  function runSequence(card){
    var steps=data.steps, placed=0, mistakes=0, pool=shuffle(steps.map(function(s,k){return {s:s,k:k};}));
    card.innerHTML=''; intro(card);
    var prog=el('div'); card.appendChild(prog);
    card.appendChild(el('h3',null,'Your order')); var ol=el('ol','seq'); ol.setAttribute('aria-label','Steps placed so far'); card.appendChild(ol);
    var fbBox=el('div'); fbBox.setAttribute('aria-live','polite'); 
    card.appendChild(fbBox); card.appendChild(el('h3',null,'Tap the next step')); var pl=el('div','pool'); card.appendChild(pl);
    function render(){
      prog.innerHTML=''; prog.appendChild(progress(placed,steps.length,data.label||'Put the steps in order'));
      pl.innerHTML='';
      pool.forEach(function(p){
        var b=el('button','btn block',p.s.text); b.type='button';
        b.onclick=function(){
          fbBox.innerHTML='';
          if(p.k===placed){
            var li=el('li',null,p.s.text); ol.appendChild(li); placed++;
            pool=pool.filter(function(x){return x!==p;});
            if(p.s.why) fbBox.appendChild(fb(true,'Yes.',p.s.why));
            say('Step '+placed+': '+p.s.text+'. '+(p.s.why||''));
            if(placed===steps.length){ var s=Math.max(0,steps.length-mistakes); var lines=steps.map(function(x,n){return (n+1)+'. '+x.text;}); finish(card,s,steps.length,lines); return; }
            render(); var f=pl.querySelector('button'); if(f) f.focus();
          } else {
            mistakes++; b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
            fbBox.appendChild(fb(false,'Not yet.',steps[placed].hint||'That step comes later. Which step has to happen first?'));
            say('Not yet. That step comes later.');
          }
        };
        pl.appendChild(b);
      });
    }
    render();
  }

  /* BRANCH: what would you do? */
  function runBranch(card){
    var node=data.start, score=0, total=0, firstTry=true, log=[];
    function show(){
      var n=data.nodes[node]; card.innerHTML='';
      if(n.end){ if(n.text) data.outro=(n.text+' '+(data.outroBase||'')).trim(); return finish(card,score,total,log); }
      if(node===data.start) intro(card);
      var sc=el('div','scene'); sc.appendChild(el('span','tag',n.tag||'Scenario')); sc.appendChild(el('p',null,n.scene)); card.appendChild(sc);
      var q=el('h3',null,n.ask||'What would you do?'); q.id='ask'; card.appendChild(q);
      var ch=el('div'); ch.setAttribute('role','group'); ch.setAttribute('aria-labelledby','ask');
      var fbBox=el('div'); fbBox.setAttribute('aria-live','polite');
      shuffle(n.choices).forEach(function(c){
        var b=el('button','btn block',c.text); b.type='button';
        b.onclick=function(){
          fbBox.innerHTML='';
          if(c.ok){
            total++; if(firstTry) score++; log.push((firstTry?'\u2713 ':'\u2022 ')+(n.short||n.scene));
            Array.prototype.forEach.call(ch.children,function(x){x.disabled=true;}); b.classList.add('primary');
            fbBox.appendChild(fb(true,'Good choice.',c.fb));
            var nx=el('button','btn primary','Continue'); nx.type='button'; nx.style.marginTop='12px';
            nx.onclick=function(){node=c.next; firstTry=true; show();}; fbBox.appendChild(nx); nx.focus();
            say('Good choice. '+c.fb);
          } else {
            firstTry=false; b.disabled=true; b.classList.add('wrong');
            fbBox.appendChild(fb(false,'Think again.',c.fb));
            say('Think again. '+c.fb);
          }
        };
        ch.appendChild(b);
      });
      card.appendChild(ch); card.appendChild(fbBox);
    }
    data.outroBase=data.outroBase||data.outro||'';
    show();
  }


  /* CARDS: flip cards (tap to reveal the back) */
  function runCards(card){
    var cards=data.cards, seen={}, count=0;
    card.innerHTML=''; intro(card);
    var prog=el('div'); card.appendChild(prog);
    var grid=el('div','cards'); card.appendChild(grid);
    var foot=el('div'); foot.setAttribute('aria-live','polite'); card.appendChild(foot);
    function upd(){ prog.innerHTML=''; prog.appendChild(progress(count,cards.length,data.label||'Cards turned over'));
      if(count===cards.length && !foot.firstChild){ foot.appendChild(fb(true,'All cards turned.','You can turn them again, or finish.')); var f=el('button','btn primary','Finish'); f.type='button'; f.style.marginTop='12px'; f.onclick=function(){finish(card,0,0,null);}; foot.appendChild(f);} }
    cards.forEach(function(c,k){
      var b=el('button','flip'); b.type='button'; b.setAttribute('aria-pressed','false');
      var inner=el('span','flip-inner');
      var fr=el('span','face front'); if(c.tag) fr.appendChild(el('span','tag',c.tag)); fr.appendChild(el('span','ftext',c.front)); fr.appendChild(el('span','hint','Tap to turn over'));
      var bk=el('span','face back'); bk.appendChild(el('span','bhead',c.front)); bk.appendChild(el('span','btext',c.back));
      inner.appendChild(fr); inner.appendChild(bk); b.appendChild(inner);
      b.setAttribute('aria-label',c.front+'. Tap to turn over.');
      b.onclick=function(){ var on=b.classList.toggle('flipped'); b.setAttribute('aria-pressed',on?'true':'false');
        b.setAttribute('aria-label',on?(c.front+'. '+c.back):(c.front+'. Tap to turn over.'));
        if(on){ say(c.back); if(!seen[k]){seen[k]=1;count++;upd();} } };
      grid.appendChild(b);
    });
    upd();
  }

  /* CHECKLIST: tick items as you go (saved on this device) */
  function runChecklist(card){
    var key='se-check:'+location.pathname, state={};
    try{ state=JSON.parse(localStorage.getItem(key)||'{}'); }catch(e){}
    var groups=data.groups||[{title:'',items:data.items}], total=0;
    groups.forEach(function(g){ total+=g.items.length; });
    card.innerHTML=''; intro(card);
    var prog=el('div'); card.appendChild(prog);
    var foot=el('div'); foot.setAttribute('aria-live','polite');
    function count(){ var n=0; for(var k in state){ if(state[k]) n++; } return n; }
    function upd(){ var n=count(); prog.innerHTML=''; prog.appendChild(progress(n,total,data.label||'Ticked'));
      foot.innerHTML=''; if(n===total){ foot.appendChild(fb(true,'Checklist complete.',data.doneText||'Well done.')); var f=el('button','btn primary','Finish'); f.type='button'; f.style.marginTop='12px'; f.onclick=function(){finish(card,0,0,null);}; foot.appendChild(f);} }
    var id=0;
    groups.forEach(function(g){
      if(g.title) card.appendChild(el('h3',null,g.title));
      var ul=el('ul','checks');
      g.items.forEach(function(it){
        var k='i'+(id++); var li=el('li'); var cb=el('input'); cb.type='checkbox'; cb.id=k; cb.checked=!!state[k];
        var lab=el('label',null,typeof it==='string'?it:it.text); lab.setAttribute('for',k);
        cb.onchange=function(){ state[k]=cb.checked; try{localStorage.setItem(key,JSON.stringify(state));}catch(e){} li.classList.toggle('ticked',cb.checked); upd(); };
        if(cb.checked) li.classList.add('ticked');
        li.appendChild(cb); li.appendChild(lab);
        if(it.why){ var w=el('span','why',it.why); li.appendChild(w); }
        ul.appendChild(li);
      });
      card.appendChild(ul);
    });
    var clr=el('button','btn','Clear all ticks'); clr.type='button'; clr.style.marginTop='4px';
    clr.onclick=function(){ state={}; try{localStorage.removeItem(key);}catch(e){} runChecklist(card); };
    card.appendChild(clr); card.appendChild(foot);
    if(data.note) card.appendChild(el('p','note',data.note));
    upd();
  }

  function start(){
    root.innerHTML=''; var card=el('div','card'); root.appendChild(card);
    if(data.type==='sort') runSort(card); else if(data.type==='sequence') runSequence(card); else if(data.type==='cards') runCards(card); else if(data.type==='checklist') runChecklist(card); else runBranch(card);
  }
  start();
})();
