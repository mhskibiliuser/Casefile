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

  function render(){
    var area=findArea(); if(!area)return;
    var log=history[who],name=DATA[who].name;
    if(!log.length){
      area.innerHTML='<p class="convo-empty">No questions asked yet. Choose a suspect and ask your first question below.</p>';
      return;
    }
    area.innerHTML=log.map(function(x){
      return '<div class="msg msg-q"><span class="msg-label">You</span>'+esc(x.q)+'</div>'+
             '<div class="msg msg-a"><span class="msg-label">'+esc(name)+'</span>'+esc(x.a)+'</div>';
    }).join('');
    area.scrollTop=area.scrollHeight;
  }

  function update(){
    var input=findInput(),button=findAskButton(),rem=findRemaining();
    if(rem)rem.textContent=count;
    if(input){
      input.disabled=count<=0||busy;
      input.placeholder=count<=0?'No questions remaining.':(busy?'The suspect is answering...':'Ask a question...');
    }
    if(button){
      button.disabled=count<=0||busy;
      if(busy)button.dataset.casefileOriginalText=button.textContent;
      button.textContent=busy?'Thinking…':(button.dataset.casefileOriginalText||button.textContent);
    }
  }

  function isInterrogation(){
    return /interrogation/i.test(document.body.innerText||'') || location.hash.toLowerCase().indexOf('interrog')>=0;
  }

  async function ask(){
    if(!isInterrogation()||count<=0||busy)return;
    var input=findInput();
    if(!input){
      input=document.createElement('textarea');
      input.id='questionInput';
      input.rows=2;
      input.placeholder='Ask a question...';
      var btn=findAskButton(),host=btn&&btn.parentElement||document.querySelector('.interrogation,.interrogation-panel,[class*="interrogation"]')||document.body;
      host.appendChild(input);
    }

    var q=(input.value||'').trim();
    if(!q)return;

    busy=true;
    input.value='';
    update();

    try{
      var response=await fetch('/api/interrogate',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          suspect:who,
          question:q,
          history:history[who].flatMap(function(x){return [
            {role:'user',content:x.q},
            {role:'assistant',content:x.a}
          ];})
        })
      });

      var data=await response.json().catch(function(){return{};});
      if(!response.ok)throw new Error(data.error||'The AI could not answer right now.');

      history[who].push({q:q,a:String(data.answer||'').trim()||'The suspect says nothing.'});
      count--;
      render();
    }catch(error){
      input.value=q;
      var area=findArea();
      if(area){
        var note=document.createElement('p');
        note.className='convo-error';
        note.textContent='INTERROGATION ERROR: '+error.message;
        area.appendChild(note);
        area.scrollTop=area.scrollHeight;
      }
    }finally{
      busy=false;
      update();
    }
  }

  function bind(){
    if(bound)return;
    bound=true;

    document.addEventListener('click',function(e){
      var t=e.target.closest&&e.target.closest('button');
      if(t&&/ask|submit/i.test((t.textContent||'').trim())){
        e.preventDefault();
        e.stopPropagation();
        ask();
        return;
      }

      var tab=e.target.closest&&e.target.closest('.interrogation-tab,[data-suspect]');
      if(tab){
        var s=tab.dataset.suspect;
        if(DATA[s]){
          who=s;
          render();
          update();
        }
      }
    },true);

    document.addEventListener('keydown',function(e){
      if(e.key==='Enter'&&e.target&&(/textarea|input/i.test(e.target.tagName))&&!e.shiftKey&&isInterrogation()){
        e.preventDefault();
        ask();
      }
    },true);

    window.addEventListener('hashchange',function(){
      setTimeout(function(){render();update();},50);
    });
  }

  function init(){
    bind();
    setTimeout(function(){render();update();},100);
    setTimeout(function(){render();update();},800);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
