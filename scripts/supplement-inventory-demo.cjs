const fs = require('fs');
const {PrismaClient} = require('@prisma/client');

const source = process.env.DATABASE_URL || fs.readFileSync('.env','utf8').match(/^DATABASE_URL\s*=\s*(.+)$/m)[1].trim().replace(/^["']|["']$/g,'');
const url = new URL(source);
url.pathname = '/ebtesamty_presentation';
const db = new PrismaClient({datasourceUrl:url.toString()});

const supplies = [
  {sku:'DEMO-MASKS',nameEn:'Surgical masks — three ply',nameAr:'كمامات جراحية ثلاثية الطبقات',category:'PPE',unit:'BOX',reorderPoint:12,leadTimeDays:3,unitCostPiasters:450000,quantities:[4,0,18]},
  {sku:'DEMO-ANAESTHETIC',nameEn:'Local anaesthetic cartridges',nameAr:'خراطيش التخدير الموضعي',category:'ANESTHETICS',unit:'BOX',reorderPoint:8,leadTimeDays:7,unitCostPiasters:1800000,quantities:[2,10,3]},
  {sku:'DEMO-COMPOSITE',nameEn:'Universal composite resin — A2',nameAr:'راتنج كومبوزيت — A2',category:'COMPOSITES',unit:'SYRINGE',reorderPoint:6,leadTimeDays:5,unitCostPiasters:950000,quantities:[1,8,0]},
  {sku:'DEMO-BOND',nameEn:'Dental bonding adhesive',nameAr:'لاصق حشوات الأسنان',category:'RESTORATIVE',unit:'BOTTLE',reorderPoint:4,leadTimeDays:6,unitCostPiasters:1200000,quantities:[0,2,6]},
  {sku:'DEMO-POUCHES',nameEn:'Self-sealing sterilization pouches',nameAr:'أكياس تعقيم ذاتية الغلق',category:'STERILIZATION',unit:'PACK',reorderPoint:15,leadTimeDays:4,unitCostPiasters:380000,quantities:[7,12,20]},
  {sku:'DEMO-SUCTION',nameEn:'Disposable saliva ejectors',nameAr:'شفاطات لعاب أحادية الاستخدام',category:'DISPOSABLES',unit:'PACK',reorderPoint:10,leadTimeDays:3,unitCostPiasters:260000,quantities:[3,0,14]},
  {sku:'DEMO-BURS',nameEn:'Diamond dental burs — assorted',nameAr:'سنابل أسنان ماسية متنوعة',category:'BURS',unit:'PACK',reorderPoint:5,leadTimeDays:10,unitCostPiasters:1450000,quantities:[1,6,2]},
];

(async()=>{
  const marker=await db.auditEvent.findFirst({where:{action:'FICTIONAL_DEMO_INITIALIZED'}});
  if(!marker)throw Error('The fictional presentation dataset must be initialized first.');
  const actor=await db.user.findUniqueOrThrow({where:{id:'demo-user-inventory'}});
  const branches=await db.branch.findMany({where:{code:{in:['BR-A','BR-B','BR-C']}},orderBy:{code:'asc'}});
  if(branches.length!==3)throw Error('Expected the three presentation branches.');
  await db.$transaction(async tx=>{
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('presentation-supply-variety'))`;
    await tx.material.updateMany({where:{sku:'DEMO-GLOVES',leadTimeDays:null},data:{leadTimeDays:5}});
    for(const item of supplies){
      const {quantities,...product}=item;
      const material=await tx.material.upsert({where:{sku:item.sku},update:{},create:product});
      for(const [index,branch] of branches.entries()){
        const lotNumber='PRESENTATION-OPENING-'+item.sku+'-'+branch.code;
        const exists=await tx.stockLot.findUnique({where:{materialId_branchId_lotNumber:{materialId:material.id,branchId:branch.id,lotNumber}}});
        if(exists)continue;
        const quantity=quantities[index];
        const expiryDate=new Date(Date.now()+86400000*(item.sku==='DEMO-BOND'&&index===1?45:365));
        const lot=await tx.stockLot.create({data:{materialId:material.id,branchId:branch.id,lotNumber,quantityOnHand:quantity,expiryDate}});
        if(quantity)await tx.stockMovement.create({data:{materialId:material.id,branchId:branch.id,lotId:lot.id,movementType:'COUNT_ADJUSTMENT',quantity,referenceId:'PRESENTATION-SUPPLY-VARIETY',notes:'Fictional opening balance for inventory demonstrations.',performedByUserId:actor.id}});
        await tx.auditEvent.create({data:{actorUserId:actor.id,action:'FICTIONAL_STOCK_OPENING',entityType:'StockLot',entityId:lot.id,branchId:branch.id,metadataJson:{sku:item.sku,quantity}}});
      }
    }
  });
  console.log('Presentation inventory contains gloves plus seven distinct dental supply products, with branch-specific stock, reorder points and fictional lead-time estimates.');
})().catch(error=>{console.error(error.message);process.exitCode=1}).finally(()=>db.$disconnect());
