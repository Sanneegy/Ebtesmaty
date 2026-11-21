const fs=require('fs'),crypto=require('crypto'),assert=require('assert/strict'),{PrismaClient}=require('@prisma/client'),{chromium}=require('playwright');
const url=new URL(fs.readFileSync('.env','utf8').match(/^DATABASE_URL\s*=\s*(.+)$/m)[1].trim().replace(/^["']|["']$/g,''));url.pathname='/ebtesamty_ux_verification';const db=new PrismaClient({datasourceUrl:url.toString()});
(async()=>{let material,session,browser,orderId;try{const branch=await db.branch.findUniqueOrThrow({where:{code:'BR-A'}}),actor=await db.roleGrant.findFirstOrThrow({where:{role:'INVENTORY',OR:[{branchId:branch.id},{branchId:null}]}}),sku='REORDER-QA-'+Date.now();material=await db.material.create({data:{sku,nameEn:'Reorder verification gloves',nameAr:'قفازات اختبار',category:'HYGIENE',unit:'BOX',reorderPoint:10,unitCostPiasters:10000,lots:{create:{branchId:branch.id,lotNumber:sku,expiryDate:new Date(Date.now()+86400000*180),quantityOnHand:6}}}});session=await db.session.create({data:{userId:actor.userId,token:crypto.randomUUID(),expiresAt:new Date(Date.now()+180000)}});
browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});const context=await browser.newContext();await context.addCookies([{name:'ebtesamty_session',value:session.token,url:'http://localhost:3002'}]);const page=await context.newPage();await page.goto('http://localhost:3002/inventory?view=low');const card=page.locator('article').filter({hasText:sku}).filter({hasText:'BR-A'});await card.waitFor();assert((await card.innerText()).includes('Below reorder point'));assert((await card.innerText()).includes('Not configured'));await card.getByRole('button',{name:'Set lead time',exact:true}).click();await card.locator('input[type=number]').fill('7');await card.getByRole('button',{name:'Save',exact:true}).click();await page.waitForResponse(r=>r.url().includes('/inventory?'));assert.equal((await db.material.findUniqueOrThrow({where:{id:material.id}})).leadTimeDays,7);await page.screenshot({path:'work/reorder-numbers.png',fullPage:true});await card.getByRole('link',{name:'Reorder',exact:true}).click();await page.waitForURL('**/purchasing?**');await page.locator('form').last().waitFor();assert.equal(new URL(page.url()).searchParams.get('quantity'),'5');assert((await page.locator('select').evaluateAll(xs=>xs.map(x=>x.value))).includes(material.id));assert((await page.locator('input[type=number]').evaluateAll(xs=>xs.map(x=>x.value))).includes('5'));const createdResponse=page.waitForResponse(r=>r.url().endsWith('/api/inventory/orders')&&r.request().method()==='POST');
await page.getByRole('button',{name:'Submit Purchase Order',exact:true}).click();
const result=await createdResponse;
assert.equal(result.status(),201,await result.text());
const payload=await result.json();
orderId=payload.order.id;
await page.getByText('Purchase Order #'+payload.order.poNumber+' created successfully.',{exact:true}).waitFor();
assert.equal(await db.purchaseOrder.count({where:{lines:{some:{materialId:material.id}}}}),1);
assert(await page.getByText(payload.order.poNumber,{exact:true}).isVisible());

await page.goto('http://localhost:3002/inventory?view=low');
let pendingCard=page.locator('article').filter({hasText:sku}).filter({hasText:'BR-A'});
const valueFor=async(label)=>pendingCard.getByText(label,{exact:true}).locator('..').locator('dd').innerText();
await pendingCard.waitFor();
assert.equal((await valueFor('On order / awaiting delivery')).trim(),'5 BOX');
assert.equal((await valueFor('Projected stock after delivery')).trim(),'11 BOX');
assert.equal((await db.stockLot.aggregate({where:{materialId:material.id,branchId:branch.id},_sum:{quantityOnHand:true}}))._sum.quantityOnHand,6);
async function receive(quantity,lotNumber){
 const response=await context.request.post('http://localhost:3002/api/inventory/receipts',{data:{purchaseOrderId:orderId,branchId:branch.id,idempotencyKey:crypto.randomUUID(),lines:[{materialId:material.id,lotNumber,expiryDate:new Date(Date.now()+86400000*180).toISOString(),quantityAccepted:quantity,quantityRejected:0}]}});
 assert.equal(response.status(),201,await response.text());
}
await receive(2,sku+'-PARTIAL');
await page.reload();
assert.equal((await valueFor('On order / awaiting delivery')).trim(),'3 BOX');
assert.equal((await valueFor('Projected stock after delivery')).trim(),'11 BOX');
assert.equal((await db.stockLot.aggregate({where:{materialId:material.id,branchId:branch.id},_sum:{quantityOnHand:true}}))._sum.quantityOnHand,8);
await receive(3,sku+'-FINAL');
await page.goto('http://localhost:3002/inventory?view=catalog');
assert.equal((await valueFor('On order / awaiting delivery')).trim(),'0 BOX');
assert.equal((await valueFor('Projected stock after delivery')).trim(),'11 BOX');
assert.equal((await db.stockLot.aggregate({where:{materialId:material.id,branchId:branch.id},_sum:{quantityOnHand:true}}))._sum.quantityOnHand,11);
console.log('PASS order appears on low stock page; 5 incoming then 3 after partial receipt; available stock changes 6 -> 8 -> 11 and incoming reaches 0.');

console.log('PASS stock 6, reorder point 10, deficit 4; lead time 7 saved; reorder form preselects product, branch and 5-unit quantity.');}finally{if(browser)await browser.close();if(session)await db.session.delete({where:{id:session.id}});if(orderId)await db.purchaseOrder.delete({where:{id:orderId}});if(material)await db.material.delete({where:{id:material.id}});await db.$disconnect()}})().catch(e=>{console.error(e.message);process.exit(1)});
