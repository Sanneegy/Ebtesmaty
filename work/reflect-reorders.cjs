const fs=require('fs');const edit=(p,f)=>fs.writeFileSync(p,f(fs.readFileSync(p,'utf8')));
edit('src/app/inventory/page.tsx',s=>s.replace("    const stock=products.flatMap",`    const openLines=await db.purchaseOrderLine.findMany({
      where:{purchaseOrder:{branchId:{in:branches.map(branch=>branch.id)},status:{in:['ISSUED','PARTIALLY_RECEIVED']}}},
      select:{materialId:true,quantityOrdered:true,quantityReceived:true,purchaseOrder:{select:{id:true,poNumber:true,branchId:true}}}
    });
    const stock=products.flatMap`).replace("({material,branch,lots:material.lots","({material,branch,incomingOrders:openLines.filter(line=>line.materialId===material.id&&line.purchaseOrder.branchId===branch.id&&line.quantityOrdered>line.quantityReceived).map(line=>({id:line.purchaseOrder.id,number:line.purchaseOrder.poNumber,remaining:line.quantityOrdered-line.quantityReceived})),lots:material.lots"));
edit('src/app/inventory/StockWorkspace.tsx',s=>s.replace("import {useState}","import {useRouter} from 'next/navigation';\nimport {useEffect,useState}").replace('type Stock={material:','type Stock={incomingOrders:{id:string;number:string;remaining:number}[];material:').replace(" const {locale}=useLanguage()"," const router=useRouter();\n useEffect(()=>{router.refresh();const refresh=()=>router.refresh();window.addEventListener('focus',refresh);return()=>window.removeEventListener('focus',refresh)},[router]);\n const {locale}=useLanguage()").replace('materialId={r.material.id} branchId=', 'incomingOrders={r.incomingOrders} materialId={r.material.id} branchId=').replace('materialId={selected.material.id} branchId=', 'incomingOrders={selected.incomingOrders} materialId={selected.material.id} branchId='));
edit('src/app/inventory/ReorderControls.tsx',s=>s.replace("leadTimeDays}:{materialId","leadTimeDays,incomingOrders=[]}:{incomingOrders?:{id:string;number:string;remaining:number}[];materialId").replace(" const quantity=Math.max(1,reorderPoint-available+1);",` const onOrder=incomingOrders.reduce((sum,order)=>sum+order.remaining,0);
 const projected=available+onOrder;
 const remainingGap=Math.max(0,reorderPoint-projected);
 const quantity=Math.max(1,reorderPoint-projected+1);`));

