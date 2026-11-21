'use client';
import {cairoDate} from '@/lib/scheduling-rules';
import {LocalizedInput} from '@/components/LocalizedControls';

import {TranslatedText} from '@/components/TranslatedText';


import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {useSearchParams} from 'next/navigation';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { StatusTag } from '@/components/ui/StatusTag';
import { PastelKpiCard } from '@/components/charts/InteractiveCharts';
import { 
  Truck, 
  ShoppingCart, 
  Plus, 
  Building2, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  RefreshCw,
  PackageCheck,
  FileText,
  DollarSign,
  ArrowRight
} from 'lucide-react';

interface Props {
  currentUser: any;
  branches: Array<{ id: string; code: string; name: string }>;
  suppliers: any[];
  materials: any[];
  initialOrders: any[];
}

export function PurchasingWorkspaceClient({
  currentUser,
  branches,
  suppliers,
  materials,
  initialOrders,
}: Props) {
  const router = useRouter();
  const params=useSearchParams();
  const requestedMaterial=materials.find(material=>material.id===params.get('materialId'));
  const requestedBranch=branches.find(branch=>branch.id===params.get('branchId'));
  const enteredQuantity=Number(params.get('quantity'));
  const requestedQuantity=Number.isSafeInteger(enteredQuantity)&&enteredQuantity>0?enteredQuantity:1;
  const [orders, setOrders] = useState<any[]>(initialOrders);
  useEffect(()=>setOrders(initialOrders),[initialOrders]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(requestedBranch?.id || branches[0]?.id || '');
  const [showPOModal, setShowPOModal] = useState(params.get("reorder")==="1"&&!!requestedMaterial&&!!requestedBranch);
  const [showReceiveModal, setShowReceiveModal] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  // New PO form state
  const [poSupplierId, setPoSupplierId] = useState(suppliers[0]?.id || '');
  const [poLines, setPoLines] = useState<Array<{ materialId: string; quantityOrdered: number; unitCostEgp: number }>>([
    { materialId: requestedMaterial?.id || materials[0]?.id || '', quantityOrdered: requestedMaterial ? requestedQuantity : 10, unitCostEgp: ((requestedMaterial||materials[0])?.unitCostPiasters || 0) / 100 }
  ]);
  const [poNotes, setPoNotes] = useState('');
  const [savingPO, setSavingPO] = useState(false);

  // Goods receipt form state
  const [goodsLines, setGoodsLines] = useState<any[]>([]);
  const [savingReceipt, setSavingReceipt] = useState(false);

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  async function handleCreatePO(e: React.FormEvent) {
    e.preventDefault();
    setSavingPO(true);
    setNotification(null);

    try {
      const res = await fetch('/api/inventory/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: selectedBranchId,
          supplierId: poSupplierId,
          notes: poNotes,
          lines: poLines.map((l) => ({
            materialId: l.materialId,
            quantityOrdered: Number(l.quantityOrdered),
            unitCostPiasters: Math.round(Number(l.unitCostEgp) * 100),
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit purchase order');

      setNotification({ message: `Purchase Order #${data.order.poNumber} created successfully.`, type: 'success' });
      setShowPOModal(false);
      setOrders(currentOrders => [data.order, ...currentOrders]);
    } catch (err: any) {
      setNotification({ message: err.message, type: 'error' });
    } finally {
      setSavingPO(false);
    }
  }

  function handleOpenReceiveModal(order: any) {
    setShowReceiveModal({...order,receiptKey:crypto.randomUUID()});
    const lines = order.lines.filter((line:any)=>line.quantityOrdered>line.quantityReceived).map((l: any) => ({
      materialId: l.materialId,
      materialName: l.material.nameEn,
      lotNumber: '',
      expiryDate: '',
      quantityAccepted: l.quantityOrdered - l.quantityReceived,
      quantityRejected: 0,
      rejectionReason: '',
    }));
    setGoodsLines(lines);
  }

  async function handleReceiveGoods(e: React.FormEvent) {
    e.preventDefault();
    if (!showReceiveModal) return;
    setSavingReceipt(true);
    setNotification(null);

    try {
      const res = await fetch('/api/inventory/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idempotencyKey:showReceiveModal.receiptKey,
          purchaseOrderId: showReceiveModal.id,
          branchId: showReceiveModal.branchId,
          supplierId: showReceiveModal.supplierId,
          lines: goodsLines.filter(line=>Number(line.quantityAccepted)>0||Number(line.quantityRejected)>0).map((gl) => ({
            materialId: gl.materialId,
            lotNumber: gl.lotNumber,
            expiryDate: gl.expiryDate,
            quantityAccepted: Number(gl.quantityAccepted),
            quantityRejected: Number(gl.quantityRejected),
            rejectionReason: gl.rejectionReason,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record goods receipt');

      if(data.order)setOrders(current=>current.map(order=>order.id===data.order.id?data.order:order));
      setNotification({ message: 'Goods received and clinical stock updated.', type: 'success' });
      setShowReceiveModal(null);
      router.push('/inventory?'+new URLSearchParams({view:"catalog",branchId:data.receipt.branchId,materialId:data.receipt.lines[0].materialId}).toString());
      router.refresh();
    } catch (err: any) {
      setNotification({ message: err.message, type: 'error' });
    } finally {
      setSavingReceipt(false);
    }
  }

  const completedPOCount = orders.filter((o) => o.status === 'FULFILLED').length;
  const pendingPOCount = orders.filter((o) => o.status === 'ISSUED' || o.status === 'PARTIALLY_RECEIVED').length;
  const cancelledPOCount = orders.filter((o) => o.status === 'CANCELLED').length;

  return (
    <div className="eb-role-page eb-purchasing max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1. TOP HEADER (Matching Image 2: Purchasing & Inventory) */}
      <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-slate-100 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF9F1] text-[#2446A6] text-xs font-bold border border-[#D4F3E2]">
              <span className="w-2 h-2 rounded-full bg-[#2446A6] animate-pulse" />
              <span><TranslatedText text="PROCUREMENT &amp; DENTAL SUPPLIES" /></span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight"> <TranslatedText text="Purchasing &amp; Supplier Orders" /> </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl"> <TranslatedText text="Purchase requests, purchase order issuance, vendor lead times, and 3-way goods receiving match." /> </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="p-1 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center">
              <Building2 className="w-4 h-4 text-slate-400 ml-3 rtl:ml-0 rtl:mr-3" />
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 px-3 py-1.5 outline-none cursor-pointer"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    <TranslatedText text={String(b.name)}/> ({b.code})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowPOModal(true)}
              className="px-4 py-2 bg-[#2446A6] hover:bg-[#0c6b65] text-white rounded-full text-xs font-bold transition-all shadow-xs flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span><TranslatedText text="Create Purchase Order" /></span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. PASTEL KPI PILLS (Matching Image 2) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <PastelKpiCard
          title="Active Orders"
          value={String(orders.length)}
          color="mint"
          subtitle="All POs on record"
        />
        <PastelKpiCard
          title="Pending Delivery"
          value={String(pendingPOCount)}
          color="peach"
          subtitle="En route from vendor"
        />
        <PastelKpiCard
          title="Completed PO"
          value={String(completedPOCount)}
          color="mint"
          subtitle="Goods inspected & credited"
        />
        <PastelKpiCard
          title="Rejected / Discrepancies"
          value={String(cancelledPOCount)}
          color="rose"
          subtitle="Return / damage logs"
        />
      </div>

      {notification && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-xs underline"> <TranslatedText text="Dismiss" /> </button>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-[28px] border border-slate-100 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-[#2446A6]" />
            <span><TranslatedText text="Active &amp; Historic Purchase Orders" /></span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">{orders.length} <TranslatedText text="orders on file" /></span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <th className="py-3 px-4"><TranslatedText text="PO Number" /></th>
                <th className="py-3 px-4"><TranslatedText text="Branch" /></th>
                <th className="py-3 px-4"><TranslatedText text="Supplier" /></th>
                <th className="py-3 px-4"><TranslatedText text="Date Issued" /></th>
                <th className="py-3 px-4"><TranslatedText text="Total Amount" /></th>
                <th className="py-3 px-4 text-center"><TranslatedText text="PO Workflow Status" /></th>
                <th className="py-3 px-4 text-right"><TranslatedText text="Actions" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((po) => {
                const totalPiasters =
                  po.totalAmountPiasters ||
                  po.lines.reduce(
                    (s: number, l: any) => s + (l.totalCostPiasters || (l.quantityOrdered || 0) * (l.unitCostPiasters || 0)),
                    0
                  );
                const totalEgp = totalPiasters / 100;
                const stepIdx =
                  po.status === 'RECEIVED'
                    ? 4
                    : po.status === 'PARTIALLY_RECEIVED'
                    ? 3
                    : po.status === 'SENT_TO_SUPPLIER' || po.status === 'APPROVED' || po.status === 'ISSUED'
                    ? 2
                    : 1;
                return (
                  <tr key={po.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{po.poNumber || po.orderNumber}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700"><TranslatedText text={String(po.branch?.name)}/></td>
                    <td className="py-3.5 px-4 text-slate-800"><TranslatedText text={String(po.supplier?.name)}/></td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(po.issuedAt || po.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{totalEgp.toLocaleString()} <TranslatedText text="EGP" /></td>
                    <td className="py-3.5 px-4 text-center min-w-[180px]">
                      <div className="flex flex-col items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          po.status === 'RECEIVED' ? 'bg-emerald-100 text-emerald-800' :
                          po.status === 'PARTIALLY_RECEIVED' ? 'bg-amber-100 text-amber-800' :
                          po.status === 'SENT_TO_SUPPLIER' ? 'bg-blue-100 text-blue-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          <TranslatedText text={String(po.status)}/>
                        </span>
                        <div className="flex items-center gap-1">
                          {['Req', 'Sent', 'Part', 'Recv'].map((lbl, idx) => (
                            <span
                              key={lbl}
                              className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                                idx + 1 <= stepIdx
                                  ? idx + 1 === 4
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-[#0A4D8C] text-white'
                                  : 'bg-slate-100 text-slate-400'
                              }`}
                            >
                              {lbl}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {['ISSUED','PARTIALLY_RECEIVED'].includes(po.status) ? (
                        <button
                          onClick={() => handleOpenReceiveModal(po)}
                          className="eb-semantic-action eb-semantic-action--neutral eb-semantic-action--small"
                        > <TranslatedText text="Receive Goods" /> </button>
                      ) : (
                        <span className="text-slate-400 text-xs"><TranslatedText text="Fulfilled" /></span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400"> <TranslatedText text="No purchase orders recorded. Click &quot;Create Purchase Order&quot; to begin." /> </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PO Creation Modal */}
      {showPOModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900"><TranslatedText text="Issue Purchase Order" /></h3>
            <form onSubmit={handleCreatePO} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1"><TranslatedText text="Select Supplier" /></label>
                <select
                  value={poSupplierId}
                  onChange={(e) => setPoSupplierId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  required
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      <TranslatedText text={String(s.name)}/> ({s.contactPerson})
                    </option>
                  ))}
                </select>
              </div>

              {poLines.map((line, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800"><TranslatedText text="Item #" />{idx + 1}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2">
                      <select
                        value={line.materialId}
                        onChange={(e) => {
                          const mat = materials.find((m) => m.id === e.target.value);
                          setPoLines(
                            poLines.map((l, i) =>
                              i === idx
                                ? { ...l, materialId: e.target.value, unitCostEgp: (mat?.unitCostPiasters || 50000) / 100 }
                                : l
                            )
                          );
                        }}
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl"
                      >
                        {materials.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.nameEn} ({m.sku})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <LocalizedInput
                        type="number"
                        min="1"
                        value={line.quantityOrdered}
                        onChange={(e) =>
                          setPoLines(
                            poLines.map((l, i) =>
                              i === idx ? { ...l, quantityOrdered: Number(e.target.value) } : l
                            )
                          )
                        }
                        placeholder="Qty"
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div>
                <label className="block font-bold text-slate-700 mb-1"><TranslatedText text="Notes / Quotation Reference" /></label>
                <LocalizedInput
                  type="text"
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  placeholder="e.g. Approved quote Q-2026-04"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPOModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                > <TranslatedText text="Cancel" /> </button>
                <button
                  type="submit"
                  disabled={savingPO}
                  className="px-5 py-2 bg-eb-blue hover:bg-eb-navy text-white rounded-xl font-bold"
                >
                  <TranslatedText text={String(savingPO ? 'Submitting...' : 'Submit Purchase Order')}/>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receive Goods Modal */}
      {showReceiveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900"> <TranslatedText text="Receive Delivery for PO #" />{showReceiveModal.poNumber}
            </h3>
            <form onSubmit={handleReceiveGoods} className="space-y-4 text-xs">
              {goodsLines.map((gl, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-900 text-sm">{gl.materialName}</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="block text-xs text-slate-500 font-bold uppercase"><TranslatedText text="Accepted Qty" /></label>
                      <input
                        type="number"
                        min="0"
                        value={gl.quantityAccepted}
                        onChange={(e) =>
                          setGoodsLines(
                            goodsLines.map((line, idx) =>
                              idx === i ? { ...line, quantityAccepted: Number(e.target.value) } : line
                            )
                          )
                        }
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-emerald-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 font-bold uppercase"><TranslatedText text="Rejected Qty" /></label>
                      <input
                        type="number"
                        min="0"
                        value={gl.quantityRejected}
                        onChange={(e) =>
                          setGoodsLines(
                            goodsLines.map((line, idx) =>
                              idx === i ? { ...line, quantityRejected: Number(e.target.value) } : line
                            )
                          )
                        }
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-rose-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 font-bold uppercase"><TranslatedText text="Lot Number" /></label>
                      <input
                        type="text"
                        required={gl.quantityAccepted>0}
                        aria-label="Supplier batch / lot number"
                        value={gl.lotNumber}
                        onChange={(e) =>
                          setGoodsLines(
                            goodsLines.map((line, idx) =>
                              idx === i ? { ...line, lotNumber: e.target.value } : line
                            )
                          )
                        }
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 font-bold uppercase"><TranslatedText text="Expiry Date" /></label>
                      <input
                        type="date"
                        required={gl.quantityAccepted>0}
                        min={cairoDate()}
                        aria-label="Expiry date printed on delivered goods"
                        value={gl.expiryDate}
                        onChange={(e) =>
                          setGoodsLines(
                            goodsLines.map((line, idx) =>
                              idx === i ? { ...line, expiryDate: e.target.value } : line
                            )
                          )
                        }
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl font-mono"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReceiveModal(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                > <TranslatedText text="Cancel" /> </button>
                <button
                  type="submit"
                  disabled={savingReceipt}
                  className="eb-semantic-action eb-semantic-action--success"
                >
                  <TranslatedText text={String(savingReceipt ? 'Verifying...' : 'Confirm Goods Receipt')}/>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
