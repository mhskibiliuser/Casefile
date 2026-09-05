// CASEFILE interrogation fallback
(function(){
  function init(){
    var form=document.getElementById('interrogationForm'),input=document.getElementById('questionInput'),area=document.getElementById('convoArea');
    if(!form||!input||!area)return;
    var remaining=document.getElementById('qRemaining'),echo=document.getElementById('qRemainingEcho'),button=document.getElementById('askBtn');
    var tabs=document.querySelectorAll('.interrogation-tab');
    var data={ethan:{name:'Ethan Cole',r:['I was at the ticket table. Ask the freshmen I checked in.','A few minutes, maybe. Long enough to grab more zip ties from the closet.','I wanted that trophy front and center. That is not a crime.']},maya:{name:'Maya Lin',r:['I was hanging streamers. Alone, yes, but that was decorating for you.','I left for the stage around 21:35. I did not look back.','That lock was a joke. I said so to three different people that week.']},noah:{name:'Noah Reed',r:['I was hauling tables through that corridor all night. Ask anyone.','My boots? I was outside setting up the courtyard entrance too.','I did not go near the display case. Why would I?']}};
    var who='ethan',count=3,history={ethan:[],maya:[],noah:[]};
    function esc(x){var d=document.createElement('div');d.textContent=x;return d.innerHTML}
    function render(){var log=history[who],name=data[who].name;if(!log.length){area.innerHTML='<p class="convo-empty">No questions asked yet. Choose a suspect and ask your first question below.</p>';return}area.innerHTML=log.map(function(x){return '<div class="msg msg-q"><span class="msg-label">You</span>'+esc(x.q)+'</div><div class="msg msg-a"><span class="msg-label">'+name+'</span>'+esc(x.a)+'</div>'}).join('');area.scrollTop=area.scrollHeight}
    function update(){if(remaining)remaining.textContent=count;if(echo)echo.textContent=count;if(input)input.disabled=count<=0;if(button)button.disabled=count<=0;if(input)input.placeholder=count<=0?'No questions remaining.':'Ask a question...'}
    tabs.forEach(function(t){t.addEventListener('click',function(){tabs.forEach(function(x){x.classList.remove('active')});t.classList.add('active');who=t.dataset.suspect||'ethan';render()})});
    form.addEventListener('submit',function(e){e.preventDefault();var q=input.value.trim();if(!q||count<=0)return;var log=history[who],r=data[who].r;log.push({q:q,a:r[log.length]||'I have already told you everything I know.'});count--;input.value='';render();update()});
    update();render();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
