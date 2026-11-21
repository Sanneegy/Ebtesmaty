const fs=require('fs');function edit(p,fn){fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8').replaceAll('\r\n','\n')))}
edit('src/services/billing.service.ts',s=>{
 s="import {postPayment} from './payment.service';\nimport {randomUUID} from 'crypto';\n"+s;
 const a=s.indexOf('export async function recordPayment('),b=s.indexOf('export async function getPatientPayments',a);
 s=s.slice(0,a)+'export async function recordPayment(data: RecordPaymentInput) { return postPayment(data); }\n\n'+s.slice(b);
 s=s.replace('  const invoiceNumber = await generateNextInvoiceNumber();',`  const actor=await db.user.findUniqueOrThrow({where:{id:data.issuedByUserId},include:{roleGrants:true}});
  const {requireRole}=await import('@/lib/rbac');requireRole(actor,['RECEPTIONIST','FINANCE','OWNER_ADMIN','DENTIST'],data.branchId);
  for(const line of data.lines)if(!Number.isInteger(line.unitPricePiasters)||line.unitPricePiasters<0||!Number.isInteger(line.quantity??1)||(line.quantity??1)<1)throw new Error('Enter valid prices and quantities.');
  const invoiceNumber = 'INV-'+randomUUID();`);
 return s;
});
edit('src/app/billing/BillingDeskClient.tsx',s=>s.replace('useState, useEffect, useMemo','useState, useEffect, useMemo, useRef').replace("  const isCheckoutMode = modeParam === 'checkout';","  const isCheckoutMode = modeParam === 'checkout' || !currentUser.roleGrants.some((g:any)=>['FINANCE','OWNER_ADMIN'].includes(g.role));\n  const paymentKey=useRef<string>('');\n  const [paymentError,setPaymentError]=useState('');").replace('    setSavingPayment(true);','    setSavingPayment(true);\n    setPaymentError(\'\');\n    if(!paymentKey.current)paymentKey.current=crypto.randomUUID();').replace('          paymentMethod: payMethod,','          paymentMethod: payMethod,\n          idempotencyKey: paymentKey.current,').replace('        setShowPaymentModal(false);','        paymentKey.current="";\n        setShowPaymentModal(false);').replace('      if (res.ok) {\n        paymentKey.current=', '      if (!res.ok) {const d=await res.json();setPaymentError(d.error||"Could not save payment.");}\n      if (res.ok) {\n        paymentKey.current=').replace("    if (viewParam ===", "    if(isCheckoutMode && (viewParam==='expenses'||viewParam==='reconciliation'))return;\n    if (viewParam ===").replace('    <div className=', '    <div className='));
// Add inline payment feedback inside the actual main return, not individual chart renderers.
edit('src/app/billing/BillingDeskClient.tsx',s=>s.replace("  return (\n", "  return (\n",1).replace('{/* Emergent/Stand-by', '{/* Emergent/Stand-by').replace("      {/*", "      {paymentError && <p role=\"alert\" className=\"p-4 text-red-800\">{paymentError}</p>}\n      {/*"));
for(const [p,model] of [['src/app/api/clinical/encounters/[id]/route.ts','encounter'],['src/app/api/clinical/encounters/[id]/addenda/route.ts','encounter'],['src/app/api/clinical/treatment-plans/[id]/route.ts','treatmentPlan']])edit(p,s=>"import db from '@/lib/db';\nimport {requireClinicalAccess} from '@/lib/rbac';\n"+s.replaceAll('  try {\n',`  try {\n    const record=await db.${model}.findUniqueOrThrow({where:{id:params.id}});\n    await requireClinicalAccess(user,record.patientId);\n`));
// Restrict inventory APIs to operational inventory authority on every request.
const root='src/app/api/inventory';function walk(dir){for(const f of fs.readdirSync(dir,{withFileTypes:true})){const p=dir+'/'+f.name;if(f.isDirectory())walk(p);else if(f.name==='route.ts')edit(p,s=>{
 s="import {hasRole as canInventory} from '@/lib/rbac';\n"+s;
 s=s.replaceAll('  const user = await getCurrentUser();','  const user = await getCurrentUser();\n  if(!canInventory(user,["INVENTORY","OWNER_ADMIN"]))return NextResponse.json({error:"Inventory access required."},{status:403});');
 return s.replaceAll('Role.BRANCH_MANAGER','Role.INVENTORY');
})}}walk(root);
// Remove unsupported public supplier exposure; keep procurement in the agreed workspace.
fs.writeFileSync('src/app/supplier/page.tsx',"import {redirect} from 'next/navigation';export default function Supplier(){redirect('/purchasing');}\n");
edit('src/app/api/supplier/orders/route.ts',s=>"import {hasRole} from '@/lib/rbac';\n"+s.replaceAll('  if (!user) {','  if (!user || !hasRole(user,["INVENTORY","OWNER_ADMIN"])) {'));
edit('src/app/operations/equipment/page.tsx',s=>s.replaceAll('Role.BRANCH_MANAGER','Role.INVENTORY'));
edit('src/services/booking.service.ts',s=>s.replace("  const duration=input.durationMinutes||45;", "  if(input.source==='WALK_IN'){const policy=await db.schedulingPolicy.findUnique({where:{branchId:input.branchId}});if(!policy?.walkInsEnabled)throw new Error('Walk-in bookings are not enabled for this branch.');}\n  const duration=input.durationMinutes||45;"));
console.log('Payment validation and role guards connected.');
