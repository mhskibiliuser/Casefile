// CASEFILE — AI interrogation controller
(function(){
  'use strict';

  var DATA={
    ethan:{name:'Ethan Cole'},
    maya:{name:'Maya Lin'},
    noah:{name:'Noah Reed'}
  };
  var who='ethan',count=3,history={ethan:[],maya:[],noah:[]},bound=false,busy=false;

  function esc(s){var d=document.createElement('div');d.textContent=s;return d.innerHTML;}
  function visible(el){if(!el)return false;var r=el.getBoundingClientRect(),cs=getComputedStyle(el);return cs.display!=='none'&&cs.visibility!=='hidden'&&r.width>0&&r.height>0;}
  function findInput(){return document.getElementById('questionInput')||document.querySelector('textarea, input[type="text"], input:not([type])');}
  function findArea(){return document.getElementById('convoArea')||document.querySelector('.convo-area,.conversation,.conversation-area,[class*="convo"],[class*="conversation"]');}
  function findRemaining(){return document.getElementById('qRemaining')||document.getElementById('qRemainingEcho')||document.querySelector('[class*="remaining"]');}
  function findAskButton(){return document.getElementById('askBtn')||Array.prototype.slice.call(document.querySelectorAll('button')).find(function(b){return /ask|question|submit/i.test((b.textContent||'').trim())&&visible(b);});}
  function isInterrogation(){return /interrogation/i.test(document.body.innerText||'')||location.hash.toLowerCase().indexOf('interrog')>=0;}

  function render(){
    var area=findArea();if(!area)return;
    var log=history[who],name=DATA[who].name;
    if(!log.length){area.innerHTML='<p class="convo-empty">No questions asked yet. Choose a suspect and ask your first question below.</p>';return;}
    area.innerHTML=log.map(function(x){return '<div class="msg msg-q"><span class="msg-label">You</span>'+esc(x.q)+'</div><div class="msg msg-a"><span class="msg-label">'+esc(name)+'</span>'+esc(x.a)+'</div>';}).join('');
    area.scrollTop=area.scrollHeight;
  }

  function update(){
    var input=findInput(),button=findAskButton(),rem=findRemaining();
    if(rem)rem.textContent=count;
    if(input){input.disabled=count<=0||busy;input.placeholder=busy?'Waiting for response...':count<=0?'No questions remaining.':'Ask a question...';}
    if(button){button.disabled=count<=0||busy;button.textContent=busy?'Thinking…':button.dataset.originalText||button.textContent;}
  }

  async function ask(){
    if(!isInterrogation()||count<=0||busy)return;
    var input=findInput();if(!input)return;
    var q=(input.value||'').trim();if(!q)return;
    busy=true;update();
    var previous=history[who].flatMap(function(x){return [{role:'user',content:x.q},{role:'assistant',content:x.a}];});
    try{
      var response=await fetch('/api/interrogate',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({suspect:who,question:q,history:previous})
      });
      var data=await response.json().catch(function(){return{};});
      if(!response.ok)throw new Error(data.error||'The AI could not answer right now.');
      var answer=String(data.answer||'').trim();
      if(!answer)throw new Error('The AI returned an empty answer.');
      history[who].push({q:q,a:answer});
      count--;
      input.value='';
      render();
    }catch(err){
      var area=findArea();
      if(area){
        var notice=document.createElement('div');
        notice.className='msg msg-a';
        notice.innerHTML='<span class="msg-label">SYSTEM</span>'+esc(err.message||'Something went wrong.');
        area.appendChild(notice);
      }else alert(err.message||'Something went wrong.');
    }finally{busy=false;update();}
  }

  function bind(){
    if(bound)return;bound=true;
    document.addEventListener('click',function(e){
      var tab=e.target.closest&&e.target.closest('.interrogation-tab,[data-suspect]');
      if(tab){var s=tab.dataset.suspect;if(DATA[s]){who=s;render();update();return;}}
      var t=e.target.closest&&e.target.closest('button');
      if(t&&/ask|question|submit/i.test((t.textContent||'').trim())){if(!t.dataset.originalText)t.dataset.originalText=t.textContent.trim();e.preventDefault();e.stopImmediatePropagation();ask();}
    },true);
    document.addEventListener('keydown',function(e){if(e.key==='Enter'&&e.target&&(/textarea|input/i.test(e.target.tagName))&&!e.shiftKey&&isInterrogation()){e.preventDefault();ask();}},true);
    window.addEventListener('hashchange',function(){setTimeout(function(){render();update();},100);});
  }

  function init(){bind();setTimeout(function(){render();update();},100);setTimeout(function(){render();update();},800);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
