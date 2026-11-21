'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  Wrench, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Plus, 
  ArrowLeft, 
  Building2, 
  RefreshCw,
  ShieldAlert,
  Calendar,
  PhoneCall,
  Activity,
  Layers,
  FileCheck2
} from 'lucide-react';

interface Props {
  currentUser: any;
  branches: Array<{ id: string; code: string; name: string }>;
  initialAssets: any[];
  initialSummary: any;
  initialWorkOrders: any[];
}

export function EquipmentDeskClient({
  currentUser,
  branches,
  initialAssets,
  initialSummary,
  initialWorkOrders,
}: Props) {
  const [activeTab, setActiveTab] = useState<'assets' | 'faults' | 'orders'>('assets');
  const [selectedBranchId, setSelectedBranchId] = useState<string>(branches[0]?.id || '');
  const [assets, setAssets] = useState<any[]>(initialAssets);
  const [summary, setSummary] = useState<any>(initialSummary);
  const [workOrders, setWorkOrders] = useState<any[]>(initialWorkOrders);
  const [loading, setLoading] = useState(false);

  // Modals state
  const [showFaultModal, setShowFaultModal] = useState<any | null>(null);
  const [showWorkOrderModal, setShowWorkOrderModal] = useState<any | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState<any | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState<any | null>(null);
  const [showAssetModal, setShowAssetModal] = useState(false);

  // Form states
  // 1. Fault Report
  const [faultDesc, setFaultDesc] = useState('');
  const [faultSeverity, setFaultSeverity] = useState<'CRITICAL' | 'MAJOR' | 'MINOR'>('MAJOR');
  const [savingFault, setSavingFault] = useState(false);

  // 2. Work Order Dispatch
  const [techName, setTechName] = useState('');
  const [techPhone, setTechPhone] = useState('');
  const [woType, setWoType] = useState<'CORRECTIVE' | 'PREVENTIVE'>('CORRECTIVE');
  const [woNotes, setWoNotes] = useState('');
  const [savingWO, setSavingWO] = useState(false);

  // 3. Complete Work Order
  const [downtimeHours, setDowntimeHours] = useState<number>(2.5);
  const [costEgp, setCostEgp] = useState<number>(1500);
  const [completeNotes, setCompleteNotes] = useState('');
  const [savingComplete, setSavingComplete] = useState(false);

  // 4. Verify & Return to Service
  const [verifyNotes, setVerifyNotes] = useState('Safety checklist verified, tested under standard load protocol.');
  const [savingVerify, setSavingVerify] = useState(false);

  // 5. Add Asset
  const [assetName, setAssetName] = useState('');
  const [assetSerial, setAssetSerial] = useState('SN-' + Math.floor(10000 + Math.random() * 90000));
  const [assetModel, setAssetModel] = useState('');
  const [assetCategory, setAssetCategory] = useState<'DENTAL_CHAIR' | 'AUTOCLAVE' | 'COMPRESSOR' | 'XRAY_UNIT' | 'LASER_UNIT' | 'HANDPIECE_UNIT'>('DENTAL_CHAIR');
  const [assetCriticality, setAssetCriticality] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [savingAsset, setSavingAsset] = useState(false);

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchBranchData();
  }, [selectedBranchId]);

  async function fetchBranchData() {
    if (!selectedBranchId) return;
    try {
      setLoading(true);
      const [resAssets, resSum, resOrders] = await Promise.all([
        fetch(`/api/equipment/assets?branchId=${selectedBranchId}`),
        fetch(`/api/equipment/summary?branchId=${selectedBranchId}`),
        fetch(`/api/equipment/orders?branchId=${selectedBranchId}`),
      ]);

      const [dataAssets, dataSum, dataOrders] = await Promise.all([
        resAssets.json(),
        resSum.json(),
        resOrders.json(),
      ]);

      if (resAssets.ok) setAssets(dataAssets.assets || []);
      if (resSum.ok) setSummary(dataSum.summary || {});
      if (resOrders.ok) setWorkOrders(dataOrders.orders || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // Handle Fault Submit
  async function handleReportFault(e: React.FormEvent) {
    e.preventDefault();
    if (!showFaultModal) return;
    setSavingFault(true);
    setNotification(null);
    try {
      const res = await fetch('/api/equipment/faults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: showFaultModal.id,
          description: faultDesc,
          severity: faultSeverity,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to report fault');

      setNotification({
        message: `Fault reported. Asset safety status updated to ${data.fault?.asset?.status || 'Restricted'}.`,
        type: 'success',
      });
      setShowFaultModal(null);
      setFaultDesc('');
      fetchBranchData();
    } catch (err: any) {
      setNotification({ message: err.message, type: 'error' });
    } finally {
      setSavingFault(false);
    }
  }

  // Handle Work Order Dispatch
  async function handleDispatchWO(e: React.FormEvent) {
    e.preventDefault();
    if (!showWorkOrderModal) return;
    setSavingWO(true);
    setNotification(null);
    try {
      const res = await fetch('/api/equipment/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: showWorkOrderModal.assetId || showWorkOrderModal.id,
          faultId: showWorkOrderModal.faultId || undefined,
          technicianName: techName,
          technicianPhone: techPhone,
          workOrderType: woType,
          notes: woNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch work order');

      setNotification({ message: 'Technician dispatched. Asset marked UNDER_MAINTENANCE.', type: 'success' });
      setShowWorkOrderModal(null);
      setTechName('');
      setTechPhone('');
      setWoNotes('');
      fetchBranchData();
    } catch (err: any) {
      setNotification({ message: err.message, type: 'error' });
    } finally {
      setSavingWO(false);
    }
  }

  // Handle Complete Work Order
  async function handleCompleteWO(e: React.FormEvent) {
    e.preventDefault();
    if (!showCompleteModal) return;
    setSavingComplete(true);
    setNotification(null);
    try {
      const res = await fetch(`/api/equipment/orders/${showCompleteModal.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          downtimeHours,
          costEgp,
          notes: completeNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to complete work order');

      setNotification({ message: 'Work order completed. Awaiting manager return-to-service verification.', type: 'success' });
      setShowCompleteModal(null);
      fetchBranchData();
    } catch (err: any) {
      setNotification({ message: err.message, type: 'error' });
    } finally {
      setSavingComplete(false);
    }
  }

  // Handle Verify & Return to Service
  async function handleVerifyWO(e: React.FormEvent) {
    e.preventDefault();
    if (!showVerifyModal) return;
    setSavingVerify(true);
    setNotification(null);
    try {
      const res = await fetch(`/api/equipment/orders/${showVerifyModal.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: verifyNotes }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to verify work order');

      setNotification({
        message: 'Return-to-service verified. Asset restored to OPERATIONAL and maintenance expense recorded in finance ledger.',
        type: 'success',
      });
      setShowVerifyModal(null);
      fetchBranchData();
    } catch (err: any) {
      setNotification({ message: err.message, type: 'error' });
    } finally {
      setSavingVerify(false);
    }
  }

  // Handle Add Asset
  async function handleCreateAsset(e: React.FormEvent) {
    e.preventDefault();
    setSavingAsset(true);
    setNotification(null);
    try {
      const res = await fetch('/api/equipment/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: selectedBranchId,
          name: assetName,
          serialNumber: assetSerial,
          model: assetModel,
          category: assetCategory,
          criticality: assetCriticality,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create asset');

      setNotification({ message: 'Asset registered into clinic operatory inventory.', type: 'success' });
      setShowAssetModal(false);
      setAssetName('');
      setAssetModel('');
      fetchBranchData();
    } catch (err: any) {
      setNotification({ message: err.message, type: 'error' });
    } finally {
      setSavingAsset(false);
    }
  }

  const currentBranch = branches.find((b) => b.id === selectedBranchId);

  // Flatten active faults from assets
  const activeFaults = assets.flatMap((a) =>
    (a.faults || []).map((f: any) => ({ ...f, assetName: a.name, serialNumber: a.serialNumber }))
  );

  return (
    <div className="eb-role-page eb-maintenance min-h-screen bg-[#F8F9FA] text-slate-800 pb-16 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1. TOP HEADER & OPERATORY EQUIPMENT COMMAND */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-slate-100 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF9F1] text-[#0F827B] text-xs font-bold border border-[#D4F3E2]">
                <span className="w-2 h-2 rounded-full bg-[#0F827B] animate-pulse" />
                <span>BIOMEDICAL ASSETS &amp; OPERATORY MAINTENANCE</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Equipment &amp; Operatories Desk
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
                Asset register, fault reporting, work orders dispatch, and return-to-service safety verification.
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
                onClick={fetchBranchData}
                isLoading={loading}
                className="rounded-full px-4 py-2 text-xs font-bold border-slate-200 hover:bg-slate-50"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                Refresh
              </Button>

              <Button
                size="sm"
                onClick={() => setShowAssetModal(true)}
                className="rounded-full px-4 py-2 text-xs font-bold bg-[#0F827B] hover:bg-[#0c6b65] text-white shadow-xs"
              >
                <Plus className="w-4 h-4 mr-1" />
                Register Asset
              </Button>
            </div>
          </div>
        </div>

        {/* 2. MAINTENANCE KPI SUMMARY STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Registered Assets</span>
            <div className="text-2xl font-black text-slate-900 tabular-nums">{assets.length}</div>
            <span className="text-xs text-slate-400">Dental chairs, autoclaves, X-rays</span>
          </div>

          <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] space-y-1">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Active Faults</span>
            <div className="text-2xl font-black text-rose-700 tabular-nums">{activeFaults.length}</div>
            <span className="text-xs text-slate-400">Equipment out of service</span>
          </div>

          <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] space-y-1">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Active Work Orders</span>
            <div className="text-2xl font-black text-amber-700 tabular-nums">{workOrders.filter(w => w.status !== 'VERIFIED').length}</div>
            <span className="text-xs text-slate-400">In biomedical repair</span>
          </div>

          <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] space-y-1">
            <span className="text-xs font-bold text-[#0F827B] uppercase tracking-wider">Safety Cleared</span>
            <div className="text-2xl font-black text-[#0F827B] tabular-nums">
              {assets.filter(a => a.status === 'OPERATIONAL').length}
            </div>
            <span className="text-xs text-slate-400">Safe for patient treatment</span>
          </div>
        </div>

        {/* 3. WORKSPACE TABS */}
        <div className="flex flex-wrap items-center gap-2 bg-white rounded-full p-1.5 border border-slate-100 shadow-xs">
          <button
            onClick={() => setActiveTab('assets')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'assets'
                ? 'bg-[#0F827B] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Operatory Assets ({assets.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('faults')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'faults'
                ? 'bg-[#0F827B] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Active Faults ({activeFaults.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'orders'
                ? 'bg-[#0F827B] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Work Orders ({workOrders.length})</span>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* Metrics Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs text-slate-400 font-semibold uppercase">Total Assets</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{summary?.total || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-sm bg-emerald-50/20">
            <div className="text-xs text-emerald-600 font-semibold uppercase">Operational</div>
            <div className="text-2xl font-bold text-emerald-700 mt-1">{summary?.operational || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-red-200 shadow-sm bg-red-50/20">
            <div className="text-xs text-red-600 font-semibold uppercase">Down / Maint</div>
            <div className="text-2xl font-bold text-red-700 mt-1">{summary?.outOfService || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-sm bg-amber-50/20">
            <div className="text-xs text-amber-600 font-semibold uppercase">Open Faults</div>
            <div className="text-2xl font-bold text-amber-700 mt-1">{summary?.openFaults || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-indigo-200 shadow-sm bg-indigo-50/20">
            <div className="text-xs text-indigo-600 font-semibold uppercase">Active Orders</div>
            <div className="text-2xl font-bold text-indigo-700 mt-1">{summary?.activeWorkOrders || 0}</div>
          </div>
        </div>

        {/* ================================================= */}
        {/* TAB 1: OPERATORY ASSETS */}
        {/* ================================================= */}
        {activeTab === 'assets' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Equipment Assets in {currentBranch?.name}
                </h2>
                <p className="text-xs text-slate-500">
                  Critical medical devices, operatory chairs, sterilizers, and imaging units.
                </p>
              </div>
              <div>
                <Button onClick={() => setShowAssetModal(true)}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  Register New Asset
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className={`bg-white rounded-3xl border p-5 shadow-sm space-y-3 transition-all ${
                    asset.status === 'OUT_OF_SERVICE'
                      ? 'border-red-300 ring-2 ring-red-100'
                      : asset.status === 'RESTRICTED_USE'
                      ? 'border-amber-300 ring-2 ring-amber-100'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge
                        variant={
                          asset.status === 'OPERATIONAL'
                            ? 'success'
                            : asset.status === 'UNDER_MAINTENANCE'
                            ? 'teal'
                            : asset.status === 'RESTRICTED_USE'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {asset.status.replace('_', ' ')}
                      </Badge>
                      <h3 className="font-bold text-slate-900 text-sm mt-2">{asset.name}</h3>
                      <p className="text-xs text-slate-400 font-mono">
                        {asset.model} • {asset.serialNumber}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-slate-100 text-slate-600">
                      {asset.criticality}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 space-y-1 pt-2 border-t border-slate-100">
                    <div className="flex justify-between">
                      <span>Category:</span>
                      <strong className="text-slate-700">{asset.category}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Service:</span>
                      <span className="text-slate-700">
                        {asset.lastServiceDate ? new Date(asset.lastServiceDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Next Due:</span>
                      <span className="text-slate-700">
                        {asset.nextServiceDue ? new Date(asset.nextServiceDue).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {asset.faults && asset.faults.length > 0 && (
                    <div className="bg-red-50 p-2.5 rounded-xl border border-red-200 text-xs text-red-800 space-y-1">
                      <div className="font-bold flex items-center">
                        <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                        Active Safety Fault:
                      </div>
                      <p className="text-xs">{asset.faults[0].description}</p>
                    </div>
                  )}

                  <div className="flex items-center space-x-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setShowFaultModal(asset)}
                    >
                      <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                      Report Fault
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() =>
                        setShowWorkOrderModal({
                          assetId: asset.id,
                          assetName: asset.name,
                          serialNumber: asset.serialNumber,
                        })
                      }
                    >
                      <Wrench className="w-3.5 h-3.5 mr-1" />
                      Work Order
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================================================= */}
        {/* TAB 2: ACTIVE FAULTS & SAFETY HOLDS */}
        {/* ================================================= */}
        {activeTab === 'faults' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Reported Equipment Faults</h2>
              <p className="text-xs text-slate-500">
                Active issues impacting clinical operatory safety. Critical faults enforce immediate OUT_OF_SERVICE lock.
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-200">
                    <th className="py-3 px-4">Device & Serial</th>
                    <th className="py-3 px-4">Fault Description</th>
                    <th className="py-3 px-4 text-center">Severity</th>
                    <th className="py-3 px-4">Reported By</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {activeFaults.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{f.assetName}</div>
                        <div className="text-xs text-slate-400 font-mono">{f.serialNumber}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-800">
                        {f.description}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge
                          variant={
                            f.severity === 'CRITICAL'
                              ? 'danger'
                              : f.severity === 'MAJOR'
                              ? 'warning'
                              : 'neutral'
                          }
                        >
                          {f.severity}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {new Date(f.reportedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setShowWorkOrderModal({
                              assetId: f.assetId,
                              faultId: f.id,
                              assetName: f.assetName,
                              serialNumber: f.serialNumber,
                            })
                          }
                        >
                          <Wrench className="w-3.5 h-3.5 mr-1" />
                          Dispatch Repair
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {activeFaults.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-400">
                        All equipment operating safely. Zero active faults reported.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================================================= */}
        {/* TAB 3: MAINTENANCE WORK ORDERS */}
        {/* ================================================= */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Maintenance Work Orders (DFD 11)</h2>
              <p className="text-xs text-slate-500">
                Technician dispatch, corrective repairs, downtime hours, and return-to-service verifications.
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-200">
                    <th className="py-3 px-4">Asset & Type</th>
                    <th className="py-3 px-4">Technician Details</th>
                    <th className="py-3 px-4">Repair Notes</th>
                    <th className="py-3 px-4 text-right">Cost (EGP)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {workOrders.map((wo) => (
                    <tr key={wo.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{wo.asset?.name}</div>
                        <div className="text-xs text-slate-400 font-mono">
                          {wo.workOrderType} • {wo.asset?.serialNumber}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <div className="font-semibold text-slate-800">{wo.technicianName}</div>
                        <div className="text-slate-400 font-mono">{wo.technicianPhone}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs truncate">
                        {wo.notes || 'No notes logged'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {((wo.costPiasters || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge
                          variant={
                            wo.status === 'VERIFIED_RETURNED_TO_SERVICE'
                              ? 'success'
                              : wo.status === 'COMPLETED_AWAITING_VERIFICATION'
                              ? 'warning'
                              : 'teal'
                          }
                        >
                          {wo.status.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {wo.status === 'IN_PROGRESS' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowCompleteModal(wo)}
                          >
                            <FileCheck2 className="w-3.5 h-3.5 mr-1" />
                            Log Completion
                          </Button>
                        )}
                        {wo.status === 'COMPLETED_AWAITING_VERIFICATION' && (
                          <Button
                            size="sm"
                            onClick={() => setShowVerifyModal(wo)}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Verify Return
                          </Button>
                        )}
                        {wo.status === 'VERIFIED_RETURNED_TO_SERVICE' && (
                          <span className="text-xs text-emerald-600 font-semibold flex items-center justify-end">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Cleared
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {workOrders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400">
                        No maintenance work orders dispatched yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ================================================= */}
      {/* MODAL 1: REPORT FAULT */}
      {/* ================================================= */}
      {showFaultModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Report Safety Fault: {showFaultModal.name}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Critical issues immediately transition device to OUT_OF_SERVICE.
            </p>

            <form onSubmit={handleReportFault} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fault Severity</label>
                <select
                  value={faultSeverity}
                  onChange={(e: any) => setFaultSeverity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold outline-none"
                >
                  <option value="CRITICAL">Critical (Immediate Out of Service / Safety Risk)</option>
                  <option value="MAJOR">Major (Restricted Clinical Use)</option>
                  <option value="MINOR">Minor (Cosmetic / Operational Quirk)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe observed malfunction, error code, or pressure failure..."
                  value={faultDesc}
                  onChange={(e) => setFaultDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <Button type="button" variant="outline" onClick={() => setShowFaultModal(null)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={savingFault}>
                  Submit Report
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* MODAL 2: DISPATCH WORK ORDER */}
      {/* ================================================= */}
      {showWorkOrderModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Dispatch Technician: {showWorkOrderModal.assetName}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Assign corrective or preventive maintenance to technician.
            </p>

            <form onSubmit={handleDispatchWO} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Technician / Vendor Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sameh El-Shennawy (Carestream Certified)"
                  value={techName}
                  onChange={(e) => setTechName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Technician Phone</label>
                <input
                  type="text"
                  required
                  placeholder="+20 100 123 4567"
                  value={techPhone}
                  onChange={(e) => setTechPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Maintenance Type</label>
                <select
                  value={woType}
                  onChange={(e: any) => setWoType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
                >
                  <option value="CORRECTIVE">Corrective Repair</option>
                  <option value="PREVENTIVE">Preventive Calibration / Scheduled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dispatch Instructions</label>
                <input
                  type="text"
                  placeholder="e.g. Inspect air line pressure regulator"
                  value={woNotes}
                  onChange={(e) => setWoNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <Button type="button" variant="outline" onClick={() => setShowWorkOrderModal(null)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={savingWO}>
                  Dispatch Work Order
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* MODAL 3: COMPLETE WORK ORDER */}
      {/* ================================================= */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Log Repair Completion: {showCompleteModal.asset?.name}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter recorded downtime hours, repair invoice cost, and parts replaced.
            </p>

            <form onSubmit={handleCompleteWO} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Downtime Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    value={downtimeHours}
                    onChange={(e) => setDowntimeHours(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cost (EGP)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={costEgp}
                    onChange={(e) => setCostEgp(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Technician Repair Notes</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Replaced worn valve seal, lubricated turbine bearings..."
                  value={completeNotes}
                  onChange={(e) => setCompleteNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <Button type="button" variant="outline" onClick={() => setShowCompleteModal(null)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={savingComplete}>
                  Submit for Verification
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* MODAL 4: VERIFY RETURN TO SERVICE */}
      {/* ================================================= */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Verify & Return to Service
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Authorizing return to service will restore device status to OPERATIONAL and record {((showVerifyModal.costPiasters || 0) / 100).toFixed(2)} EGP into clinic expenses.
            </p>

            <form onSubmit={handleVerifyWO} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Manager Signoff Notes</label>
                <textarea
                  rows={3}
                  required
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <Button type="button" variant="outline" onClick={() => setShowVerifyModal(null)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={savingVerify}>
                  Authorize Return to Service
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* MODAL 5: REGISTER NEW ASSET */}
      {/* ================================================= */}
      {showAssetModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Register Operatory Asset</h3>
            <p className="text-xs text-slate-500 mb-4">
              Add a clinical device or operatory chair to {currentBranch?.name}.
            </p>

            <form onSubmit={handleCreateAsset} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Device Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sirona Dentsply Orthophos S 3D"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Serial Number</label>
                  <input
                    type="text"
                    required
                    value={assetSerial}
                    onChange={(e) => setAssetSerial(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Model</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Orthophos S"
                    value={assetModel}
                    onChange={(e) => setAssetModel(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={assetCategory}
                    onChange={(e: any) => setAssetCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
                  >
                    <option value="DENTAL_CHAIR">Dental Chair</option>
                    <option value="AUTOCLAVE">Autoclave</option>
                    <option value="COMPRESSOR">Compressor</option>
                    <option value="XRAY_UNIT">X-Ray Unit</option>
                    <option value="LASER_UNIT">Laser Unit</option>
                    <option value="HANDPIECE_UNIT">Handpiece Unit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Criticality</label>
                  <select
                    value={assetCriticality}
                    onChange={(e: any) => setAssetCriticality(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
                  >
                    <option value="HIGH">High (Mandatory)</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <Button type="button" variant="outline" onClick={() => setShowAssetModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={savingAsset}>
                  Register Asset
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
