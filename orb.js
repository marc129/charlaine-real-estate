/* Charlaine voice orb: one assistant for voice + text. Client-side intent engine, pre-recorded nova voice (EN/ES), browser-voice fallback. */
(()=>{const C=window.CH;if(!C)return;const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const TEL='+12017806962',TELF='201.780.6962';
let lang=/^es/i.test(navigator.language||'')?'es':'en',state='idle',conv=false,turns=0,flow=null,greeted=false;
// ---------- DOM ----------
const root=document.createElement('div');root.className='orbwrap';root.innerHTML=`
<div class="opanel" id="opanel" hidden role="dialog" aria-label="Charlaine's voice assistant">
 <div class="ohd"><div><b>Charlaine's Assistant</b><span id="ost">Tap the orb and speak</span></div>
 <div class="olang" role="group" aria-label="Language"><button data-l="en">EN</button><button data-l="es">ES</button></div><button class="ox" id="ox" aria-label="Close">×</button></div>
 <div class="olog" id="olog" aria-live="polite"></div>
 <form class="oin" id="oin" autocomplete="off"><input id="oq" placeholder="Ask or type…" aria-label="Message"><button>Send</button></form>
</div>
<button class="orb" id="orb" aria-label="Talk to Charlaine's assistant" data-s="idle"><i class="o1"></i><i class="o2"></i><i class="o3"></i><i class="ocore"></i><span class="ring"></span></button>
<span class="orblab" id="orblab">Ask Charlaine</span>`;
document.body.appendChild(root);
const orb=$('#orb'),panel=$('#opanel'),log=$('#olog'),ost=$('#ost'),lab=$('#orblab');
const T={en:{idle:'Tap the orb and speak',listen:'Listening…',think:'Thinking…',speak:'Speaking — tap orb to interrupt',lab:'Ask Charlaine',ph:'Ask or type…',send:'Send',nosr:'Voice input needs Chrome, Edge or Safari. You can type instead.',
 chips:['Homes in Jersey City','Book a showing','What is my home worth?','Talk to Charlaine'],call:'Call Charlaine',text:'Text Charlaine',share:'Share this page',mail:'Send request',
 bn:'Name',bp:'Phone',bt:'Preferred day & time',sum:'Showing request'},
 es:{idle:'Toca el orbe y habla',listen:'Escuchando…',think:'Pensando…',speak:'Hablando — toca el orbe para interrumpir',lab:'Pregunta a Charlaine',ph:'Pregunta o escribe…',send:'Enviar',nosr:'La voz requiere Chrome, Edge o Safari. También puedes escribir.',
 chips:['Casas en Jersey City','Reservar una visita','¿Cuánto vale mi casa?','Hablar con Charlaine'],call:'Llamar a Charlaine',text:'Enviar mensaje',share:'Compartir página',mail:'Enviar solicitud',
 bn:'Nombre',bp:'Teléfono',bt:'Día y hora preferidos',sum:'Solicitud de visita'}};
const ES_TXT={hi:'¡Hola! Pregúntame sobre casas, vecindarios, vender tu propiedad, o reserva una visita privada.',estimate:'Vamos a estimar el valor de tu casa. Escribe la dirección y los pies cuadrados para ver tu rango.',sell:"Charlaine combina un marketing excepcional con la red de Sotheby's International Realty. Empieza con una estimación privada.",
 buy_first:'Charlaine te acompaña en cada paso, desde la preaprobación hasta el cierre.',invest:'Charlaine puede ayudarte a encontrar oportunidades multifamiliares y de ingresos.',prequal:'Deja tus datos y Charlaine te conectará con un prestamista de confianza.',rent:'Charlaine también ayuda con alquileres. Dime dónde y tu presupuesto.',relocate:'Charlaine puede mostrarte todos los vecindarios y ayudarte a encontrar el lugar ideal.',
 about:"Charlaine A. Mercado tiene más de 20 años en bienes raíces en el condado de Hudson y trabaja con Prominent Properties Sotheby's International Realty en Jersey City.",contact:'Llama a Charlaine al 201.780.6962, o deja tus datos y ella te llamará.',tour:'Deja tu nombre y número y Charlaine confirmará la hora de tu visita.'};
// ---------- language ----------
const ESW=/[ñ¿¡]|\b(hola|quiero|busco|casas?|habitacion|recámara|cuartos?|dormitorio|vender|vendo|cuánto|cuanto|vale|gracias|por favor|dónde|donde|precio|comprar|alquil|rentar|mudarme|visita|cita|hablar|llamar|vecindario|millón|millones|menos de|necesito|tienen|hay|qué|como|cómo|mi casa|primera|inversi)/i;
const ENW=/\b(the|what|how|i want|looking|bedrooms?|homes?|house|sell|worth|hello|hi|please|show me|book|call|talk)\b/i;
function detect(t){const es=ESW.test(t),en=ENW.test(t);if(es&&!en)return'es';if(en&&!es)return'en';return lang}
function setLang(l){lang=l;root.querySelectorAll('.olang button').forEach(b=>b.classList.toggle('on',b.dataset.l===l));$('#oq').placeholder=T[l].ph;$('#oin button').textContent=T[l].send;lab.textContent=T[l].lab;setState(state);if(rec)rec.lang=l==='es'?'es-US':'en-US'}
root.querySelector('.olang').onclick=e=>{const b=e.target.closest('button');if(b)setLang(b.dataset.l)};
// es -> en normalisation for the shared intent parser
const MAP=[[/\b(habitaciones|habitación|habitacion|recámaras?|recamaras?|cuartos?|dormitorios?)\b/g,'bedrooms'],[/\b(casas?|viviendas?|propiedades|apartamentos?|departamentos?|condominios?)\b/g,'home'],[/\b(cuánto|cuanto) (vale|cuesta)|valor de mi|tasaci[oó]n/g,'worth'],[/\bvender|vendo\b/g,'sell'],[/primera (casa|vivienda)/g,'first home'],[/invertir|inversi[oó]n/g,'invest'],[/precalific|preaprob|hipoteca|préstamo/g,'pre-qual'],[/alquil\w*|rentar/g,'rent'],[/mud(arme|arnos|o)\b/g,'relocate'],[/(quién|quien) es|sobre charlaine|experiencia/g,'who is about'],[/tel[eé]fono|contacto|correo/g,'contact'],[/menos de|hasta|máximo/g,'under'],[/millones|millón|millon/g,'million'],[/\bmil\b/g,'thousand'],[/\buno\b|\buna\b/g,'1'],[/\bdos\b/g,'2'],[/\btres\b/g,'3'],[/\bcuatro\b/g,'4'],[/\bcinco\b/g,'5'],[/\bseis\b/g,'6'],[/\bhola\b/g,'hello'],[/\bbusco|muéstrame|muestrame|en venta\b/g,'find']];
const norm=t=>{let s=t.toLowerCase();if(lang==='es')MAP.forEach(([a,b])=>s=s.replace(a,b));return s};
// ---------- voice out ----------
let voices=[];const lv=()=>voices=speechSynthesis?speechSynthesis.getVoices():[];if(window.speechSynthesis){lv();speechSynthesis.onvoiceschanged=lv}
function bestVoice(){const p=lang==='es'?/^es/i:/^en/i,vs=voices.filter(v=>p.test(v.lang));return vs.find(v=>/natural|neural|google|premium|enhanced/i.test(v.name))||vs.find(v=>/samantha|paulina|monica|mónica|ava|allison/i.test(v.name))||vs[0]}
function tts(text){if(C.isMuted()||!window.speechSynthesis)return Promise.resolve();return new Promise(r=>{stopRec();speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);const v=bestVoice();if(v)u.voice=v;u.lang=lang==='es'?'es-US':'en-US';u.rate=1;u.pitch=1.05;setState('speak');u.onend=u.onerror=()=>setTimeout(()=>{if(state==='speak')afterSpeak();r()},300);speechSynthesis.speak(u)})}
const ES_AUD={chat_hi:'chat_hi_es',welcome:'welcome_es',notheard:'notheard_es',results:'results_es',results_none:'results_none_es',sell:'sell_es',estimate:'estimate_es',buy_first:'buy_first_es',invest:'invest_es',prequal:'prequal_es',rent:'rent_es',relocate:'relocate_es',about:'about_es',contact:'contact_es',lead_thanks:'lead_thanks_es',tour:'book_name_es'};
function speak(id,fallback){return speak0(id,fallback).then(()=>{if(state!=='listen'&&(C.isMuted()||!id))afterSpeak()})}
function speak0(id,fallback){stopRec();if(C.isMuted())return Promise.resolve();if(lang==='es'&&id){if(/^area_/.test(id))id='area_es';else if(/^listing_/.test(id))id='listing_es';else if(!/_es$/.test(id))id=ES_AUD[id]||(ES_AUD[id.replace(/_es$/,'')])||id+'_es'}
 if(!id)return fallback?tts(fallback):Promise.resolve();setState('speak');return C.say(id)}
document.addEventListener('ch:speak',e=>{if(e.detail)setState('speak');else if(state==='speak')afterSpeak()});
function afterSpeak(){setState('idle');if(conv&&!flow?.done&&turns<8&&!panel.hidden){setTimeout(()=>listen(),250)}}
// audio-reactive glow while speaking
let an=null,buf=null;function initAn(){if(an)return;try{const ac=new (window.AudioContext||window.webkitAudioContext)();const src=ac.createMediaElementSource(C.audio);an=ac.createAnalyser();an.fftSize=256;buf=new Uint8Array(an.frequencyBinCount);src.connect(an);an.connect(ac.destination);C.audio.addEventListener('play',()=>ac.resume())}catch(e){an=null}}
(function loop(){let lvl=0;if(an&&state==='speak'){an.getByteFrequencyData(buf);let s=0;for(let i=2;i<40;i++)s+=buf[i];lvl=s/(38*255)}orb.style.setProperty('--lvl',lvl.toFixed(3));requestAnimationFrame(loop)})();
// ---------- voice in ----------
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;let rec=null,recOn=false,heard='';
if(SR){rec=new SR();rec.interimResults=true;rec.continuous=false;rec.maxAlternatives=1;
 rec.onstart=()=>{recOn=true;heard='';setState('listen')};
 rec.onresult=e=>{if(state==='speak')return;let t='';for(const r of e.results)t+=r[0].transcript;heard=t;ost.textContent='“'+t+'”';if(e.results[e.results.length-1].isFinal){const v=t.trim();heard='';stopRec();if(v)handle(v,true)}};
 rec.onerror=e=>{if(e.error==='not-allowed'||e.error==='service-not-allowed'){conv=false;bot(T[lang].nosr)}};
 rec.onend=()=>{recOn=false;if(state==='listen'){if(heard.trim()){const v=heard.trim();heard='';handle(v,true)}else{setState('idle');conv=false}}}}
function stopRec(){if(rec&&recOn){try{rec.abort()}catch(e){}recOn=false}}
function listen(){if(!rec){bot(T[lang].nosr);return}if(window.speechSynthesis)speechSynthesis.cancel();C.stopSay();rec.lang=lang==='es'?'es-US':'en-US';try{rec.start()}catch(e){}}
// ---------- UI ----------
function setState(s){state=s;orb.dataset.s=s;root.dataset.s=s;ost.textContent=T[lang][{idle:'idle',listen:'listen',think:'think',speak:'speak'}[s]]}
function add(h,c){const d=document.createElement('div');d.className='om '+c;d.innerHTML=h;log.appendChild(d);log.scrollTop=1e6;return d}
const bot=h=>add(h,'b'),me=t=>add(esc(t),'u');
function chips(a){const d=add(a.map(c=>`<button type="button" data-oq="${esc(c)}">${esc(c)}</button>`).join(''),'chips');}
function acts(list){add(list.join(''),'acts')}
const callA=()=>`<a class="oa" href="tel:${TEL}">${T[lang].call} · ${TELF}</a>`;
const textA=(body)=>`<a class="oa" href="sms:${TEL}${/iP(hone|ad)/.test(navigator.userAgent)?'&':'?'}body=${encodeURIComponent(body||location.href)}">${T[lang].text}</a>`;
const shareA=()=>`<button class="oa" type="button" data-share>${T[lang].share}</button>`;
function open(voice){initAn();panel.hidden=false;root.classList.add('open');if(!greeted){greeted=true;bot(esc(lang==='es'?ES_TXT.hi:C.TXT.hi));chips(T[lang].chips);if(!voice)speak(lang==='es'?'welcome_es':'orb_hi')}
 if(voice){conv=true;turns=0;listen()}}
function close(){panel.hidden=true;root.classList.remove('open');conv=false;stopRec();C.stopSay();if(window.speechSynthesis)speechSynthesis.cancel();setState('idle')}
orb.onclick=()=>{if(panel.hidden)return open(true);if(state==='listen'){conv=false;stopRec();setState('idle');return}if(state==='speak'){C.stopSay();if(window.speechSynthesis)speechSynthesis.cancel();setState('idle');conv=true;listen();return}conv=true;turns=0;listen()};
$('#ox').onclick=close;addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden)close()});
$('#oin').onsubmit=e=>{e.preventDefault();const v=$('#oq').value.trim();if(!v)return;$('#oq').value='';conv=false;handle(v,false)};
log.addEventListener('click',e=>{const b=e.target.closest('[data-oq]');if(b){conv=false;handle(b.dataset.oq,false)}
 if(e.target.closest('[data-share]')){const d={title:'Charlaine A. Mercado',url:location.href};navigator.share?navigator.share(d).catch(()=>{}):navigator.clipboard&&navigator.clipboard.writeText(location.href).then(()=>bot(lang==='es'?'Enlace copiado.':'Link copied.'))}});
// in-page "Request a showing" buttons -> booking flow in the orb
document.addEventListener('click',e=>{const t=e.target.closest('[data-tour]'),q=e.target.closest('[data-q]');if(t||(q&&/showing/i.test(q.dataset.q))){e.stopImmediatePropagation();e.preventDefault();open(false);startBook(t?t.dataset.tour:'')}},true);
// ---------- dialogue ----------
const BOOK=/showing|tour|visit|see (it|the|this|a) (home|house|place|property)|book|schedule|appointment|visita|cita|agendar|reservar|ver la (casa|propiedad)/i;
const HAND=/talk to charlaine|speak (to|with) (charlaine|someone|a (person|human|agent))|real person|human|agent|call (her|charlaine)|hablar con|llamar a charlaine|comunicar/i;
const TEXT=/\btext\b|\bsms\b|send (me )?(a |the )?link|share|mensaje|enlace|compartir/i;
const BYE=/^(bye|goodbye|thanks?|thank you|that'?s all|adiós|adios|gracias|eso es todo)\b/i;
function startBook(addr){flow={k:'book',step:'name',d:{addr}};bot(esc(lang==='es'?'¡Perfecto! ¿Cuál es tu nombre?':"Wonderful, let's book a showing. What's your name?"));speak(lang==='es'?'book_name_es':'book_name')}
function bookStep(t){const d=flow.d;if(flow.step==='name'){d.name=t.replace(/^(my name is|i'?m|it'?s|me llamo|soy|mi nombre es)\s+/i,'');flow.step='phone';bot(esc(lang==='es'?'¡Gracias! ¿A qué número te podemos llamar?':"Thanks! What's the best phone number to reach you?"));return speak(lang==='es'?'book_phone_es':'book_phone')}
 if(flow.step==='phone'){const dg=t.replace(/[^\d]/g,'');d.phone=dg.length>=7?dg:t;flow.step='time';bot(esc(lang==='es'?'¿Qué día y hora te queda mejor?':'And what day and time works best for you?'));return speak(lang==='es'?'book_time_es':'book_time')}
 if(flow.step==='time'){d.time=t;flow.done=true;conv=false;const L=T[lang];
  const card=add(`<p class="ok">${L.sum}</p><dl>${d.addr?`<dt>${lang==='es'?'Propiedad':'Property'}</dt><dd>${esc(d.addr)}</dd>`:''}<dt>${L.bn}</dt><dd>${esc(d.name)}</dd><dt>${L.bp}</dt><dd>${esc(d.phone)}</dd><dt>${L.bt}</dt><dd>${esc(d.time)}</dd></dl><button class="btn" type="button">${L.mail}</button>`,'b sum');
  card.querySelector('button').onclick=()=>{const fd=new FormData();fd.set('name',d.name);fd.set('phone',d.phone);fd.set('msg','Preferred time: '+d.time+(d.addr?'\nProperty: '+d.addr:'')+'\nLanguage: '+(lang==='es'?'Spanish':'English'));C.lead('Showing request (voice assistant)'+(d.addr?': '+d.addr:''),fd);card.querySelector('button').remove();bot(esc(lang==='es'?'¡Gracias! Charlaine se comunicará contigo muy pronto.':'Thank you! Charlaine will be in touch very soon.'));speak(lang==='es'?'lead_thanks_es':'lead_thanks')};
  acts([textA(`Hi Charlaine, I'd like to see ${d.addr||'a home'} — ${d.name}, ${d.phone}, ${d.time}`),callA()]);flow=null;return speak(lang==='es'?'book_done_es':'book_done')}}
function handle(t,voice){turns++;const l=detect(t);if(l!==lang)setLang(l);me(t);setState('think');
 setTimeout(()=>{ if(flow&&flow.k==='book'&&!HAND.test(t))return bookStep(t);
  if(HAND.test(t)){bot(esc(lang==='es'?'Claro. Toca para llamar a Charlaine directamente.':'Of course. Tap below to reach Charlaine directly.'));acts([callA(),textA()]);conv=false;return speak(lang==='es'?'handoff_es':'handoff')}
  if(BYE.test(t.trim())){conv=false;bot(esc(lang==='es'?'Gracias por tu visita. Charlaine está aquí cuando la necesites.':"Thanks for stopping by. Charlaine is here whenever you're ready."));return speak(lang==='es'?null:'goodbye',lang==='es'?'Gracias por tu visita.':'')}
  if(BOOK.test(t)&&!/worth|vale/i.test(t)){const m=C.L.find(x=>x.kind==='listing'&&new RegExp(x.addr.split(' ').slice(1,2)[0],'i').test(t));return startBook(m?m.addr:'')}
  if(TEXT.test(t)){bot(esc(lang==='es'?'¡Claro! Envíale un mensaje a Charlaine o comparte esta página.':'Sure — text Charlaine or share this page with yourself.'));acts([textA(),shareA()]);return speak(lang==='es'?'text_link_es':'text_link')}
  const r=C.reply(norm(t));let txt=r.text;
  if(lang==='es'){const q=C.parse(norm(t));if(q.i&&ES_TXT[q.i==='hi'?'hi':q.i])txt=ES_TXT[q.i==='hi'?'hi':q.i];else if(q.i==='search')txt=r.cards.length?`${r.cards.length} ${r.cards.length>1?'casas publicadas coinciden':'casa publicada coincide'} con tu búsqueda. Charlaine confirmará la disponibilidad.`:'Ahora no hay una coincidencia publicada, pero Charlaine conoce casas antes de que salgan al mercado. Deja tus datos.';else if(q.i==='area'){const h=C.H.find(x=>x.k===q.area);txt=`${h.n}: Charlaine puede mostrarte lo que está disponible ahora.`}else if(/^l_/.test(q.i||''))txt='Aquí tienes los detalles. Pregúntale a Charlaine por el precio y la disponibilidad actual.';else if(!q.i)txt='Perdón, no te entendí. Prueba: “3 habitaciones en Jersey City por menos de un millón”.'}
  bot(esc(txt));
  if(r.cards.length)add(r.cards.map(l=>`<div class="oc"><small>${esc(l.tag)}</small><b>${esc(l.addr)}</b><span>${l.bd?l.bd+' bd · '+l.ba+' ba'+(l.sf?' · '+l.sf.toLocaleString()+' sq ft':'')+' · ':''}${l.price?C.fmt(l.price):(lang==='es'?'Precio a solicitud':'Price on request')}</span>${l.kind==='listing'?`<button type="button" data-oq="${lang==='es'?'Reservar visita':'Book a showing at'} ${esc(l.addr)}">${lang==='es'?'Reservar visita':'Book a showing'}</button>`:''}</div>`).join(''),'cards');
  if(r.go==='#sell')acts([`<a class="oa" href="#sell">${lang==='es'?'Abrir estimación privada':'Open the private home estimate'} →</a>`]);
  if(r.lead&&!r.cards.length&&/contact|prequal|tour/.test(r.aud||''))acts([callA(),textA()]);
  const cs=(r.chips||[]).filter(c=>!/showing|pre-qual/i.test(c));if(cs.length)chips(lang==='es'?T.es.chips.slice(0,3):cs.concat(['Book a showing']).slice(0,3));
  if(r.go==='#sell')setTimeout(()=>$('#sell').scrollIntoView({behavior:'smooth'}),900);
  speak(r.aud)},420)}
setLang(lang);setState('idle');
window.Orb={open,close,listen,handle,setLang,startBook};
})();
