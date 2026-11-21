const fs=require('fs'),path=require('path');function edit(p,fn){fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8').replaceAll('\r\n','\n')))}
edit('src/services/scheduling.service.ts',s=>s.replace('request:await db.appointmentRequest.findUnique({where:{id:requestId}})','request:await db.appointmentRequest.findUniqueOrThrow({where:{id:requestId}})'));
edit('src/app/reception/page.tsx',s=>"import { ReceptionToday } from '@/components/ReceptionToday';\nimport { LocalizedText } from '@/components/LocalizedText';\n"+s.replace('  return (\n    <ReceptionWorkspaceClient','  return (\n    <>\n    <ReceptionToday branches={branches} appointments={appointments} requests={pendingRequests}/>\n    <details className="max-w-7xl mx-auto px-4 pb-8"><summary className="text-lg font-semibold cursor-pointer"><LocalizedText name="administration"/></summary>\n    <ReceptionWorkspaceClient').replace('    />\n  );','    />\n    </details></>\n  );').replace('where: { isActive: true },','where: { isActive: true, ...(assignedBranchId ? {id:assignedBranchId} : {}) },').replace('      user: true,','      user: {select:{id:true,fullName:true,email:true,phone:true}},').replace('dentistUser: true','dentistUser: {select:{id:true,fullName:true,email:true}}'));
edit('src/app/admin/page.tsx',s=>"import {QueuePolicySettings} from '@/components/QueuePolicySettings';\n"+s.replace('        <RolePageHeader','        <QueuePolicySettings branches={branches}/>\n        <RolePageHeader').replace('users={users}','users={users.map(({passwordHash,...user})=>user)}'));
edit('src/app/api/admin/users/route.ts',s=>s.replace('NextResponse.json({ users })','NextResponse.json({ users: users.map(({passwordHash,...user})=>user) })'));
edit('src/app/dentist/DentistDeskClient.tsx',s=>s.replace('body: JSON.stringify({ targetStatus })',"body: JSON.stringify({action:({CALLED:'CALL',IN_CONSULTATION:'START',COMPLETED:'COMPLETE'} as Record<string,string>)[targetStatus]||targetStatus})"));
edit('src/app/dentist/page.tsx',s=>"import {orderVisits} from '@/lib/scheduling-rules';\nimport {getQueuePolicy} from '@/services/visit.service';\n"+s.replace('waitingQueue={waitingQueue}','waitingQueue={orderVisits(waitingQueue, branchId ? await getQueuePolicy(branchId) : {earlyArrivalMinutes:0})}'));
edit('src/config/workspace-navigation.ts',s=>s.replace("export function getAuthorizedWorkspacesForRole(primaryRole?: string | null): WorkspaceConfig[] {","export function getAuthorizedWorkspacesForRole(primaryRole?: string | null): WorkspaceConfig[] {\n  if(primaryRole==='FINANCE')return [WORKSPACE_CONFIGS.FINANCE];\n  if(primaryRole==='INVENTORY')return [WORKSPACE_CONFIGS.INVENTORY];\n  if(primaryRole==='CRM')return [WORKSPACE_CONFIGS.CRM];").replace("allowedRoles: ['BRANCH_MANAGER', 'OWNER_ADMIN', 'RECEPTIONIST']","allowedRoles: ['FINANCE', 'OWNER_ADMIN']").replace("allowedRoles: ['BRANCH_MANAGER', 'OWNER_ADMIN']","allowedRoles: ['INVENTORY', 'OWNER_ADMIN']").replace("allowedRoles: ['OWNER_ADMIN', 'BRANCH_MANAGER', 'RECEPTIONIST']","allowedRoles: ['CRM', 'OWNER_ADMIN', 'RECEPTIONIST']").replace("    case 'PATIENT':","    case 'FINANCE': return WORKSPACE_CONFIGS.FINANCE;\n    case 'INVENTORY': return WORKSPACE_CONFIGS.INVENTORY;\n    case 'CRM': return WORKSPACE_CONFIGS.CRM;\n    case 'PATIENT':").replace("{ id: 'profile',", "{ id: 'records', labelEn: 'My records', labelAr: 'سجلاتي', href: '/portal/records', iconName: 'FileText' },\n      { id: 'profile',"));
for(const p of ['src/app/billing/page.tsx',...fs.readdirSync('src/app/api/billing').map(n=>'src/app/api/billing/'+n+'/route.ts').filter(p=>fs.existsSync(p))])edit(p,s=>s.replaceAll('Role.BRANCH_MANAGER','Role.FINANCE'));
for(const p of ['src/app/inventory/page.tsx','src/app/purchasing/page.tsx'])edit(p,s=>s.replaceAll('Role.BRANCH_MANAGER','Role.INVENTORY'));
edit('src/app/crm/page.tsx',s=>s.replaceAll('Role.BRANCH_MANAGER','Role.CRM'));
edit('src/app/admin/AdminDashboardClient.tsx',s=>s.replace('<option value="BRANCH_MANAGER">', '<option value="FINANCE">Finance / Accountant</option><option value="INVENTORY">Inventory</option><option value="CRM">CRM</option><option value="BRANCH_MANAGER">'));
edit('src/app/api/billing/payments/route.ts',s=>{
 const start=s.indexOf('    const isStaff =',s.indexOf('export async function POST'));const end=s.indexOf('    if (!patientId',start);
 s=s.slice(0,start)+"    requireRole(user,[Role.RECEPTIONIST,Role.FINANCE,Role.OWNER_ADMIN],collectionBranchId);\n    if (!idempotencyKey) return NextResponse.json({error:'A payment reference is required.'},{status:400});\n\n"+s.slice(end);
 return s.replace(/    const finalIdempotencyKey =[^\n]+/, '    const finalIdempotencyKey = idempotencyKey;').replace("{ status: 400 }","{ status: err.statusCode || 400 }");
});
// Branch-restrict every finance read, including patient-filtered staff reads.
for(const kind of ['payments','invoices'])edit(`src/app/api/billing/${kind}/route.ts`,s=>{
 s="import {branchScope} from '@/lib/rbac';\n"+s;
 const start=s.indexOf('    if (patientId) {'),end=s.indexOf(`    const ${kind} = await db.`,start);
 if(start>=0&&end>=0)s=s.slice(0,start)+`    const scope=branchScope(user,[Role.RECEPTIONIST,Role.FINANCE,Role.OWNER_ADMIN],branchId);
    const whereClause:any={${kind==='payments'?'collectionBranchId':'branchId'}:scope,...(patientId?{patientId}:{})};
`+s.slice(end);
 return s;
});
for(const kind of ['expenses','analytics'])edit(`src/app/api/billing/${kind}/route.ts`,s=>s.replaceAll('Role.FINANCE, Role.OWNER_ADMIN, Role.RECEPTIONIST','Role.FINANCE, Role.OWNER_ADMIN'));
// Restrict clinical APIs by patient assignment rather than role alone.
for(const kind of ['summary','encounters','teeth','documents','treatment-plans'])edit(`src/app/api/clinical/${kind}/route.ts`,s=>{
 s="import {requireClinicalAccess} from '@/lib/rbac';\n"+s;
 s=s.replace('  try {\n', '  try {\n    await requireClinicalAccess(user, patientId);\n');
 // POST obtains patientId after entering try; guard directly after destructuring instead.
 const post=s.indexOf('export async function POST');if(post>=0){let tail=s.slice(post).replace('    await requireClinicalAccess(user, patientId);\n','');tail=tail.replace(/(    const \{ patientId[^\n]+\n)/,'$1    await requireClinicalAccess(user, patientId);\n');s=s.slice(0,post)+tail;}
 return s;
});
// Apply brand values and legible metadata sizes consistently to existing JSX assets.
function walk(dir){for(const f of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,f.name);if(f.isDirectory())walk(p);else if(/\.(tsx|ts)$/.test(p)&&!p.includes('lib\\messages'))edit(p,s=>s.replaceAll('#1F6FB2','#176C5B').replaceAll('#13558C','#125648').replaceAll('#123B67','#163447').replaceAll('#F6F8FC','#F7F8F5').replaceAll('text-[9px]','text-xs').replaceAll('text-[10px]','text-xs').replaceAll('text-[11px]','text-xs'))}}
walk('src');
edit('src/app/globals.css',s=>s+`\n.field { display:block; width:100%; padding:.75rem; margin-top:.4rem; border:1px solid #b8c9c2; border-radius:.65rem; background:white; color:#163447; font-size:1rem; }\n.primary-button,.secondary-button { display:inline-flex; align-items:center; justify-content:center; padding:.65rem 1rem; border-radius:.65rem; font-weight:600; min-height:44px; }\n.primary-button { background:#176C5B;color:white; }\n.primary-button:hover { background:#125648; }\n.secondary-button {border:1px solid #8ca99e;color:#163447;background:white;}\nbutton:disabled {opacity:.55;cursor:not-allowed;}\n.surface-card {background:white;border:1px solid #d8e0dc;border-radius:1rem;padding:1.5rem;}\n.surface-card h2 {font-size:1.25rem;font-weight:600;margin-bottom:1rem;}\n.workflow-table {width:100%;text-align:start;border-collapse:collapse;margin-top:1rem;font-size:.9375rem;}\n.workflow-table th,.workflow-table td {padding:.9rem .7rem;border-bottom:1px solid #e3e9e5;text-align:start;}\n.workflow-table th {font-size:.875rem;color:#40574f;font-weight:600;}\n`);
console.log('Wired reception, roles, policies and clinical guards.');
