import {loginDestination} from '@/lib/login-destination';
import {logAuditEvent} from '@/lib/audit';
import {NextResponse} from 'next/server';
import db from '@/lib/db';
import {createSession,setSessionCookie} from '@/lib/auth';
import {presentationAccounts,presentationEnabled} from '@/lib/presentation';
export async function POST(request:Request) {
 const url=new URL(request.url);
 if(!presentationEnabled()) return NextResponse.json({error:'Presentation access is disabled'},{status:404});
 const origin=request.headers.get('origin');
 if(origin!==url.origin) return NextResponse.json({error:'Invalid origin'},{status:403});
 const form=await request.formData(); const account=presentationAccounts.find(a=>a.email===form.get('email'));
 if(!account)return NextResponse.json({error:'Choose a presentation account'},{status:400});
 const user=await db.user.findUnique({where:{email:account.email},include:{roleGrants:true}});
 if(!user || user.status !== 'ACTIVE')return NextResponse.json({error:'Account unavailable'},{status:404});
 const destination=loginDestination(user.roleGrants);
 if(destination!==account.path)return NextResponse.json({error:'Demo account permissions need configuration'},{status:403});
 await logAuditEvent({actorUserId:user.id,actorRole:user.roleGrants[0]?.role,action:'USER_LOGIN',entityType:'User',entityId:user.id,metadata:{method:'LOCAL_PRESENTATION'}});
 const {token,expiresAt}=await createSession(user.id); await setSessionCookie(token,expiresAt);
 return NextResponse.redirect(new URL(destination,request.url),303);
}

