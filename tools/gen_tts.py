import json,os,requests,sys
P=json.load(open('tools/phrases.json'));k=os.environ['OPENAI_API_KEY'];chars=0
for i,t in P.items():
  f=f'audio/{i}.mp3'
  if os.path.exists(f): continue
  r=requests.post('https://api.openai.com/v1/audio/speech',headers={'Authorization':'Bearer '+k},json={'model':'gpt-4o-mini-tts','voice':'nova','input':t,'instructions':'Speak in a warm, happy, upbeat and polished tone, like a friendly luxury real estate concierge.','response_format':'mp3'},timeout=120)
  r.raise_for_status();open(f,'wb').write(r.content);chars+=len(t);print(i,len(r.content))
print('chars',chars)
