'use client';
import {localizedText} from '@/lib/interface-messages';

import { useLanguage } from '@/context/LanguageContext';
export function PortalSandboxPaymentButton(props: {patientId:string;invoiceId:string;invoiceNumber:string;branchId:string;remainingPiasters:number}) {
 const {locale}=useLanguage();
 return props.remainingPiasters > 0 ? <p className="text-sm text-slate-700 mt-3">{localizedText(locale==='ar' ? 'ar' : 'en', 'text_9d6ee39524')}</p> : null;
}
