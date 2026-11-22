import {StockWorkspace} from './StockWorkspace';
import {getOperationalUser} from '@/lib/operational-auth';


import {TranslatedText} from '@/components/TranslatedText';
import {branchScope} from '@/lib/rbac';
import {EquipmentDeskClient} from '@/app/operations/equipment/EquipmentDeskClient';
import {getEquipmentAssets,getEquipmentSummary,getWorkOrders} from '@/services/equipment.service';
import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { hasRole } from '@/lib/rbac';
import { Role } from '@/lib/prisma-shim';
import db from '@/lib/db';
import { getMaterialCatalog, getSuppliers, getStockBalances } from '@/services/inventory.service';
import { InventoryDeskClient } from './InventoryDeskClient';

export default async function InventoryPage({searchParams}:{searchParams:{view?:string}}) {
  const user = await getOperationalUser();
  if (!user) {
    redirect('/auth/login');
  }

  // RBAC: Inventory & Replenishment is restricted to Branch Managers, Inventory Officers, and Clinic Executives (IA-01, IA-02)
  const allowed = hasRole(user, [
    Role.OWNER_ADMIN,
    Role.INVENTORY,
  ]);

  if (!allowed) {
    return (
      <div className="max-w-2xl mx-auto mt-16 p-8 bg-white rounded-3xl border border-red-200 shadow-sm text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 font-bold text-lg">
          403
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2"> <TranslatedText text="Access Denied: Inventory Authority Required" /> </h1>
        <p className="text-xs text-slate-500 mb-6"> <TranslatedText text="You are signed in as" /> <span className="font-semibold text-slate-800">{user.fullName}</span> <TranslatedText text=". Inventory management requires clinic staff or management authority." /> </p>
      </div>
    );
  }

  const branches = await db.branch.findMany({
    where: { isActive: true, id:branchScope(user,['INVENTORY','OWNER_ADMIN']) },
    select: { id: true, code: true, name: true },
    orderBy: { code: 'asc' },
  });

  if(searchParams.view==='equipment'){const id=branches[0]?.id;if(!id)return <p><TranslatedText text="No authorized branch." /></p>;const [assets,summary,orders]=await Promise.all([getEquipmentAssets(id),getEquipmentSummary(id),getWorkOrders(id)]);return <EquipmentDeskClient currentUser={user} branches={branches} initialAssets={assets} initialSummary={summary} initialWorkOrders={orders}/>;}
  if (!searchParams.view || ['catalog','low','expiry'].includes(searchParams.view)) {
    const products=await db.material.findMany({where:{isActive:true},include:{lots:{where:{branchId:{in:branches.map(b=>b.id)}}}},orderBy:{nameEn:'asc'}});
    const openLines=await db.purchaseOrderLine.findMany({
      where:{purchaseOrder:{branchId:{in:branches.map(branch=>branch.id)},status:{in:['ISSUED','PARTIALLY_RECEIVED']}}},
      select:{materialId:true,quantityOrdered:true,quantityReceived:true,purchaseOrder:{select:{id:true,poNumber:true,branchId:true}}}
    });
    const stock=products.flatMap(material=>branches.map(branch=>({material,branch,incomingOrders:openLines.filter(line=>line.materialId===material.id&&line.purchaseOrder.branchId===branch.id&&line.quantityOrdered>line.quantityReceived).map(line=>({id:line.purchaseOrder.id,number:line.purchaseOrder.poNumber,remaining:line.quantityOrdered-line.quantityReceived})),lots:material.lots.filter(l=>l.branchId===branch.id).map(l=>({...l,expiryDate:l.expiryDate.toISOString()}))})));
    const movements=await db.stockMovement.findMany({where:{branchId:{in:branches.map(b=>b.id)},createdAt:{gte:new Date(Date.now()-30*86400000)}},select:{createdAt:true,branchId:true}});
    return <StockWorkspace stock={stock} view={searchParams.view||'overview'} movements={movements.map(m=>({...m,day:m.createdAt.toISOString().slice(0,10)}))}/>;
  }
  const [materials, suppliers] = await Promise.all([
    getMaterialCatalog(),
    getSuppliers(),
  ]);

  const defaultBranchId = branches[0]?.id || '';
  const initialBalances = defaultBranchId ? await getStockBalances(defaultBranchId) : [];

  return (
    <InventoryDeskClient
      currentUser={user}
      branches={branches}
      initialMaterials={materials}
      initialSuppliers={suppliers}
      initialBalances={initialBalances}
    />
  );
}
