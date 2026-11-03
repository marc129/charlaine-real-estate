(()=>{const RM=matchMedia('(prefers-reduced-motion: reduce)').matches,port=()=>innerWidth/innerHeight<.8;
const scenes=[...document.querySelectorAll('.scene')].map(el=>({el,stage:el.querySelector('.stage'),v:el.querySelector('video'),name:el.dataset.v,len:+el.dataset.len,rev:!!el.dataset.rev,beats:[...el.querySelectorAll('.beat')].map(b=>({b,i:+b.dataset.in,o:+b.dataset.out})),t:0,loaded:false}));
const src=s=>`media/v2/${s.name}${port()?'-p':''}`;
// split headline lines for masked reveals
document.querySelectorAll('.beat h1,.beat h2').forEach(h=>{h.innerHTML=h.innerHTML.split(/<br\s*\/?>/i).map(l=>`<span class="ln"><span>${l}</span></span>`).join('')});
if(RM){scenes.forEach(s=>{s.stage.style.backgroundImage=`linear-gradient(rgba(7,9,13,.6),rgba(7,9,13,.75)),url(${src(s)}.jpg)`});document.querySelectorAll('.rv').forEach(e=>e.classList.add('in'));return}
scenes.forEach(s=>{s.el.style.height=s.len+'vh';s.v.poster=src(s)+'.jpg'});
function load(s){if(s.loaded)return;s.loaded=true;s.v.preload='auto';s.v.src=src(s)+'.mp4';s.v.load()}
load(scenes[0]);
// iOS: prime videos on first touch so currentTime seeks render
addEventListener('touchstart',()=>scenes.forEach(s=>{if(s.loaded){const p=s.v.play();p&&p.then(()=>s.v.pause()).catch(()=>{})}}),{once:true,passive:true});
const ease=x=>1-Math.pow(1-x,3),cl=x=>Math.max(0,Math.min(1,x));const prog=document.getElementById('prog');
function frame(){const vh=innerHeight;
scenes.forEach((s,k)=>{const r=s.el.getBoundingClientRect(),total=r.height-vh,p=cl(-r.top/total);
if(r.top<vh*2.5&&r.bottom>-vh)load(s);
const on=r.top<vh&&r.bottom>0;if(!on)return;
// scrub video
const d=s.v.duration;if(d&&s.v.readyState>=1){const target=(s.rev?1-p:p)*(d-.05);s.t+= (target-s.t)*.18;if(Math.abs(s.v.currentTime-s.t)>.02&&!s.v.seeking)s.v.currentTime=s.t}
s.v.style.transform=`scale(${1.04+p*.06})`;
// beats
s.beats.forEach(({b,i,o})=>{const span=o-i,f=.22*span;let a=p<i||p>o?0:p<i+f?(p-i)/f:p>o-f&&o<1?(o-p)/f:1;a=cl(a);
if(k===0&&i===0&&p<.02)a=1;
b.style.opacity=a;b.style.visibility=a>0.01?'visible':'hidden';b.style.transform=`translateY(${(1-ease(a))*(p<i+f?40:-40)}px)`;
b.querySelectorAll('.ln>span').forEach((l,j)=>{const e=cl((p-i)/f*1.3-j*.18);l.style.transform=`translateY(${(1-ease(e))*105}%)`})})});
const doc=document.documentElement;prog.style.transform=`scaleX(${scrollY/(doc.scrollHeight-innerHeight)})`;requestAnimationFrame(frame)}
requestAnimationFrame(frame);
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.15});
const obs=()=>document.querySelectorAll('.rv,.qt').forEach(e=>{e.classList.add('rv');io.observe(e)});obs();
let lastP=port();addEventListener('resize',()=>{if(port()!==lastP){lastP=port();scenes.forEach(s=>{s.loaded=false;s.v.poster=src(s)+'.jpg'})}});
})();
