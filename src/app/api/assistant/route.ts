import { NextResponse } from 'next/server';
import { getOperationalUser } from '@/lib/operational-auth';
import { hasRole } from '@/lib/rbac';
import { Role } from '@prisma/client';
import db from '@/lib/db';
import { getCairoDayBounds } from '@/lib/cairo-date';
import { getOwnerProfitabilityReport } from '@/services/platform-extensions.service';

export async function POST(req: Request) {
  try {
    const user = await getOperationalUser();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { query, pathname } = await req.json();
    const q = String(query || '').toLowerCase().trim();
    const primaryRole = user.roleGrants.some((g) => g.role === Role.OWNER_ADMIN)
      ? 'OWNER_ADMIN'
      : user.roleGrants[0]?.role || 'PATIENT';
    const assignedBranchId = user.roleGrants.find((g) => g.branchId)?.branchId || undefined;
    const { start, end } = getCairoDayBounds();

    // Enforce strict role boundaries: non-owners cannot query owner profit, salary, or payroll
    if (
      primaryRole !== 'OWNER_ADMIN' &&
      (q.includes('profit') || q.includes('salary') || q.includes('payroll') || q.includes('commission') || q.includes('ربح') || q.includes('رواتب'))
    ) {
      return NextResponse.json({
        answer: 'Access restricted: Executive profitability, commission rules, and staff payroll figures are restricted to Owner / Executive accounts.',
        scope: `${primaryRole} (${assignedBranchId ? 'Assigned Branch' : 'Scoped'})`,
        sources: [],
        actions: [],
      });
    }

    // 1. Tooth navigation command for Dentist ("open tooth 16", "tooth 36", "أسنان")
    const toothMatch = q.match(/tooth\s*#?(\d{2})|سن\s*(\d{2})/);
    if (toothMatch && hasRole(user, [Role.DENTIST, Role.OWNER_ADMIN])) {
      const toothNum = toothMatch[1] || toothMatch[2];
      return NextResponse.json({
        answer: `Selected Tooth #${toothNum} in the FDI Odontogram. Any clinical diagnosis or restoration change requires your explicit review and Save action.`,
        scope: `Dentist Clinical Workspace · FDI Tooth #${toothNum}`,
        sources: [`ToothFinding ledger for #${toothNum}`],
        actions: [{ label: `Highlight Tooth #${toothNum}`, href: `${pathname || '/dentist'}?tooth=${toothNum}` }],
      });
    }

    // 2. Receptionist / Dentist: "Who has not arrived?" / "queue" / "waiting"
    if (q.includes('arrived') || q.includes('queue') || q.includes('waiting') || q.includes('انتظار') || q.includes('حضور')) {
      const [todayAppts, waitingQueue] = await Promise.all([
        db.appointment.findMany({
          where: {
            ...(assignedBranchId ? { branchId: assignedBranchId } : {}),
            appointmentDate: { gte: start, lt: end },
            status: 'CONFIRMED',
          },
          include: { patient: { select: { fullName: true } }, arrivalEvent: true },
        }),
        db.queueEntry.findMany({
          where: {
            ...(assignedBranchId ? { branchId: assignedBranchId } : {}),
            enteredAt: { gte: start, lt: end },
            status: { in: ['WAITING', 'CALLED', 'IN_CONSULTATION'] },
          },
          include: { patient: { select: { fullName: true } } },
        }),
      ]);
      const notArrived = todayAppts.filter((a) => !a.arrivalEvent);
      return NextResponse.json({
        answer: `Today's live clinic status: ${waitingQueue.length} patient(s) currently active in the queue (${waitingQueue.map((w) => `${w.patient.fullName} [${w.status}]`).join(', ') || 'none'}), and ${notArrived.length} confirmed booking(s) have not yet checked in at reception (${notArrived.slice(0, 4).map((a) => `${a.patient.fullName} at ${a.startTime}`).join(', ') || 'all arrived'}).`,
        scope: assignedBranchId ? `Assigned Branch · Today (${start.toISOString().slice(0, 10)})` : `All Authorized Branches · Today`,
        sources: [`Appointments (${todayAppts.length} confirmed)`, `QueueEntries (${waitingQueue.length} active)`],
        actions: [
          { label: 'Open Live Queue & Check-In', href: '/reception' },
          { label: 'View Appointment Calendar', href: '/reception/agenda' },
        ],
      });
    }

    // 3. Follow-ups / Recalls due
    if (q.includes('follow') || q.includes('recall') || q.includes('متابع')) {
      const followUps = await db.followUp.findMany({
        where: {
          ...(assignedBranchId ? { branchId: assignedBranchId } : {}),
          status: 'PENDING',
        },
        include: { patient: { select: { fullName: true } } },
        take: 10,
      });
      return NextResponse.json({
        answer: `There are ${followUps.length} pending clinical follow-up/recall cases due (${followUps.slice(0, 4).map((f) => `${f.patient.fullName}: ${f.procedureType}`).join('; ') || 'none pending'}).`,
        scope: assignedBranchId ? 'Assigned Branch Scope' : 'All Branches Scope',
        sources: [`FollowUp table (${followUps.length} pending records)`],
        actions: [{ label: 'Open Follow-Up & Recall Queue', href: primaryRole === 'DENTIST' ? '/dentist/tasks' : '/crm?view=retention' }],
      });
    }

    // 4. Low stock / Inventory
    if (q.includes('stock') || q.includes('inventory') || q.includes('مخزون') || q.includes('نواقص')) {
      const lots = await db.stockLot.findMany({
        where: { ...(assignedBranchId ? { branchId: assignedBranchId } : {}), isQuarantined: false },
        include: { material: true, branch: true },
      });
      const lowItems = lots.filter((l) => l.quantityOnHand <= l.material.reorderPoint);
      return NextResponse.json({
        answer: `Inventory check: ${lowItems.length} batch position(s) are at or below reorder threshold (${lowItems.slice(0, 4).map((l) => `${l.material.nameEn} [${l.quantityOnHand} ${l.material.unit} in ${l.branch.code}]`).join(', ') || 'all stock healthy'}).`,
        scope: assignedBranchId ? 'Assigned Branch Stock' : 'All Branches Stock',
        sources: [`StockLot & Material tables (${lots.length} active lots)`],
        actions: [{ label: 'View Low-Stock Items', href: '/inventory?view=low' }],
      });
    }

    // 5. Owner Executive: Collections, Revenue, Profit, Branch Comparison, Overdue
    if (hasRole(user, [Role.OWNER_ADMIN])) {
      const report = await getOwnerProfitabilityReport(assignedBranchId);
      const fmt = (p: number) => `EGP ${(p / 100).toLocaleString()}`;
      return NextResponse.json({
        answer: `Executive Financial & Operational Summary (All Authorized Branches): Gross Billed Revenue is ${fmt(report.summary.grossBilledPiasters)}, Posted Collections are ${fmt(report.summary.collectedPiasters)}, Outstanding Receivables are ${fmt(report.summary.outstandingReceivablesPiasters)}, Lab & Material Costs are ${fmt(report.summary.labCostsPiasters + report.summary.materialCostsPiasters)}, Dentist Commissions are ${fmt(report.summary.dentistCommissionsPiasters)}, and Net Profit is ${fmt(report.summary.netProfitPiasters)} (${report.summary.profitMarginPercent}% margin).`,
        scope: 'Owner / Executive All-Branches Consolidated Scope',
        sources: [
          `Invoices (${report.recentInvoices.length} active)`,
          `LabOrders (${report.labOrders.length} tracked)`,
          `CommissionSnapshots & Expenses`,
        ],
        actions: [
          { label: 'Open Executive Overview', href: '/management' },
          { label: 'Compare Branches', href: '/management?view=branches' },
          { label: 'View Finance & Profitability', href: '/management?view=finance' },
        ],
      });
    }

    // Default grounded response for Receptionist / Dentist
    return NextResponse.json({
      answer: `Grounded Assistant ready for ${user.fullName} (${primaryRole}). You can ask: "Who has not arrived today?", "What follow-ups are due?", "Check low-stock items", or "Open tooth 16". All actions require your explicit human confirmation.`,
      scope: `${primaryRole} Permitted Scope`,
      sources: ['Live PostgreSQL clinic records'],
      actions: [{ label: 'Go to Workspace Home', href: primaryRole === 'DENTIST' ? '/dentist' : '/reception' }],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Assistant query failed' }, { status: 400 });
  }
}
