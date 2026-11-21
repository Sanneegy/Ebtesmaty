'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {useLanguage} from '@/context/LanguageContext';
export function FollowUpAction({id,status}:{id:string;status:string}){const r=useRouter(),{locale}=useLanguage(),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);if(['COMPLETED','DISMISSED'].includes(status))return null;return <><button className="secondary-button" disabled={busy} onClick={async()=>{setBusy(true);try{const res=await fetch('/api/crm/recalls',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({followUpId:id,status:'COMPLETED'})});if(!res.ok)throw Error((await res.json()).error);r.refresh()}catch(e:any){setNotice(e.message)}finally{setBusy(false)}}}>{locale==='ar'?'إتمام المتابعة':'Complete follow-up'}</button><span role="status">{notice}</span></>}
