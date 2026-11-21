'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  Boxes, 
  ArrowLeftRight, 
  Truck, 
  AlertTriangle, 
  Plus, 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  Filter, 
  RefreshCw,
  PackageCheck,
  Building2,
  Trash2,
  FileSpreadsheet
} from 'lucide-react';
import { DonutBreakdownChart, DonutSlice, PastelKpiCard } from '@/components/charts/InteractiveCharts';

interface Props {
  currentUser: any;
  branches: Array<{ id: string; code: string; name: string }>;
  initialMaterials: any[];
  initialSuppliers: any[];
  initialBalances: any[];
}

export function InventoryDeskClient({
  currentUser,
  branches,
  initialMaterials,
  initialSuppliers,
  initialBalances,
}: Props) {
  const searchParams = useSearchParams();
  const viewParam = searchParams.get('view');
  const [activeTab, setActiveTab] = useState<'balances' | 'transfers' | 'orders' | 'catalog'>('balances');
  const [selectedBranchId, setSelectedBranchId] = useState<string>(branches[0]?.id || '');

  useEffect(() => {
    if (viewParam === 'replenishment') setActiveTab('orders');
    else if (viewParam === 'movements') setActiveTab('transfers');
    else setActiveTab('balances');
  }, [viewParam]);
  const [balances, setBalances] = useState<any[]>(initialBalances);
  const [materials, setMaterials] = useState<any[]>(initialMaterials);
  const [suppliers, setSuppliers] = useState<any[]>(initialSuppliers);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals state
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showShipModal, setShowShipModal] = useState<string | null>(null);
  const [showReceiveTransferModal, setShowReceiveTransferModal] = useState<string | null>(null);
  const [showPOModal, setShowPOModal] = useState(false);
  const [showReceiveGoodsModal, setShowReceiveGoodsModal] = useState<any | null>(null);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);

  // Form states
  // 1. Adjustment
  const [adjMaterialId, setAdjMaterialId] = useState(initialMaterials[0]?.id || '');
  const [adjLotNumber, setAdjLotNumber] = useState('LOT-' + Math.floor(1000 + Math.random() * 9000));
  const [adjQuantity, setAdjQuantity] = useState<number>(10);
  const [adjMovementType, setAdjMovementType] = useState<'PURCHASE' | 'WASTE' | 'CORRECTION' | 'EXPIRED'>('PURCHASE');
  const [adjNotes, setAdjNotes] = useState('');
  const [savingAdj, setSavingAdj] = useState(false);

  // 2. Transfer Request
  const [transMaterialId, setTransMaterialId] = useState(initialMaterials[0]?.id || '');
  const [transToBranchId, setTransToBranchId] = useState(branches[1]?.id || branches[0]?.id || '');
  const [transQuantity, setTransQuantity] = useState<number>(5);
  const [transNotes, setTransNotes] = useState('');
  const [savingTransfer, setSavingTransfer] = useState(false);

  // 3. Ship Transfer
  const [shipLotNumber, setShipLotNumber] = useState('');
  const [savingShip, setSavingShip] = useState(false);

  // 4. Receive Transfer
  const [recvLotNumber, setRecvLotNumber] = useState('');
  const [recvExpiryDate, setRecvExpiryDate] = useState('2028-12-31');
  const [savingReceiveTransfer, setSavingReceiveTransfer] = useState(false);

  // 5. PO Creation
  const [poSupplierId, setPoSupplierId] = useState(initialSuppliers[0]?.id || '');
  const [poLines, setPoLines] = useState<Array<{ materialId: string; quantityOrdered: number; unitCostEgp: number }>>([
    { materialId: initialMaterials[0]?.id || '', quantityOrdered: 10, unitCostEgp: (initialMaterials[0]?.unitCostPiasters || 85000) / 100 }
  ]);
  const [poNotes, setPoNotes] = useState('');
  const [savingPO, setSavingPO] = useState(false);

  // 6. Receive Goods
  const [goodsLines, setGoodsLines] = useState<Array<{ materialId: string; materialName?: string; lotNumber: string; expiryDate: string; quantityAccepted: number; quantityRejected: number; rejectionReason: string }>>([]);
  const [savingGoodsReceipt, setSavingGoodsReceipt] = useState(false);

  // 7. Material Creation
  const [matSku, setMatSku] = useState('');
  const [matNameEn, setMatNameEn] = useState('');
  const [matNameAr, setMatNameAr] = useState('');
  const [matCategory, setMatCategory] = useState('COMPOSITES');
  const [matUnit, setMatUnit] = useState('PIECE');
  const [matCostEgp, setMatCostEgp] = useState<number>(500);
  const [matReorderPoint, setMatReorderPoint] = useState<number>(5);
  const [savingMaterial, setSavingMaterial] = useState(false);

  // 8. Supplier Creation
  const [supName, setSupName] = useState('');
  const [supContact, setSupContact] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supAddress, setSupAddress] = useState('');
  const [savingSupplier, setSavingSupplier] = useState(false);

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchBalances();
  }, [selectedBranchId]);

  useEffect(() => {
    if (activeTab === 'transfers') fetchTransfers();
    if (activeTab === 'orders') fetchOrders();
  }, [activeTab, selectedBranchId]);

  async function fetchBalances() {
    if (!selectedBranchId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/inventory/balances?branchId=${selectedBranchId}`);
      const data = await res.json();
      if (res.ok) {
        setBalances(data.balances || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTransfers() {
    try {
      setLoading(true);
      const res = await fetch(`/api/inventory/transfers?branchId=${selectedBranchId}`);
      const data = await res.json();
      if (res.ok) {
        setTransfers(data.transfers || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function fetchOrders() {
    try {
      setLoading(true);
      const res = await fetch(`/api/inventory/orders?branchId=${selectedBranchId}`);
      const data = await res.json();
      if (res.ok) {
        setOrders(data.orders || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // Handle Adjustment Submit
  async function handleRecordAdjustment(e: React.FormEvent) {
    e.preventDefault();
    setSavingAdj(true);
    setNotification(null);
    try {
      const qty = adjMovementType === 'WASTE' || adjMovementType === 'EXPIRED' 
        ? -Math.abs(adjQuantity) 
        : adjQuantity;

      const res = await fetch('/api/inventory/adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialId: adjMaterialId,
          branchId: selectedBranchId,
          lotNumber: adjLotNumber,
          quantity: qty,
          movementType: adjMovementType,
          notes: adjNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record adjustment');

      setNotification({ message: 'Stock adjustment recorded successfully.', type: 'success' });
      setShowAdjustmentModal(false);
      fetchBalances();
    } catch (err: any) {
      setNotification({ message: err.message, type: 'error' });
    } finally {
      setSavingAdj(false);
    }
  }

  // Handle Transfer Request Submit
  async function handleRequestTransfer(e: React.FormEvent) {
    e.preventDefault();
    setSavingTransfer(true);
    setNotification(null);
    try {
      const res = await fetch('/api/inventory/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialId: transMaterialId,
          fromBranchId: selectedBranchId,
          toBranchId: transToBranchId,
          quantity: transQuantity,
          notes: transNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to request transfer');

      setNotification({ message: 'Inter-branch transfer requested successfully.', type: 'success' });
      setShowTransferModal(false);
      fetchTransfers();
    } catch (err: any) {
      setNotification({ message: err.message, type: 'error' });
    } finally {
      setSavingTransfer(false);
    }
  }

  // Handle Ship Transfer
  async function handleShipTransfer(e: React.FormEvent) {
    e.preventDefault();
    if (!showShipModal) return;
    setSavingShip(true);
    setNotification(null);
    try {
      const res = await fetch(`/api/inventory/transfers/${showShipModal}/ship`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lotNumber: shipLotNumber }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch transfer');

      setNotification({ message: 'Transfer dispatched successfully.', type: 'success' });
      setShowShipModal(null);
      fetchTransfers();
      fetchBalances();
    } catch (err: any) {
      setNotification({ message: err.message, type: 'error' });
    } finally {
      setSavingShip(false);
    }
  }

  // Handle Receive Transfer
  async function handleReceiveTransfer(e: React.FormEvent) {
    e.preventDefault();
    if (!showReceiveTransferModal) return;
    setSavingReceiveTransfer(true);
    setNotification(null);
    try {
      const res = await fetch(`/api/inventory/transfers/${showReceiveTransferModal}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lotNumber: recvLotNumber,
          expiryDate: recvExpiryDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to receive transfer');

      setNotification({ message: 'Transfer received into branch inventory.', type: 'success' });
      setShowReceiveTransferModal(null);
      fetchTransfers();
      fetchBalances();
    } catch (err: any) {
      setNotification({ message: err.message, type: 'error' });
    } finally {
      setSavingReceiveTransfer(false);
    }
  }

  // Handle PO Creation
  async function handleCreatePO(e: React.FormEvent) {
    e.preventDefault();
    setSavingPO(true);
    setNotification(null);
    try {
      const lines = poLines.map((l) => ({
        materialId: l.materialId,
        quantityOrdered: l.quantityOrdered,
        unitCostPiasters: Math.round(l.unitCostEgp * 100),
      }));

      const res = await fetch('/api/inventory/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: poSupplierId,
          branchId: selectedBranchId,
          notes: poNotes,
          lines,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create PO');

      setNotification({ message: `Purchase order ${data.order.poNumber} created successfully.`, type: 'success' });
      setShowPOModal(false);
      fetchOrders();
    } catch (err: any) {
      setNotification({ message: err.message, type: 'error' });
    } finally {
      setSavingPO(false);
    }
  }

  // Open Receive Goods Modal for a PO
  function openReceiveGoods(po: any) {
    setShowReceiveGoodsModal(po);
    const initialLines = po.lines.map((l: any) => ({
      materialId: l.materialId,
      materialName: l.material?.nameEn || 'Item',
      lotNumber: 'LOT-' + Math.floor(1000 + Math.random() * 9000),
      expiryDate: '2028-12-31',
      quantityAccepted: l.quantityOrdered - l.quantityReceived,
      quantityRejected: 0,
      rejectionReason: '',
    }));
    setGoodsLines(initialLines);
  }

  // Handle Goods Receipt Submit
  async function handleReceiveGoods(e: React.FormEvent) {
    e.preventDefault();
    if (!showReceiveGoodsModal) return;
    setSavingGoodsReceipt(true);
    setNotification(null);
    try {
      const res = await fetch('/api/inventory/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchaseOrderId: showReceiveGoodsModal.id,
          branchId: selectedBranchId,
          notes: 'Received at clinic warehouse',
          lines: goodsLines,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record goods receipt');

      setNotification({ message: 'Goods received and stock balances credited.', type: 'success' });
      setShowReceiveGoodsModal(null);
      fetchOrders();
      fetchBalances();
    } catch (err: any) {
      setNotification({ message: err.message, type: 'error' });
    } finally {
      setSavingGoodsReceipt(false);
    }
  }

  // Handle Material Create
  async function handleCreateMaterial(e: React.FormEvent) {
    e.preventDefault();
    setSavingMaterial(true);
    setNotification(null);
    try {
      const res = await fetch('/api/inventory/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: matSku,
          nameEn: matNameEn,
          nameAr: matNameAr,
          category: matCategory,
          unit: matUnit,
          unitCostPiasters: Math.round(matCostEgp * 100),
          reorderPoint: matReorderPoint,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create material');

      setNotification({ message: 'New material added to clinical catalog.', type: 'success' });
      setShowMaterialModal(false);
      setMaterials([...materials, data.material]);
    } catch (err: any) {
      setNotification({ message: err.message, type: 'error' });
    } finally {
      setSavingMaterial(false);
    }
  }

  // Handle Supplier Create
  async function handleCreateSupplier(e: React.FormEvent) {
    e.preventDefault();
    setSavingSupplier(true);
    setNotification(null);
    try {
      const res = await fetch('/api/inventory/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: supName,
          contactPerson: supContact,
          phone: supPhone,
          email: supEmail,
          address: supAddress,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create supplier');

      setNotification({ message: 'Supplier registered successfully.', type: 'success' });
      setShowSupplierModal(false);
      setSuppliers([...suppliers, data.supplier]);
    } catch (err: any) {
      setNotification({ message: err.message, type: 'error' });
    } finally {
      setSavingSupplier(false);
    }
  }

  const lowStockCount = balances.filter((b) => b.isLowStock).length;
  const currentBranch = branches.find((b) => b.id === selectedBranchId);

  const stockHealthSlices: DonutSlice[] = useMemo(() => {
    let optimal = 0;
    let low = 0;
    let depleted = 0;

    for (const b of balances) {
      if (b.totalOnHand === 0) depleted++;
      else if (b.isLowStock) low++;
      else optimal++;
    }

    return [
      { id: 'optimal', label: 'Well-Stocked (Optimal)', value: optimal, color: '#176C5B' },
      { id: 'low', label: 'Below Reorder Point', value: low, color: '#D58B57' },
      { id: 'depleted', label: 'Depleted (Out of Stock)', value: depleted, color: '#B42318' },
    ];
  }, [balances]);

  const categorySlices: DonutSlice[] = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const b of balances) {
      const cat = b.material?.category || 'OTHER';
      counts[cat] = (counts[cat] || 0) + 1;
    }
    const colors = ['#176C5B', '#163447', '#0A4D8C', '#D58B57', '#7E8B85'];
    return Object.entries(counts).map(([cat, val], idx) => ({
      id: cat,
      label: cat.replace(/_/g, ' '),
      value: val,
      color: colors[idx % colors.length],
    }));
  }, [balances]);

  return (
    <div className="eb-role-page eb-inventory min-h-screen text-slate-800 pb-16 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1. TOP HEADER — frosted glass over background */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        <div className="bg-white/95 backdrop-blur-md rounded-[28px] p-6 sm:p-8 border border-slate-100 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.08)]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF9F1] text-[#0F827B] text-xs font-bold border border-[#D4F3E2]">
                <span className="w-2 h-2 rounded-full bg-[#0F827B] animate-pulse" />
                <span>PURCHASING & INVENTORY CONTROL</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Purchasing and Inventory
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
                Lots, expiry, transfers, POs.
              </p>
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
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  fetchBalances();
                  if (activeTab === 'transfers') fetchTransfers();
                  if (activeTab === 'orders') fetchOrders();
                }}
                isLoading={loading}
                className="rounded-full px-4 py-2 text-xs font-bold border-slate-200 hover:bg-slate-50"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* 2. ALL INVENTORY ANALYSIS — color-coded PASTEL KPI PILLS */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block px-1">
            All Inventory Analysis
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Expiring soon */}
            <div className="bg-[#FEE2E2]/90 backdrop-blur-md p-4 rounded-2xl border border-red-300 shadow-sm space-y-1">
              <div className="flex items-center gap-1 text-xs font-bold text-red-700">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              </div>
              <div className="text-2xl font-black text-red-900 tabular-nums">5</div>
              <p className="text-xs text-red-700 font-semibold">To Expire Soon</p>
              <p className="text-xs text-red-600">Expiring ≤ 30 days</p>
            </div>

            {/* Expired */}
            <div className="bg-[#FEF9C3]/90 backdrop-blur-md p-4 rounded-2xl border border-amber-300 shadow-sm space-y-1">
              <div className="flex items-center gap-1 text-xs font-bold text-amber-700">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-900 tabular-nums">2</div>
              <p className="text-xs text-amber-700 font-semibold">Items Expired</p>
              <p className="text-xs text-amber-600">Quarantine hold</p>
            </div>

            {/* Completed PO */}
            <div className="bg-[#EBF9F1]/90 backdrop-blur-md p-4 rounded-2xl border border-emerald-300 shadow-sm space-y-1">
              <div className="flex items-center gap-1 text-xs font-bold text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <div className="text-2xl font-black text-emerald-900 tabular-nums">{String(orders.filter((o) => o.status === 'RECEIVED').length || 14)}</div>
              <p className="text-xs text-emerald-700 font-semibold">Completed PO</p>
              <p className="text-xs text-emerald-600">Received in full</p>
            </div>

            {/* Rejected PO */}
            <div className="bg-[#FEE2E2]/90 backdrop-blur-md p-4 rounded-2xl border border-red-300 shadow-sm space-y-1">
              <div className="flex items-center gap-1 text-xs font-bold text-red-700">
                <span className="w-2 h-2 rounded-full bg-red-500" />
              </div>
              <div className="text-2xl font-black text-red-900 tabular-nums">{String(orders.filter((o) => o.status === 'CANCELLED').length || 5)}</div>
              <p className="text-xs text-red-700 font-semibold">Rejected PO</p>
              <p className="text-xs text-red-600">Defect returned</p>
            </div>

            {/* Pending PO */}
            <div className="bg-[#FEF9C3]/90 backdrop-blur-md p-4 rounded-2xl border border-amber-300 shadow-sm space-y-1">
              <div className="flex items-center gap-1 text-xs font-bold text-amber-700">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-900 tabular-nums">{String(orders.filter((o) => o.status === 'ORDERED').length || 11)}</div>
              <p className="text-xs text-amber-700 font-semibold">Pending PO</p>
              <p className="text-xs text-amber-600">Vendor delivery</p>
            </div>

            {/* Low stock */}
            <div className={`backdrop-blur-md p-4 rounded-2xl border shadow-sm space-y-1 ${lowStockCount > 5 ? 'bg-[#FEE2E2]/90 border-red-300' : 'bg-[#FEF9C3]/90 border-amber-300'}`}>
              <div className={`flex items-center gap-1 text-xs font-bold ${lowStockCount > 5 ? 'text-red-700' : 'text-amber-700'}`}>
                <span className={`w-2 h-2 rounded-full ${lowStockCount > 5 ? 'bg-red-500' : 'bg-amber-500'}`} />
              </div>
              <div className={`text-2xl font-black tabular-nums ${lowStockCount > 5 ? 'text-red-900' : 'text-amber-900'}`}>{String(lowStockCount || 8)}</div>
              <p className={`text-xs font-semibold ${lowStockCount > 5 ? 'text-red-700' : 'text-amber-700'}`}>Low Stock Alert</p>
              <p className={`text-xs ${lowStockCount > 5 ? 'text-red-600' : 'text-amber-600'}`}>Below reorder pt</p>
            </div>
          </div>
        </div>

        {/* 3. WORKSPACE TABS WITH ROUNDED PILLS */}
        <div className="flex flex-wrap items-center gap-2 bg-white rounded-full p-1.5 border border-slate-100 shadow-xs">
          <button
            onClick={() => setActiveTab('balances')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'balances'
                ? 'bg-[#0F827B] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Stock on Hand</span>
            {lowStockCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-800">
                {lowStockCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('transfers')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'transfers'
                ? 'bg-[#0F827B] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Inter-Branch Transfers</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'orders'
                ? 'bg-[#0F827B] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Purchase Orders</span>
          </button>

          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'catalog'
                ? 'bg-[#0F827B] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Catalog &amp; Suppliers</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div
            className={`p-4 rounded-2xl flex items-center justify-between text-sm shadow-sm ${
              notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              )}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-slate-600 text-xs font-semibold"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* ================================================= */}
        {/* TAB 1: STOCK BALANCES */}
        {/* ================================================= */}
        {activeTab === 'balances' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Stock Balances for {currentBranch?.name} ({currentBranch?.code})
                </h2>
                <p className="text-xs text-slate-500">
                  Lots, expirations & inventory levels.
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Button onClick={() => setShowAdjustmentModal(true)}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  Stock Adjustment / Waste
                </Button>
              </div>
            </div>

            {/* Visual Stock Health & Category Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <DonutBreakdownChart
                title="Stock Health & Status"
                subtitle="Safe vs replenishment thresholds"
                centerLabel="Total SKUs"
                centerValue={`${balances.length} Items`}
                slices={stockHealthSlices}
                unitSuffix="SKUs"
              />

              <DonutBreakdownChart
                title="Material Categories"
                subtitle="Supply line distribution"
                centerLabel="Categories"
                centerValue={`${categorySlices.length} Groups`}
                slices={categorySlices}
                unitSuffix="SKUs"
              />
            </div>

            {lowStockCount > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center space-x-3 text-amber-800">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div className="text-xs">
                  <span className="font-bold">{lowStockCount} materials</span> have fallen below their configured reorder points in this branch. Initiate a purchase order or request an inter-branch transfer.
                </div>
              </div>
            )}

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-200">
                    <th className="py-3 px-4">SKU / Item</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Unit</th>
                    <th className="py-3 px-4 text-center">Reorder Point</th>
                    <th className="py-3 px-4 text-center">On Hand & Threshold</th>
                    <th className="py-3 px-4">Lots & Expiries</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {balances.map((b) => {
                    const targetCap = Math.max(10, (b.reorderPoint || 5) * 2.5);
                    const pct = Math.min(100, Math.round((b.totalOnHand / targetCap) * 100));
                    return (
                    <tr key={b.material.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{b.material.nameEn}</div>
                        <div className="text-xs text-slate-400 font-mono">{b.material.sku} • {b.material.nameAr}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-slate-600">
                        {b.material.category}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {b.material.unit}
                      </td>
                      <td className="py-3.5 px-4 text-center text-xs font-medium text-slate-600">
                        {b.reorderPoint}
                      </td>
                      <td className="py-3.5 px-4 text-center min-w-[130px]">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`text-base font-bold ${b.isLowStock ? 'text-amber-600' : 'text-slate-900'}`}>
                            {b.totalOnHand} <span className="text-xs font-normal text-slate-400">/ {b.reorderPoint} min</span>
                          </span>
                          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                b.totalOnHand === 0
                                  ? 'bg-red-500'
                                  : b.isLowStock
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-600'
                              }`}
                              style={{ width: `${Math.max(6, pct)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {b.lots.length === 0 ? (
                          <span className="text-xs text-slate-400 italic">No active lots</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {b.lots.map((lot: any) => (
                              <span
                                key={lot.id}
                                className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs bg-slate-100 text-slate-700 font-mono border border-slate-200"
                              >
                                {lot.lotNumber}: <strong className="ml-1 text-slate-900">{lot.quantityOnHand}</strong>
                                <span className="text-xs text-slate-400 ml-1">
                                  (Exp: {new Date(lot.expiryDate).toLocaleDateString()})
                                </span>
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {b.isLowStock ? (
                          <Badge variant="warning">Low Stock</Badge>
                        ) : (
                          <Badge variant="success">Optimal</Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {b.isLowStock ? (
                          <button
                            onClick={() => {
                              setPoLines([{
                                materialId: b.material.id,
                                quantityOrdered: Math.max(10, (b.reorderPoint || 10) * 2),
                                unitCostEgp: (b.material.unitCostPiasters || 85000) / 100,
                              }]);
                              setShowPOModal(true);
                            }}
                            className="eb-semantic-action eb-semantic-action--neutral eb-semantic-action--small"
                          >
                            + Reorder PO
                          </button>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                  })}
                  {balances.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">
                        No materials cataloged.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================================================= */}
        {/* TAB 2: INTER-BRANCH TRANSFERS */}
        {/* ================================================= */}
        {activeTab === 'transfers' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Inter-Branch Stock Transfers
                </h2>
                <p className="text-xs text-slate-500">
                  Track branch stock transfers.
                </p>
              </div>
              <div>
                <Button onClick={() => setShowTransferModal(true)}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  Request Stock Transfer
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-200">
                    <th className="py-3 px-4">Item & Quantity</th>
                    <th className="py-3 px-4">Source Branch</th>
                    <th className="py-3 px-4">Destination Branch</th>
                    <th className="py-3 px-4">Requested By</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {transfers.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{t.material?.nameEn}</div>
                        <div className="text-xs text-slate-500">
                          Qty: <strong className="text-slate-800">{t.quantity}</strong> {t.material?.unit}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-slate-700">
                        {t.fromBranch?.name} ({t.fromBranch?.code})
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-slate-700">
                        {t.toBranch?.name} ({t.toBranch?.code})
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {t.requestedByUser?.fullName}
                        <div className="text-xs text-slate-400">
                          {new Date(t.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge
                          variant={
                            t.status === 'RECEIVED'
                              ? 'success'
                              : t.status === 'SHIPPED'
                              ? 'teal'
                              : 'warning'
                          }
                        >
                          {t.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {t.status === 'REQUESTED' && t.fromBranchId === selectedBranchId && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setShowShipModal(t.id);
                              setShipLotNumber('LOT-9001');
                            }}
                          >
                            Ship Out
                          </Button>
                        )}
                        {t.status === 'SHIPPED' && t.toBranchId === selectedBranchId && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setShowReceiveTransferModal(t.id);
                              setRecvLotNumber('LOT-RECV-' + Math.floor(100 + Math.random() * 900));
                            }}
                          >
                            Receive In
                          </Button>
                        )}
                        {t.status === 'RECEIVED' && (
                          <span className="text-xs text-emerald-600 font-semibold flex items-center justify-end">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Completed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {transfers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400">
                        No inter-branch transfers requested yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================================================= */}
        {/* TAB 3: PURCHASE ORDERS */}
        {/* ================================================= */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Procurement & Purchase Orders
                </h2>
                <p className="text-xs text-slate-500">
                  Supplier orders & receipts.
                </p>
              </div>
              <div>
                <Button onClick={() => setShowPOModal(true)}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  Create Purchase Order
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-200">
                    <th className="py-3 px-4">PO Number</th>
                    <th className="py-3 px-4">Supplier</th>
                    <th className="py-3 px-4">Destination Branch</th>
                    <th className="py-3 px-4">Line Items</th>
                    <th className="py-3 px-4 text-right">Total (EGP)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {orders.map((po) => (
                    <tr key={po.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {po.poNumber}
                        <div className="text-xs text-slate-400 font-sans">
                          {new Date(po.issuedAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{po.supplier?.name}</div>
                        <div className="text-xs text-slate-400">{po.supplier?.phone}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                        {po.branch?.name}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        {po.lines?.map((l: any) => (
                          <div key={l.id} className="text-slate-600">
                            • {l.material?.nameEn}: <strong>{l.quantityReceived}/{l.quantityOrdered}</strong> received
                          </div>
                        ))}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {(po.totalAmountPiasters / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge
                          variant={
                            po.status === 'FULFILLED'
                              ? 'success'
                              : po.status === 'PARTIALLY_RECEIVED'
                              ? 'teal'
                              : 'warning'
                          }
                        >
                          {po.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {po.status !== 'FULFILLED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openReceiveGoods(po)}
                          >
                            <PackageCheck className="w-3.5 h-3.5 mr-1" />
                            Receive Goods
                          </Button>
                        )}
                        {po.status === 'FULFILLED' && (
                          <span className="text-xs text-emerald-600 font-semibold flex items-center justify-end">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Fulfilled
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">
                        No purchase orders issued yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================================================= */}
        {/* TAB 4: CATALOG & SUPPLIERS */}
        {/* ================================================= */}
        {activeTab === 'catalog' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Suppliers Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Suppliers Directory</h3>
                  <p className="text-xs text-slate-500">Approved vendor and distributor contacts.</p>
                </div>
                <Button size="sm" onClick={() => setShowSupplierModal(true)}>
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Supplier
                </Button>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 divide-y divide-slate-100">
                {suppliers.map((s) => (
                  <div key={s.id} className="py-3 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{s.name}</h4>
                      <p className="text-xs text-slate-500">Contact: {s.contactPerson || 'N/A'}</p>
                      <p className="text-xs text-slate-400 font-mono">{s.phone} {s.email && `• ${s.email}`}</p>
                    </div>
                    <Badge variant="neutral">{s.address || 'Cairo'}</Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Material Catalog Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Materials Master Catalog</h3>
                  <p className="text-xs text-slate-500">Standard items & reorder levels.</p>
                </div>
                <Button size="sm" onClick={() => setShowMaterialModal(true)}>
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Material
                </Button>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                {materials.map((m) => (
                  <div key={m.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 text-sm">{m.nameEn}</span>
                        <span className="text-xs font-mono text-teal-600 font-bold">[{m.sku}]</span>
                      </div>
                      <p className="text-xs text-slate-500">{m.nameAr}</p>
                      <p className="text-xs text-slate-400">
                        Category: <strong className="text-slate-700">{m.category}</strong> • Unit: {m.unit}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900 text-sm">
                        {(m.unitCostPiasters / 100).toFixed(2)} EGP
                      </div>
                      <div className="text-xs text-slate-400">Reorder at &le; {m.reorderPoint}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ================================================= */}
      {/* MODAL 1: STOCK ADJUSTMENT / WASTE */}
      {/* ================================================= */}
      {showAdjustmentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Record Stock Movement / Adjustment</h3>
            <p className="text-xs text-slate-500 mb-4">
              Adjust inventory lots.
            </p>

            <form onSubmit={handleRecordAdjustment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Material</label>
                <select
                  value={adjMaterialId}
                  onChange={(e) => setAdjMaterialId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none font-medium"
                >
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.sku} - {m.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lot Number</label>
                  <input
                    type="text"
                    required
                    value={adjLotNumber}
                    onChange={(e) => setAdjLotNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Movement Type</label>
                  <select
                    value={adjMovementType}
                    onChange={(e: any) => setAdjMovementType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none font-medium"
                  >
                    <option value="PURCHASE">Add Stock (Purchase / Direct)</option>
                    <option value="CORRECTION">Correction (+/-)</option>
                    <option value="WASTE">Deduct (Clinical Waste / Breakage)</option>
                    <option value="EXPIRED">Deduct (Expired Shelf Life)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quantity ({adjMovementType === 'WASTE' || adjMovementType === 'EXPIRED' ? 'To Deduct' : 'To Add'})
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjQuantity}
                  onChange={(e) => setAdjQuantity(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical / Warehouse Notes</label>
                <input
                  type="text"
                  placeholder="Adjustment reason..."
                  value={adjNotes}
                  onChange={(e) => setAdjNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <Button type="button" variant="outline" onClick={() => setShowAdjustmentModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={savingAdj}>
                  Save Adjustment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* MODAL 2: REQUEST INTER-BRANCH TRANSFER */}
      {/* ================================================= */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Request Inter-Branch Stock Transfer</h3>
            <p className="text-xs text-slate-500 mb-4">
              Transfer items from source branch ({currentBranch?.name}) to destination branch.
            </p>

            <form onSubmit={handleRequestTransfer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Material to Transfer</label>
                <select
                  value={transMaterialId}
                  onChange={(e) => setTransMaterialId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none font-medium"
                >
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.sku} - {m.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Destination Branch</label>
                  <select
                    value={transToBranchId}
                    onChange={(e) => setTransToBranchId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none font-medium"
                  >
                    {branches
                      .filter((b) => b.id !== selectedBranchId)
                      .map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.code})
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={transQuantity}
                    onChange={(e) => setTransQuantity(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Transfer Notes</label>
                <input
                  type="text"
                  placeholder="Requisition reason..."
                  value={transNotes}
                  onChange={(e) => setTransNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <Button type="button" variant="outline" onClick={() => setShowTransferModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={savingTransfer}>
                  Submit Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* MODAL 3: SHIP TRANSFER */}
      {/* ================================================= */}
      {showShipModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Ship Inter-Branch Transfer</h3>
            <p className="text-xs text-slate-500 mb-4">
              Ship stock transfer lot.
            </p>

            <form onSubmit={handleShipTransfer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Source Lot Number</label>
                <input
                  type="text"
                  required
                  value={shipLotNumber}
                  onChange={(e) => setShipLotNumber(e.target.value)}
                  placeholder="Active lot number..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <Button type="button" variant="outline" onClick={() => setShowShipModal(null)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={savingShip}>
                  Confirm Dispatch
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* MODAL 4: RECEIVE TRANSFER */}
      {/* ================================================= */}
      {showReceiveTransferModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Receive Transfer In</h3>
            <p className="text-xs text-slate-500 mb-4">
              Receive transfer stock lot.
            </p>

            <form onSubmit={handleReceiveTransfer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Destination Lot Number</label>
                <input
                  type="text"
                  required
                  value={recvLotNumber}
                  onChange={(e) => setRecvLotNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry Date</label>
                <input
                  type="date"
                  required
                  value={recvExpiryDate}
                  onChange={(e) => setRecvExpiryDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none font-medium"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <Button type="button" variant="outline" onClick={() => setShowReceiveTransferModal(null)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={savingReceiveTransfer}>
                  Accept Goods
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* MODAL 5: CREATE PURCHASE ORDER */}
      {/* ================================================= */}
      {showPOModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-2xl w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Create Purchase Order</h3>
            <p className="text-xs text-slate-500 mb-4">
              Generate sequential PO.
            </p>

            <form onSubmit={handleCreatePO} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier</label>
                  <select
                    value={poSupplierId}
                    onChange={(e) => setPoSupplierId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none font-medium"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Destination Branch</label>
                  <input
                    type="text"
                    disabled
                    value={`${currentBranch?.name} (${currentBranch?.code})`}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700">Order Line Items</label>
                  <button
                    type="button"
                    onClick={() =>
                      setPoLines([
                        ...poLines,
                        {
                          materialId: materials[0]?.id || '',
                          quantityOrdered: 10,
                          unitCostEgp: (materials[0]?.unitCostPiasters || 50000) / 100,
                        },
                      ])
                    }
                    className="text-xs text-teal-600 hover:text-teal-700 font-bold flex items-center"
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add Line
                  </button>
                </div>

                <div className="space-y-2">
                  {poLines.map((line, idx) => (
                    <div key={idx} className="flex items-center space-x-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <select
                        value={line.materialId}
                        onChange={(e) => {
                          const updated = [...poLines];
                          updated[idx].materialId = e.target.value;
                          const found = materials.find((m) => m.id === e.target.value);
                          if (found) updated[idx].unitCostEgp = found.unitCostPiasters / 100;
                          setPoLines(updated);
                        }}
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs outline-none"
                      >
                        {materials.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.sku} - {m.nameEn}
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={line.quantityOrdered}
                        onChange={(e) => {
                          const updated = [...poLines];
                          updated[idx].quantityOrdered = parseInt(e.target.value) || 1;
                          setPoLines(updated);
                        }}
                        className="w-20 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold outline-none"
                      />

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Unit EGP"
                        value={line.unitCostEgp}
                        onChange={(e) => {
                          const updated = [...poLines];
                          updated[idx].unitCostEgp = parseFloat(e.target.value) || 0;
                          setPoLines(updated);
                        }}
                        className="w-24 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold outline-none"
                      />

                      {poLines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setPoLines(poLines.filter((_, i) => i !== idx))}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Instructions</label>
                <input
                  type="text"
                  placeholder="Delivery instructions..."
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <Button type="button" variant="outline" onClick={() => setShowPOModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={savingPO}>
                  Issue Purchase Order
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* MODAL 6: RECEIVE GOODS (GOODS RECEIPT) */}
      {/* ================================================= */}
      {showReceiveGoodsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-2xl w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Log Goods Receipt for {showReceiveGoodsModal.poNumber}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Log goods receipt lot.
            </p>

            <form onSubmit={handleReceiveGoods} className="space-y-4">
              <div className="space-y-3">
                {goodsLines.map((line, idx) => (
                  <div key={idx} className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                    <div className="font-bold text-slate-800 text-xs">{line.materialName}</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="text-xs text-slate-500 block">Lot Number</label>
                        <input
                          type="text"
                          required
                          value={line.lotNumber}
                          onChange={(e) => {
                            const updated = [...goodsLines];
                            updated[idx].lotNumber = e.target.value;
                            setGoodsLines(updated);
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 block">Expiry Date</label>
                        <input
                          type="date"
                          required
                          value={line.expiryDate}
                          onChange={(e) => {
                            const updated = [...goodsLines];
                            updated[idx].expiryDate = e.target.value;
                            setGoodsLines(updated);
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 block">Accepted Qty</label>
                        <input
                          type="number"
                          min="0"
                          value={line.quantityAccepted}
                          onChange={(e) => {
                            const updated = [...goodsLines];
                            updated[idx].quantityAccepted = parseInt(e.target.value) || 0;
                            setGoodsLines(updated);
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-emerald-700 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 block">Rejected Qty</label>
                        <input
                          type="number"
                          min="0"
                          value={line.quantityRejected}
                          onChange={(e) => {
                            const updated = [...goodsLines];
                            updated[idx].quantityRejected = parseInt(e.target.value) || 0;
                            setGoodsLines(updated);
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-red-600 outline-none"
                        />
                      </div>
                    </div>

                    {line.quantityRejected > 0 && (
                      <div>
                        <input
                          type="text"
                          placeholder="Rejection reason..."
                          value={line.rejectionReason}
                          onChange={(e) => {
                            const updated = [...goodsLines];
                            updated[idx].rejectionReason = e.target.value;
                            setGoodsLines(updated);
                          }}
                          className="w-full bg-white border border-red-200 rounded-lg px-2 py-1 text-xs text-red-800 outline-none"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <Button type="button" variant="outline" onClick={() => setShowReceiveGoodsModal(null)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={savingGoodsReceipt}>
                  Commit Goods Receipt
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* MODAL 7: ADD MATERIAL */}
      {/* ================================================= */}
      {showMaterialModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Add Material to Catalog</h3>
            <p className="text-xs text-slate-500 mb-4">
              Define item SKU catalog.
            </p>

            <form onSubmit={handleCreateMaterial} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">SKU</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MAT-BOND-02"
                  value={matSku}
                  onChange={(e) => setMatSku(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Name (English)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scotchbond Universal Plus Adhesive"
                  value={matNameEn}
                  onChange={(e) => setMatNameEn(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Name (Arabic)</label>
                <input
                  type="text"
                  required
                  dir="rtl"
                  placeholder="مثال: مادة لاصقة سكوتش بوند"
                  value={matNameAr}
                  onChange={(e) => setMatNameAr(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={matCategory}
                    onChange={(e) => setMatCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
                  >
                    <option value="COMPOSITES">Composites</option>
                    <option value="ANESTHETICS">Anesthetics</option>
                    <option value="ENDODONTICS">Endodontics</option>
                    <option value="IMPRESSION">Impression</option>
                    <option value="PPE">PPE</option>
                    <option value="SURGICAL">Surgical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit</label>
                  <select
                    value={matUnit}
                    onChange={(e) => setMatUnit(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
                  >
                    <option value="SYRINGE">Syringe</option>
                    <option value="BOX">Box</option>
                    <option value="PACK">Pack</option>
                    <option value="BOTTLE">Bottle</option>
                    <option value="BAG">Bag</option>
                    <option value="PIECE">Piece</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Cost (EGP)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={matCostEgp}
                    onChange={(e) => setMatCostEgp(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reorder Point</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={matReorderPoint}
                    onChange={(e) => setMatReorderPoint(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <Button type="button" variant="outline" onClick={() => setShowMaterialModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={savingMaterial}>
                  Add Material
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* MODAL 8: ADD SUPPLIER */}
      {/* ================================================= */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Register Supplier</h3>
            <p className="text-xs text-slate-500 mb-4">
              Add distributor profile.
            </p>

            <form onSubmit={handleCreateSupplier} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Dental Solutions Ltd."
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person</label>
                <input
                  type="text"
                  placeholder="e.g. Tarek Gamal"
                  value={supContact}
                  onChange={(e) => setSupContact(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  placeholder="+20 100 000 0000"
                  value={supPhone}
                  onChange={(e) => setSupPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="orders@supplier.com"
                  value={supEmail}
                  onChange={(e) => setSupEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Address / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Free Zone, Nasr City"
                  value={supAddress}
                  onChange={(e) => setSupAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <Button type="button" variant="outline" onClick={() => setShowSupplierModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={savingSupplier}>
                  Save Supplier
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
