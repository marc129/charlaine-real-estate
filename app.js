(()=>{const $=s=>document.querySelector(s),fmt=n=>'$'+Math.round(n).toLocaleString('en-US');
const nav=$('#nav');addEventListener('scroll',()=>nav.classList.toggle('solid',scrollY>60),{passive:true});
$('#burger').onclick=()=>$('#mnav').classList.toggle('open');document.querySelectorAll('#mnav a').forEach(a=>a.onclick=()=>$('#mnav').classList.remove('open'));
// hero video: portrait on mobile

// ---------- voice output ----------
let muted=localStorage.getItem('chMute')==='1',speaking=false,audio=new Audio(),unlocked=false;
const mb=$('#mute');const setM=()=>mb.textContent=muted?'Voice off':'Voice on';setM();
mb.onclick=()=>{muted=!muted;localStorage.setItem('chMute',muted?'1':'0');setM();if(muted){audio.pause();speaking=false}};
addEventListener('pointerdown',()=>{if(unlocked)return;unlocked=true;audio.src='audio/silence.mp3';audio.play().catch(()=>{})},{once:true});
function say(id){if(muted||!id)return Promise.resolve();return new Promise(r=>{try{if(rec&&listening)rec.abort()}catch(e){}speaking=true;audio.pause();audio.src='audio/'+id+'.mp3';
const done=()=>{setTimeout(()=>{speaking=false},400);r()};audio.onended=done;audio.onerror=done;audio.play().catch(done)})}
// ---------- intent parsing ----------
const AREA={jc:/jersey city|bergen|lafayette|downtown|journal square|heights|greenville|paulus|west side/,hoboken:/hoboken/,weehawken:/weehawken/,edgewater:/edgewater/,unioncity:/union city/,northbergen:/north bergen/,wny:/west new york|wny/};
const AREA_AUD={jc:'area_jc',hoboken:'area_hoboken',weehawken:'area_weehawken',edgewater:'area_edgewater',unioncity:'area_unioncity',northbergen:'area_northbergen',wny:'area_wny'};
const NUM={one:1,two:2,three:3,four:4,five:5,six:6};
function money(s){const m=s.match(/(\d[\d,.]*)\s*(k|thousand|m|million|mil)?/);if(!m)return null;let v=parseFloat(m[1].replace(/,/g,''));const u=m[2]||'';if(/^m/.test(u))v*=1e6;else if(/^(k|t)/.test(u))v*=1e3;else if(v<20)v*=1e6;else if(v<5000)v*=1e3;return v}
function parse(t){t=t.toLowerCase().replace(/\$/g,'');const q={};
for(const k in AREA)if(AREA[k].test(t)){q.area=k;break}
let b=t.match(/(\d|one|two|three|four|five|six)[\s-]*(bed|bd|br|bedroom)/);if(b)q.bd=+b[1]||NUM[b[1]];
let u=t.match(/(under|below|less than|max|up to|budget of?|around)\s+([\d,.]+\s*(k|thousand|m|million|mil)?)/);if(u)q.max=money(u[2]);
if(/worth|value|estimate|apprais|what.*(get|sell) for/.test(t))q.i='estimate';
else if(/sell|list my|listing my/.test(t))q.i='sell';
else if(/first[\s-]*time|first home/.test(t))q.i='buy_first';
else if(/invest|multi|income|rental property|duplex/.test(t))q.i='invest';
else if(/pre[\s-]*(qual|approv)|mortgage|lender/.test(t))q.i='prequal';
else if(/\brent|lease/.test(t))q.i='rent';
else if(/relocat|moving to|move to/.test(t))q.i='relocate';
else if(/tour|showing|see (it|the|a)|visit/.test(t))q.i='tour';
else if(/who is|about|charlaine|experience|sotheby/.test(t)&&!/home|house|condo|bed/.test(t))q.i='about';
else if(/call|phone|contact|email|reach/.test(t))q.i='contact';
else if(/clinton/.test(t))q.i='l_clinton';else if(/grand/.test(t))q.i='l_grand';else if(/van horne/.test(t))q.i='l_vanhorne';
else if(q.bd||q.max||/home|house|condo|brownstone|townhouse|buy|bed|listing|propert|for sale|show me|find/.test(t))q.i='search';
else if(q.area)q.i='area';
else if(/^(hi|hello|hey)/.test(t))q.i='hi';
return q}
const L=window.LISTINGS,H=window.HOODS;
function card(l){const p=l.price?fmt(l.price):'Price on request';const spec=l.bd?`<p class="sp">${l.bd} bed · ${l.ba} bath${l.sf?' · '+l.sf.toLocaleString()+' sq ft':''}</p>`:'';
return `<article class="card ${l.kind}"><p class="tg">${l.tag}</p><h3>${l.addr}</h3><p class="ar">${l.hood?l.hood+', ':''}${l.area}, NJ</p>${spec}<p class="pr">${l.kind==='sold'?'Sold · ':''}${p}</p><p class="st">${l.status}</p>${l.kind==='listing'?`<button data-tour="${l.addr}">Request a private showing</button>`:''}</article>`}
$('#quotes').innerHTML=window.QUOTES.map((q,i)=>`<figure class="qt" data-i="${i}"><blockquote>“${q[0]}”</blockquote><figcaption>${q[1]}</figcaption></figure>`).join('');
function leadForm(ctx,el){el.innerHTML=`<form class="lf"><p class="lk" style="font:italic 400 22px var(--serif);color:var(--gold)">Have Charlaine follow up</p><input name="name" placeholder="Name" required><input name="email" type="email" placeholder="Email" required><input name="phone" type="tel" placeholder="Phone (optional)"><button class="btn">Send to Charlaine</button></form>`;
el.querySelector('form').onsubmit=e=>{e.preventDefault();lead(ctx,new FormData(e.target));el.innerHTML='<p class="atext">Thank you. Charlaine will be in touch very soon.</p>';say('lead_thanks')}}
function lead(ctx,fd){const o=Object.fromEntries(fd);o.ctx=ctx;o.t=new Date().toISOString();const a=JSON.parse(localStorage.getItem('chLeads')||'[]');a.push(o);localStorage.setItem('chLeads',JSON.stringify(a));
const body=encodeURIComponent(`${ctx}\n\nName: ${o.name||''}\nEmail: ${o.email||''}\nPhone: ${o.phone||''}\n${o.msg||''}${o.addr?'\nProperty: '+o.addr+' ('+o.sqft+' sq ft)':''}`);
const w=open(`mailto:charlainerealestate@gmail.com?subject=${encodeURIComponent('Website inquiry: '+ctx)}&body=${body}`,'_self')}
const TXT={estimate:"Let's estimate your home's value. Enter the address and square footage below to unlock your range.",sell:"Charlaine pairs exceptional marketing with the Sotheby's International Realty network. Start with a private home estimate.",buy_first:"Charlaine will walk you through every step, from pre-approval to closing day.",invest:"With years in property acquisitions, Charlaine can help you find multi-family and income opportunities.",prequal:"Share your details and Charlaine will connect you with a trusted lender.",rent:"Charlaine helps with rentals too. Leave your area and budget.",relocate:"Charlaine can tour you through every neighborhood and help you find the right fit.",about:"Charlaine A. Mercado has 20+ years in Hudson County real estate and is with Prominent Properties Sotheby's International Realty in Jersey City.",contact:"Call Charlaine at 201.780.6962, or leave your details and she'll call you.",tour:"Leave your name and number and Charlaine will confirm a private showing time.",hi:"Hi! Ask me about homes, neighborhoods, selling, or what your home is worth."};
function reply(text){const q=parse(text),r={text:'',cards:[],chips:[],aud:null,lead:null,go:null};
const area=q.area?H.find(h=>h.k===q.area):null;
switch(q.i){case 'search':{let m=L.filter(l=>l.kind==='listing');if(q.area&&q.area!=='jc')m=[];if(q.bd)m=m.filter(l=>l.bd>=q.bd);if(q.max)m=m.filter(l=>!l.price||l.price<=q.max);
const crit=[q.bd&&q.bd+'+ bedrooms',area&&'in '+area.n,q.max&&'up to '+fmt(q.max)].filter(Boolean).join(' ');
if(m.length){r.cards=m;r.text=`${m.length} published home${m.length>1?'s':''} ${crit?'matching '+crit:''}. Listings move quickly, so Charlaine will confirm availability.`;r.aud='results'}
else{r.text=`No published match ${crit?'for '+crit:''} right now. Charlaine often knows about homes before they reach the market. Leave your details and she'll send options.`;r.aud='results_none'}
r.chips=['Request a showing','Get pre-qualified','What is my home worth?'];r.lead='Home search: '+text;break}
case 'area':r.text=`${area.n}: ${area.d} Charlaine can show you what's available now.`;r.aud=AREA_AUD[q.area];r.chips=['Homes in '+area.n,'What is my home worth?'];r.lead='Neighborhood: '+area.n;break;
case 'l_clinton':case 'l_grand':case 'l_vanhorne':{const l=L.find(x=>x.id===q.i.slice(2));r.cards=[l];r.text=`${l.addr}: ${l.status}.`;r.aud='listing_'+l.id;r.lead='Listing: '+l.addr;r.chips=['Request a showing'];break}
case 'estimate':case 'sell':r.text=TXT[q.i];r.aud=q.i;r.go='#sell';break;
case undefined:r.text="I didn't quite catch that. Try “3 bedrooms in Jersey City under $1M” or “what is my home worth?”";r.aud='notheard';r.chips=['Homes in Jersey City','Homes in Hoboken','Sell my home','About Charlaine'];break;
default:r.text=TXT[q.i];r.aud=q.i==='hi'?'chat_hi':q.i;if(['buy_first','invest','prequal','rent','relocate','tour','contact'].includes(q.i))r.lead=q.i.replace('_',' ')+': '+text;if(q.i==='about')r.go='#about';r.chips=q.i==='contact'?[]:['Homes in Jersey City','What is my home worth?']}
return r}
function show(text){const r=reply(text);$('#answer').hidden=false;$('#aq').textContent='“'+text+'”';$('#atext').textContent=r.text;
$('#acards').innerHTML=r.cards.map(card).join('');$('#achips').innerHTML=r.chips.map(c=>`<button data-q="${c}">${c}</button>`).join('')+'<a href="tel:+12017806962">Call 201.780.6962</a>';
r.lead?leadForm(r.lead,$('#alead')):$('#alead').innerHTML='';say(r.aud);
setTimeout(()=>document.querySelector(r.go||'#answer').scrollIntoView({behavior:'smooth'}),r.go?1200:150)}
$('#vform').onsubmit=e=>{e.preventDefault();const v=$('#q').value.trim();if(v)show(v)};
document.addEventListener('click',e=>{const b=e.target.closest('[data-q]');if(b&&!b.closest('#chat')){const t=b.dataset.q;if(/showing/i.test(t)){$('#alead').scrollIntoView({behavior:'smooth'});say('tour');return}if(/pre-qual/i.test(t))return show('pre-qualify');$('#q').value=t;show(t)}
const tb=e.target.closest('[data-tour]');if(tb){$('#q').value='Tour '+tb.dataset.tour;$('#answer').hidden=false;$('#aq').textContent=tb.dataset.tour;$('#atext').textContent=TXT.tour;$('#acards').innerHTML='';$('#achips').innerHTML='';leadForm('Showing request: '+tb.dataset.tour,$('#alead'));say('tour');$('#answer').scrollIntoView({behavior:'smooth'})}});
// ---------- voice input ----------
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;let rec=null,listening=false;const vs=$('#vstate'),mic=$('#mic');
if(SR){rec=new SR();rec.lang='en-US';rec.interimResults=true;rec.continuous=false;
rec.onstart=()=>{listening=true;mic.classList.add('on');vs.textContent='Listening…'};
rec.onend=()=>{listening=false;mic.classList.remove('on');vs.textContent='Speak or type. Ask about homes, neighborhoods, or what your home is worth.'};
rec.onresult=e=>{if(speaking||!audio.paused)return;let t='';for(const r of e.results)t+=r[0].transcript;$('#q').value=t;if(e.results[e.results.length-1].isFinal)show(t)};
rec.onerror=()=>{}}
mic.onclick=()=>{if(!rec){vs.textContent='Voice search needs Chrome, Edge or Safari. You can type your search instead.';return}
if(listening){rec.stop();return}audio.pause();speaking=false;setTimeout(()=>{try{rec.start()}catch(e){}},120)};
// ---------- estimate ----------
$('#est').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),sf=+f.get('sqft'),a=(f.get('addr')||'').toLowerCase();
const h=H.find(x=>a.includes(x.n.toLowerCase()))||H[0],k=+f.get('type');const lo=sf*h.ppsf[0]*k,hi=sf*h.ppsf[1]*k,rd=v=>Math.round(v/5000)*5000;
const o=$('#eout');o.hidden=false;o.innerHTML=`<span>Indicative range · ${h.n}</span><b>${fmt(rd(lo))} – ${fmt(rd(hi))}</b><span>Charlaine will follow up with a precise valuation from recent comparable sales.</span>`;
$('#lock').style.display='none';e.target.querySelector('.btn').style.display='none';say('estimate_ready');lead('Home estimate request',f)};
// ---------- contact ----------
$('#cform').onsubmit=e=>{e.preventDefault();lead('Contact form',new FormData(e.target));e.target.querySelector('.cdone').hidden=false;say('lead_thanks')};
// ---------- chat ----------
const chat=$('#chat'),chb=$('#chb');let greeted=false;
function bm(h,c='b'){const d=document.createElement('div');d.className='m '+c;d.innerHTML=h;chb.appendChild(d);chb.scrollTop=1e6;return d}
$('#chatbtn').onclick=()=>{chat.hidden=!chat.hidden;if(!chat.hidden&&!greeted){greeted=true;bm(TXT.hi);chips(['Homes in Jersey City','What is my home worth?','First-time buyer','Contact Charlaine'])}if(!chat.hidden)$('#chi').focus()};
$('#chx').onclick=()=>chat.hidden=true;
function chips(a){const d=document.createElement('div');d.className='chips';d.innerHTML=a.map(c=>`<button type="button">${c}</button>`).join('');d.onclick=e=>{const b=e.target.closest('button');if(b)ask(b.textContent)};chb.appendChild(d);chb.scrollTop=1e6}
function ask(t){bm(t.replace(/</g,'&lt;'),'u');const r=reply(t);setTimeout(()=>{let h=r.text;if(r.cards.length)h+='<br><br>'+r.cards.map(l=>`<b>${l.addr}</b> · ${l.bd} bd / ${l.ba} ba · ${l.price?fmt(l.price):'price on request'}`).join('<br>');bm(h);
if(r.go==='#sell')bm('<a href="#sell" onclick="document.getElementById(\'chat\').hidden=true">Open the private home estimate →</a>');
if(r.lead||r.go==='#sell'){const d=bm('<form><input name="name" placeholder="Name" required><input name="email" type="email" placeholder="Email" required><input name="phone" placeholder="Phone (optional)"><button class="btn">Have Charlaine contact me</button></form>');
d.querySelector('form').onsubmit=e=>{e.preventDefault();lead('Chat: '+(r.lead||t),new FormData(e.target));d.innerHTML='Thank you! Charlaine will be in touch soon.'}}
if(r.chips.length)chips(r.chips.filter(c=>!/showing/i.test(c)))},350)}
$('#chf').onsubmit=e=>{e.preventDefault();const v=$('#chi').value.trim();if(v){$('#chi').value='';ask(v)}};
})();
