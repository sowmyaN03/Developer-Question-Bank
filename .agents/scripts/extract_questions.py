import fitz, re, json, hashlib
pdf='attached_source.pdf'; doc=fitz.open(pdf)
text='\n'.join(p.get_text('text') for p in doc)
lines=[re.sub(r'\s+',' ',x).strip() for x in text.splitlines()]
records=[]; aliases=[('JAVA SPRING','Java Spring'),('CORE JAVA','Core Java'),('SPRING BOOT','Spring Boot'),('MONGODB','MongoDB'),('JAVASCRIPT','JavaScript'),('ANGULAR','Angular'),('REACT','React'),('SERVLETS','Servlets'),('JSP','JSP'),('HIBERNATE','Hibernate'),('SPRING','Spring')]
starts=[i for i,l in enumerate(lines) if re.match(r'^(?:Question\s*:\s*\d+|\d{1,4}[.)]\s+)',l,re.I)]
def clean(s): return re.sub(r'\s+',' ',s).strip(' -:')
for ix,i in enumerate(starts):
    end=starts[ix+1] if ix+1<len(starts) else min(len(lines),i+80); block=lines[i:end]; first=block[0]
    m=re.match(r'^Question\s*:\s*(\d+)\s*(.*)$',first,re.I); qtext=m.group(2) if m else re.sub(r'^\d{1,4}[.)]\s*','',first)
    sub='General'
    for prior in reversed(lines[max(0,i-100):i]):
        found=next((v for k,v in aliases if k in prior.upper() and len(prior)<100),None)
        if found: sub=found; break
    if 'ANGULAR' in (sub+' '+qtext).upper(): continue
    opts=[]; ans=None; ans_text=''
    for b in block[1:]:
        mo=re.match(r'^([A-D])[.)]\s*(.+)$',b,re.I)
        mi=re.match(r'^(?:[1-4])[.)]\s*(.+)$',b)
        if mo: opts.append(mo.group(2).strip())
        elif mi: opts.append(mi.group(1).strip())
        ma=re.match(r'^(?:ANS(?:WER)?|Correct Answer)\s*:\s*(.+)$',b,re.I)
        if ma: ans_text=ma.group(1).strip()
    qtext=clean(qtext)
    if len(qtext)<12: continue
    ml=re.search(r'\b([A-D])\b',ans_text,re.I)
    if ml and len(ans_text)<30: ans=ord(ml.group(1).upper())-65
    elif re.fullmatch(r'[1-4]',ans_text): ans=int(ans_text)-1
    elif opts and ans_text:
        for j,o in enumerate(opts):
            if ans_text.lower().strip('.') in o.lower() or o.lower() in ans_text.lower(): ans=j; break
    ca=next((b for b in block if b.lower().startswith('correct answer:')),None)
    if ca and not ans_text: ans_text=ca.split(':',1)[1].strip()
    if ans is None and ca:
        for j,o in enumerate(opts):
            if ans_text.lower() in o.lower() or o.lower() in ans_text.lower(): ans=j; break
    verified=len(opts)>=2 and ans is not None and ans < len(opts)
    if not opts and ans_text: opts=[ans_text]
    desc=next((b.split(':',1)[1].strip() for b in block if b.lower().startswith('description:')), '')
    explanation=desc if desc and desc.lower()!='none' else ('This item is retained for review because the source does not provide a complete, unambiguous multiple-choice record.' if not verified else f'The keyed answer is option {chr(65+ans)}. Review the underlying {sub} concept and source context for deeper understanding.')
    norm=re.sub(r'[^a-z0-9 ]','',qtext.lower())
    records.append({'id':'src-'+hashlib.sha1(norm.encode()).hexdigest()[:10],'subject':sub,'topic':sub,'text':qtext,'options':opts[:4],'correctAnswer':ans if ans is not None and ans<len(opts) else 0,'explanation':explanation,'verified':verified,'duplicateCount':1,'sourceRefs':['Imported PDF'],'sourceQuestion':first})
by={}
for r in records:
    k=re.sub(r'\W','',r['text'].lower())
    if k in by:
        by[k]['duplicateCount']+=1; by[k]['sourceRefs'].append('Repeated source item')
        if not by[k]['verified'] and r['verified']:
            by[k].update({x:r[x] for x in ['options','correctAnswer','explanation','verified']})
    else: by[k]=r
all_records=list(by.values())
for r in all_records:
    if r['subject']=='General': r['subject']='Core Java'
verified=[r for r in all_records if r['verified'] and len(r['options'])>=2]
unverified=[r for r in all_records if not (r['verified'] and len(r['options'])>=2)]
with open('artifacts/developer-question-bank/public/data/questions.json','w') as f: json.dump({'questions':verified,'unverified':unverified,'meta':{'sourcePages':len(doc),'rawItems':len(records),'dedupedItems':len(all_records),'verifiedItems':len(verified),'unverifiedItems':len(unverified),'angularExcluded':True}},f,ensure_ascii=False)
print(json.dumps({'raw':len(records),'deduped':len(all_records),'verified':len(verified),'unverified':len(unverified),'subjects':sorted(set(r['subject'] for r in all_records))},indent=2))
