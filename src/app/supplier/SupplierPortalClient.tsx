'use client';
import {LocalizedSelect,LocalizedInput} from '@/components/LocalizedControls';

import {TranslatedText} from '@/components/TranslatedText';


import React, { useState } from 'react';
import { 
  Truck, 
  Package, 
  Calendar, 
  Clock, 
  Building2, 
  Phone, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Search,
  Filter,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { StatusTag } from '@/components/ui/StatusTag';

interface Supplier {
  id: string;
  name: string;
  contactPerson: string | null;
  phone: string;
  email: string | null;
  address: string | null;
}

interface SupplierPO {
  id: string;
  poNumber: string;
  status: string;
  issuedAt: string | Date;
  notes: string | null;
  supplier: {
    id: string;
    name: string;
    contactPerson: string | null;
    phone: string;
    email: string | null;
  };
  branch: {
    id: string;
    code: string;
    name: string;
    address?: string | null;
    phone: string;
  };
  lines: Array<{
    id: string;
    quantityOrdered: number;
    quantityReceived: number;
    material: {
      id: string;
      sku: string;
      nameEn: string;
      nameAr: string;
      unit: string;
    };
  }>;
}

interface SupplierPortalClientProps {
  suppliers: Supplier[];
  initialOrders: SupplierPO[];
  selectedSupplierId?: string;
}

export function SupplierPortalClient({
  suppliers,
  initialOrders,
  selectedSupplierId,
}: SupplierPortalClientProps) {
  const [activeSupplierId, setActiveSupplierId] = useState<string>(
    selectedSupplierId || (suppliers[0]?.id ?? '')
  );
  const [orders, setOrders] = useState<SupplierPO[]>(initialOrders);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedPO, setSelectedPO] = useState<SupplierPO | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [ackSuccess, setAckSuccess] = useState<string | null>(null);

  const currentSupplier = suppliers.find((s) => s.id === activeSupplierId) || suppliers[0];

  const filteredOrders = orders.filter((po) => {
    const matchesSupplier = po.supplier.id === activeSupplierId;
    const matchesSearch =
      po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.lines.some((l) => l.material.nameEn.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || po.status === statusFilter;
    return matchesSupplier && matchesSearch && matchesStatus;
  });

  const handleUpdateStatus = async (poId: string, status: string, notes?: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch('/api/supplier/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poId, status, supplierNotes: notes }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      
      setOrders((prev) =>
        prev.map((o) => (o.id === poId ? { ...o, status, notes: notes || o.notes } : o))
      );
      if (selectedPO && selectedPO.id === poId) {
        setSelectedPO({ ...selectedPO, status, notes: notes || selectedPO.notes });
      }
      setAckSuccess(`Order ${selectedPO?.poNumber || poId} updated to ${status}`);
      setTimeout(() => setAckSuccess(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Error updating order');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="eb-role-page eb-supplier space-y-6">
      {/* Top Banner / Isolation Notice */}
      <div className="v2-ops-header v2-ops-supplier rounded-2xl bg-gradient-to-r from-eb-navy via-eb-blue to-eb-navy p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-md mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-eb-orange" />
              <span>Isolated Vendor Access · Zero Clinical PHI</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Supplier Fulfillment & Dispatch Portal</h1>
            <p className="text-white/80 text-xs mt-1 max-w-2xl leading-relaxed">
              External logistics view for authorized medical suppliers. Track issued purchase orders, confirm delivery ETAs, update dispatch statuses, and coordinate direct goods drop-off at clinic branches without exposure to clinical or internal clinic financial data.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/15">
              <div className="text-xs uppercase font-bold tracking-wider text-white/70">Active Vendor Profile</div>
              <LocalizedSelect
                aria-label="Active Vendor Profile"
                value={activeSupplierId}
                onChange={(e) => setActiveSupplierId(e.target.value)}
                className="mt-1 bg-white text-slate-800 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-eb-orange"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    <TranslatedText text={String(s.name)}/>
                  </option>
                ))}
              </LocalizedSelect>
            </div>
          </div>
        </div>
      </div>

      {ackSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{ackSuccess}</span>
        </div>
      )}

      {/* Supplier Profile Metadata Strip */}
      {currentSupplier && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              {currentSupplier.name.charAt(0)}
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Vendor Organization</div>
              <div className="text-sm font-semibold text-slate-900"><TranslatedText text={String(currentSupplier.name)}/></div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Phone className="w-4 h-4 text-slate-400" />
            <div>
              <div className="text-xs text-slate-400 font-medium">Contact Phone</div>
              <div className="text-xs font-semibold text-slate-700">{currentSupplier.phone || 'N/A'}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-slate-400" />
            <div>
              <div className="text-xs text-slate-400 font-medium">Contact Email</div>
              <div className="text-xs font-semibold text-slate-700">{currentSupplier.email || 'dispatch@supplier.dev'}</div>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <LocalizedInput
            type="text"
            placeholder="Search PO #, branch, material..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-eb-blue"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <LocalizedSelect
            aria-label="Filter orders by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-eb-blue"
          >
            <option value="ALL">All Statuses</option>
            <option value="ISSUED">ISSUED (Awaiting Dispatch)</option>
            <option value="PARTIALLY_RECEIVED"> <TranslatedText text="PARTIALLY_RECEIVED" /> </option>
            <option value="RECEIVED">RECEIVED (Delivered)</option>
            <option value="CANCELLED"> <TranslatedText text="CANCELLED" /> </option>
          </LocalizedSelect>
        </div>
      </div>

      {/* Orders List & Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Orders Table */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-eb-blue" />
              <h2 className="text-sm font-bold text-slate-900">Purchase Orders Assigned to You</h2>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {filteredOrders.length} order{filteredOrders.length === 1 ? '' : 's'}
            </span>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No purchase orders found matching the filter criteria.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {filteredOrders.map((po) => {
                const isSelected = selectedPO?.id === po.id;
                const totalItems = po.lines.reduce((acc, l) => acc + l.quantityOrdered, 0);
                const totalReceived = po.lines.reduce((acc, l) => acc + l.quantityReceived, 0);

                return (
                  <button
                    key={po.id}
                    onClick={() => setSelectedPO(po)}
                    className={`w-full text-left p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4 ${
                      isSelected ? 'bg-blue-50/70 border-l-4 border-eb-blue' : ''
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-900">{po.poNumber}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                          po.status === 'FULFILLED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : po.status === 'PARTIALLY_RECEIVED'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : po.status === 'CANCELLED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          <TranslatedText text={String(po.status)}/>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium text-slate-700"><TranslatedText text={String(po.branch.name)}/> ({po.branch.code})</span>
                        <span>·</span>
                        <span>Issued: {new Date(po.issuedAt).toLocaleDateString('en-GB')}</span>
                      </div>
                      <div className="text-xs text-slate-400">
                        {po.lines.length} distinct item line{po.lines.length === 1 ? '' : 's'} ({totalReceived}/{totalItems} units fulfilled)
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Order Detail Panel */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          {selectedPO ? (
            <>
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Purchase Order Detail</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                    selectedPO.status === 'FULFILLED'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : selectedPO.status === 'PARTIALLY_RECEIVED'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : selectedPO.status === 'CANCELLED'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    <TranslatedText text={String(selectedPO.status)}/>
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 font-mono">{selectedPO.poNumber}</h3>
                <p className="text-xs text-slate-500 mt-1"> <TranslatedText text="Issued on" /> {new Date(selectedPO.issuedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>

              {/* Delivery Destination Branch */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5">
                <div className="text-xs uppercase font-bold text-slate-400 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Delivery Destination Branch</span>
                </div>
                <div className="text-xs font-bold text-slate-800"><TranslatedText text={String(selectedPO.branch.name)}/></div>
                <div className="text-xs text-slate-600">{selectedPO.branch.address}</div>
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{selectedPO.branch.phone}</span>
                </div>
              </div>

              {/* Ordered Items List (Zero prices/margins exposed) */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-eb-blue" />
                  <span>Items to Deliver (Quantities Only)</span>
                </h4>
                <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
                  {selectedPO.lines.map((line) => (
                    <div key={line.id} className="p-3 text-xs flex items-center justify-between bg-white">
                      <div>
                        <div className="font-semibold text-slate-800">{line.material.nameEn}</div>
                        <div className="text-xs text-slate-400 font-mono">{line.material.sku} · {line.material.unit}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900"> <TranslatedText text="Qty:" /> {line.quantityOrdered}
                        </div>
                        <div className="text-xs text-slate-500">
                          Recv: {line.quantityReceived}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Supplier Actions */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="text-xs font-bold text-slate-900">Vendor Fulfillment Actions</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    disabled={isUpdating || selectedPO.status === 'RECEIVED'}
                    onClick={() => handleUpdateStatus(selectedPO.id, 'ISSUED', 'Acknowledged by supplier. Dispatch in progress.')}
                    className="px-3 py-2 rounded-xl bg-blue-50 text-eb-blue hover:bg-blue-100 text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    Confirm ETA / Dispatch
                  </button>
                  <button
                    disabled={isUpdating || selectedPO.status === 'RECEIVED'}
                    onClick={() => handleUpdateStatus(selectedPO.id, 'RECEIVED', 'Full order delivered to clinic branch.')}
                    className="px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    Mark as Delivered
                  </button>
                </div>
                {selectedPO.notes && (
                  <div className="p-2.5 rounded-lg bg-amber-50 text-amber-800 text-xs">
                    <span className="font-semibold">Notes / Instructions:</span> {selectedPO.notes}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="h-72 flex flex-col items-center justify-center text-center text-slate-400 text-xs p-6">
              <Package className="w-8 h-8 text-slate-300 mb-2" />
              <p className="font-medium text-slate-600">Select an order from the list</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                View delivery location, ordered material quantities, and dispatch fulfillment status.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
