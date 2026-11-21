const fs = require('fs');
const read=p=>fs.readFileSync(p,'utf8').replace(/\r\n/g,'\n');
const save=(p,s)=>fs.writeFileSync(p,s);
let p='src/app/dentist/DentistDeskClient.tsx',s=read(p).split('\n');
for(const [a,b] of [[650,688],[540,624],[342,424]])s.splice(a-1,b-a+1);
let str=s.join('\n').replace("CALLED:'CALL',","").replace('  const [selectedTooth, setSelectedTooth] = useState<number>(11);','').replace(/const FDI_(UPPER|LOWER)_ARCH = .*;\n/g,'');
str=str.replace('                    <Link\n                      href={`/dentist/chart/${selectedPatient.id}`}',`                    {queue.filter(entry => entry.patientId === selectedPatient.id && ['CALLED','IN_CONSULTATION'].includes(entry.status)).map(entry => (
                      <button key={entry.id} className="secondary-button" disabled={callingId === entry.id}
                        onClick={() => handleTransitionQueue(entry.id, entry.status === 'CALLED' ? 'IN_CONSULTATION' : 'COMPLETED')}>
                        <TranslatedText text={entry.status === 'CALLED' ? 'Start consultation' : 'Finish consultation'} />
                      </button>
                    ))}
                    <Link
                      href={\`/dentist/chart/\${selectedPatient.id}\`}`);save(p,str);
p='src/app/dentist/chart/[patientId]/DentistPatientChartClient.tsx';s=read(p).split('\n');for(const [a,b] of [[404,412],[347,357],[13,13]])s.splice(a-1,b-a+1);str=s.join('\n').replace("'chart' | ","").replace("['chart','encounters'","['encounters'").replace("as any:'chart'","as any:'encounters'").replace("const [docFileName, setDocFileName] = useState('');","const [docFile, setDocFile] = useState<File | null>(null);\n  const [docError, setDocError] = useState('');");
let start=str.indexOf('    setSavingDoc(true);'),end=str.indexOf('    } finally',start);
str=str.slice(0,start)+`    if (!docFile) return;
    setSavingDoc(true);
    setDocError('');
    try {
      const form = new FormData();
      form.set('file', docFile);
      form.set('patientId', patientId);
      form.set('branchId', branches[0]?.id || '');
      form.set('fileCategory', docCategory);
      form.set('notes', docNotes);
      const response = await fetch('/api/clinical/documents', { method: 'POST', body: form });
      if (!response.ok) throw new Error((await response.json()).error || 'Upload failed');
      setShowDocModal(false);
      setDocFile(null);
      setDocNotes('');
      setActiveTab('documents');
      await refreshSummary();
    } catch (error) {
      setDocError(error instanceof Error ? error.message : 'Upload failed');
`+str.slice(end);
str=str.replace(/<LocalizedInput\s+type="text"\s+required\s+value=\{docFileName\}[\s\S]*?\/>/,'<input type="file" required accept="image/png,image/jpeg,application/pdf" aria-label="Radiograph or document" onChange={e=>setDocFile(e.target.files?.[0] || null)} /><p>PNG · JPEG · PDF · 10 MB</p>{docError && <p role="alert"><TranslatedText text={docError}/></p>}').replace('{doc.notes && (','{doc.storageKey?.startsWith("private:") && <a className="secondary-button" href={`/api/clinical/documents?id=${doc.id}`}><TranslatedText text="Download file" /></a>}\n                    {doc.notes && (');save(p,str);
p='src/app/billing/BillingDeskClient.tsx';str=read(p).replace('serviceItemId: l.serviceItemId || null','serviceItemId: l.serviceItemId === "OTHER" ? null : l.serviceItemId || null').replace('                          if (item) {','                          if (!item) { updated[idx] = { ...line, serviceItemId: "OTHER", description: "", unitPriceEgp: 0 }; }\n                          if (item) {').replace('{serviceCatalog.map((cat) => (','<option value="OTHER"><TranslatedText text="Other bill type" /></option>\n                        {serviceCatalog.map((cat) => (').replace('className="flex gap-2 items-center">\n                      <select','className="flex flex-wrap gap-2 items-center">\n                      <select').replace('</select>\n                      <LocalizedInput','</select>\n                      {line.serviceItemId === "OTHER" && <label className="w-full"><TranslatedText text="Bill type" /><input className="field" required maxLength={180} value={line.description} onChange={e=>setInvoiceLines(lines=>lines.map((row,i)=>i===idx?{...row,description:e.target.value}:row))}/></label>}\n                      <LocalizedInput');save(p,str);
p='src/services/visit.service.ts';str=read(p).replace('const transitions = { CALL:',"const transitions = { DISMISS: {from:'CALLED',to:'DEPARTED_UNSEEN',field:'completedAt'}, CALL:").replace("action === 'START' || action === 'COMPLETE' ? [Role.DENTIST, Role.OWNER_ADMIN] : [Role.RECEPTIONIST, Role.DENTIST, Role.OWNER_ADMIN]", "action === 'START' ? [Role.DENTIST] : action === 'COMPLETE' ? [Role.DENTIST, Role.RECEPTIONIST] : [Role.RECEPTIONIST]").replace("            const policy = await getQueuePolicy", "            const occupied = await tx.queueEntry.findFirst({ where: { branchId:entry.branchId, dentistUserId:entry.dentistUserId, status:{in:['CALLED','IN_CONSULTATION']}, enteredAt:{gte:getCairoDayBounds().start,lt:getCairoDayBounds().end} } });\n            if (occupied) throw new Error('Release the current patient before calling another.');\n            const policy = await getQueuePolicy");save(p,str);
p='src/components/ReceptionToday.tsx';str=read(p).replace("{t('callNext')}</button>}</td>",`{t('callNext')}</button>}{['CALLED','IN_CONSULTATION'].includes(q.status) && <button className="secondary-button" disabled={!!busy} onClick={() => {
 const seen=q.status==='IN_CONSULTATION';
 const message=seen?(locale==='ar'?'تأكيد انتهاء الزيارة؟':'Confirm this visit has finished?'):(locale==='ar'?'تأكيد مغادرة المريض قبل الكشف؟':'Confirm the called patient left without being seen?');
 if(window.confirm(message)) action(q.id, \`/api/scheduling/queue/\${q.id}/transition\`, { action:seen?'COMPLETE':'DISMISS' });
 }}>{locale==='ar'?'إخراج المريض':'Call out / release patient'}</button>}</td>`);save(p,str);
