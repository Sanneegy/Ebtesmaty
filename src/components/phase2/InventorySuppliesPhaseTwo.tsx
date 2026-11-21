"use client";

import React, { useState, useMemo } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  FileBarChart,
  Edit3,
  MessageCircle,
  Layers,
  History,
  CheckCircle2,
  X,
  Flag,
} from "lucide-react";
import type { Phase2Role } from "./FinanceCenterPhaseTwo";

interface InventoryCatalogItem {
  id: string;
  nameAr: string;
  nameEn: string;
  categoryAr: string;
  categoryEn: string;
  unitAr: string;
  unitEn: string;
  quantity: number;
  minThreshold: number;
  valueEgp: number;
  supplierAr: string;
  supplierEn: string;
  monthlyUsageAvg: number;
  expiryDate: string;
  isExpiringSoon?: boolean;
  status: "available" | "low" | "out";
}

const INITIAL_INVENTORY_ITEMS: InventoryCatalogItem[] = [
  {
    id: "INV-CAT-1",
    nameAr: "أكياس تعقيم",
    nameEn: "Sterilization Pouches",
    categoryAr: "مستهلكات",
    categoryEn: "Consumables",
    unitAr: "علبة",
    unitEn: "Box",
    quantity: 20,
    minThreshold: 5,
    valueEgp: 1100,
    supplierAr: "الشركة الطبية",
    supplierEn: "Medical Co.",
    monthlyUsageAvg: 0.6,
    expiryDate: "2027-12-05",
    status: "available",
  },
  {
    id: "INV-CAT-2",
    nameAr: "تيجان مؤقتة",
    nameEn: "Temporary Crowns",
    categoryAr: "تركيبات",
    categoryEn: "Prosthodontics",
    unitAr: "علبة",
    unitEn: "Box",
    quantity: 12,
    minThreshold: 4,
    valueEgp: 3120,
    supplierAr: "الشركة الطبية",
    supplierEn: "Medical Co.",
    monthlyUsageAvg: 0.5,
    expiryDate: "2027-11-15",
    status: "available",
  },
  {
    id: "INV-CAT-3",
    nameAr: "جلاس أيونومر",
    nameEn: "Glass Ionomer Cement",
    categoryAr: "مواد حشو",
    categoryEn: "Filling Materials",
    unitAr: "عبوة",
    unitEn: "Pack",
    quantity: 9,
    minThreshold: 3,
    valueEgp: 3780,
    supplierAr: "Al Sharq supplier",
    supplierEn: "Al Sharq supplier",
    monthlyUsageAvg: 2.3,
    expiryDate: "2026-10-30",
    isExpiringSoon: true,
    status: "available",
  },
  {
    id: "INV-CAT-4",
    nameAr: "جوتا بركا",
    nameEn: "Gutta Percha Points",
    categoryAr: "مواد حشو عصب",
    categoryEn: "Endo Obturation",
    unitAr: "علبة",
    unitEn: "Box",
    quantity: 8,
    minThreshold: 3,
    valueEgp: 880,
    supplierAr: "الشركة الطبية",
    supplierEn: "Medical Co.",
    monthlyUsageAvg: 2.3,
    expiryDate: "2027-12-16",
    status: "available",
  },
  {
    id: "INV-CAT-5",
    nameAr: "حقن بنج (ليدوكايين)",
    nameEn: "Lidocaine Anesthetic Carpules",
    categoryAr: "مواد مخدرة",
    categoryEn: "Anesthetics",
    unitAr: "علبة",
    unitEn: "Box",
    quantity: 34,
    minThreshold: 10,
    valueEgp: 5100,
    supplierAr: "الشركة الطبية",
    supplierEn: "Medical Co.",
    monthlyUsageAvg: 2.8,
    expiryDate: "2027-06-07",
    status: "available",
  },
  {
    id: "INV-CAT-6",
    nameAr: "خيط جراحي 3/0",
    nameEn: "Surgical Suture 3/0",
    categoryAr: "خلع",
    categoryEn: "Surgery & Extraction",
    unitAr: "علبة",
    unitEn: "Box",
    quantity: 15,
    minThreshold: 5,
    valueEgp: 2100,
    supplierAr: "الشركة الطبية",
    supplierEn: "Medical Co.",
    monthlyUsageAvg: 0.2,
    expiryDate: "2027-07-15",
    status: "available",
  },
  {
    id: "INV-CAT-7",
    nameAr: "غرسة تيتانيوم 3.5×11.5",
    nameEn: "Titanium Implant Fixture 3.5×11.5",
    categoryAr: "تركيبات",
    categoryEn: "Implants",
    unitAr: "قطعة",
    unitEn: "Unit",
    quantity: 7,
    minThreshold: 3,
    valueEgp: 18200,
    supplierAr: "Al Sharq supplier",
    supplierEn: "Al Sharq supplier",
    monthlyUsageAvg: 0.7,
    expiryDate: "2027-11-28",
    status: "available",
  },
  {
    id: "INV-CAT-8",
    nameAr: "غرسة تيتانيوم 4.1×10",
    nameEn: "Titanium Implant Fixture 4.1×10",
    categoryAr: "تركيبات",
    categoryEn: "Implants",
    unitAr: "قطعة",
    unitEn: "Unit",
    quantity: 4,
    minThreshold: 5,
    valueEgp: 10400,
    supplierAr: "Al Sharq supplier",
    supplierEn: "Al Sharq supplier",
    monthlyUsageAvg: 0.3,
    expiryDate: "2027-12-03",
    status: "low",
  },
  {
    id: "INV-CAT-9",
    nameAr: "قفازات لاتكس (L)",
    nameEn: "Latex Exam Gloves (L)",
    categoryAr: "مستهلكات",
    categoryEn: "Consumables",
    unitAr: "علبة",
    unitEn: "Box",
    quantity: 41,
    minThreshold: 10,
    valueEgp: 3895,
    supplierAr: "الشركة الطبية",
    supplierEn: "Medical Co.",
    monthlyUsageAvg: 8.4,
    expiryDate: "2027-05-05",
    status: "available",
  },
  {
    id: "INV-CAT-10",
    nameAr: "Composite A2 (كمبوزيت تجميلي)",
    nameEn: "Composite A2 Syringe",
    categoryAr: "مواد حشو",
    categoryEn: "Filling Materials",
    unitAr: "سرنجة",
    unitEn: "Syringe",
    quantity: 2,
    minThreshold: 5,
    valueEgp: 1900,
    supplierAr: "Al Sharq supplier",
    supplierEn: "Al Sharq supplier",
    monthlyUsageAvg: 4.2,
    expiryDate: "2027-09-18",
    status: "low",
  },
];

const SPECIALTY_CATEGORIES = [
  { id: "all", labelAr: "الكل", labelEn: "All" },
  { id: "مستهلكات", labelAr: "مستهلكات", labelEn: "Consumables" },
  { id: "مواد مخدرة", labelAr: "مواد مخدرة", labelEn: "Anesthetics" },
  { id: "مواد حشو", labelAr: "مواد حشو", labelEn: "Filling Materials" },
  { id: "مواد حشو عصب", labelAr: "مواد حشو عصب", labelEn: "Endo Obturation" },
  { id: "تركيبات", labelAr: "تركيبات", labelEn: "Prosthodontics & Implants" },
  { id: "خلع", labelAr: "خلع", labelEn: "Extraction & Surgery" },
];

const SERVICE_MATERIAL_RECIPES = [
  {
    serviceAr: "حشو كمبوزيت تجميلي",
    serviceEn: "Composite Restoration",
    materialsAr: "0.2 سرنجة Composite A2 + 1 بنج ليدوكايين + 2 قفازات لاتكس + 1 كيس تعقيم",
    materialsEn: "0.2 Composite A2 + 1 Lidocaine + 2 Latex Gloves + 1 Sterilization Pouch",
    autoCostEgp: 145,
  },
  {
    serviceAr: "زراعة سن تيتانيوم",
    serviceEn: "Titanium Dental Implant",
    materialsAr: "1 غرسة تيتانيوم 3.5×11.5 + 1 خيط جراحي 3/0 + 2 بنج ليدوكايين",
    materialsEn: "1 Titanium Fixture 3.5×11.5 + 1 Suture 3/0 + 2 Lidocaine",
    autoCostEgp: 2240,
  },
  {
    serviceAr: "علاج جذور (حشو عصب)",
    serviceEn: "Root Canal Treatment",
    materialsAr: "1 جوتا بركا + 0.5 جلاس أيونومر + 1 بنج ليدوكايين",
    materialsEn: "1 Gutta Percha + 0.5 Glass Ionomer + 1 Lidocaine",
    autoCostEgp: 310,
  },
];

export default function InventorySuppliesPhaseTwo({
  role = "clinic_owner",
}: {
  role?: Phase2Role;
}) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const [items, setItems] = useState<InventoryCatalogItem[]>(INITIAL_INVENTORY_ITEMS);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "available" | "low" | "out" | "expiring"
  >("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showRecipesModal, setShowRecipesModal] = useState(false);
  const [showAddPurchaseModal, setShowAddPurchaseModal] = useState(false);

  // Stock Movement Audit Log (Date & Person)
  const [movementLog, setMovementLog] = useState([
    {
      id: "MOV-1",
      date: "2026-10-11 11:20",
      person: "د. أحمد الشريف (خصم تلقائي من الكشف)",
      item: "Composite A2 + حقن بنج",
      delta: "-1",
    },
    {
      id: "MOV-2",
      date: "2026-10-10 09:15",
      person: "نورهان (استلام توريد شركة الشرق)",
      item: "غرسة تيتانيوم 3.5×11.5",
      delta: "+5",
    },
  ]);

  // 1-Step Purchase Entry (adds to Inventory + logs Supplier Expense)
  const [purchaseItemName, setPurchaseItemName] = useState("Composite A2 (كمبوزيت تجميلي)");
  const [purchaseQty, setPurchaseQty] = useState(10);
  const [purchaseUnitCost, setPurchaseUnitCost] = useState(950);
  const [purchaseSupplier, setPurchaseSupplier] = useState("Al Sharq supplier");

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter === "available" && item.status !== "available") return false;
      if (statusFilter === "low" && item.status !== "low") return false;
      if (statusFilter === "out" && item.status !== "out") return false;
      if (statusFilter === "expiring" && !item.isExpiringSoon) return false;
      if (categoryFilter !== "all" && item.categoryAr !== categoryFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.nameAr.includes(q) ||
        item.nameEn.toLowerCase().includes(q) ||
        item.supplierAr.includes(q) ||
        item.supplierEn.toLowerCase().includes(q)
      );
    });
  }, [items, statusFilter, categoryFilter, searchQuery]);

  // Patient has no access to Inventory
  if (role === "patient") {
    return null;
  }

  const handleQuickAdjustStock = (itemId: string, delta: number) => {
    const actor =
      role === "doctor"
        ? "د. أحمد الشريف (تبليغ نقص من غرفة الكشف)"
        : role === "receptionist"
        ? "نورهان (الاستقبال — تسجيل حركة مخزن)"
        : "مدير العيادة";
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        const nextQty = Math.max(0, it.quantity + delta);
        const nextStatus: "available" | "low" | "out" =
          nextQty === 0 ? "out" : nextQty < it.minThreshold ? "low" : "available";
        setMovementLog((logPrev) => [
          {
            id: `MOV-${Date.now()}`,
            date: "2026-10-11 الآن",
            person: actor,
            item: it.nameAr,
            delta: delta > 0 ? `+${delta}` : `${delta}`,
          },
          ...logPrev,
        ]);
        return {
          ...it,
          quantity: nextQty,
          status: nextStatus,
        };
      })
    );
  };

  const handleRecordOneStepPurchase = () => {
    const qty = Number(purchaseQty);
    const cost = Number(purchaseUnitCost);
    if (!qty || qty <= 0) return;

    setItems((prev) =>
      prev.map((it) => {
        if (!it.nameAr.includes("Composite") && it.nameAr !== purchaseItemName) return it;
        const nextQty = it.quantity + qty;
        return {
          ...it,
          quantity: nextQty,
          valueEgp: it.valueEgp + qty * cost,
          status: nextQty >= it.minThreshold ? "available" : "low",
        };
      })
    );

    setMovementLog((prev) => [
      {
        id: `MOV-${Date.now()}`,
        date: "2026-10-11 الآن",
        person: `${purchaseSupplier} (إدخال شراء خطوة واحدة للمخزن والمصروفات)`,
        item: `${purchaseItemName} (×${qty})`,
        delta: `+${qty}`,
      },
      ...prev,
    ]);
    setShowAddPurchaseModal(false);
  };

  return (
    <section
      dir={isAr ? "rtl" : "ltr"}
      aria-label={isAr ? "أصناف المخزون وإدارة المخازن" : "Inventory and Supplies"}
      className="space-y-6"
    >
      {/* MAIN INVENTORY CATALOG CARD — Exact match to Image 8 & Image 9 */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_16px_rgba(11,37,40,0.04)]">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black tracking-tight text-slate-900">
              {isAr ? "أصناف المخزون" : "Inventory Items"}
            </h2>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700 tabular-nums">
              20
            </span>
            <span className="text-xs font-semibold text-slate-400">
              {role === "doctor"
                ? isAr
                  ? "طلب خامات أو تبليغ نقص من غرفة الكشف"
                  : "Chairside Consumables & Low-Stock Flagging"
                : role === "receptionist"
                ? isAr
                  ? "تسجيل استلام التوريدات وجرد الاستهلاك"
                  : "Log Deliveries & Stock Counts"
                : isAr
                ? "خصم تلقائي مع كل خدمة · تنبيه قبل النفاد والانتهاء"
                : "Auto-deducted per service · Low-stock & expiry alerts"}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {role === "clinic_owner" && (
              <button
                type="button"
                onClick={() => setShowRecipesModal(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50"
              >
                <FileBarChart className="h-4 w-4 text-slate-500" />
                {isAr ? "تقرير الاستهلاك وربط الخدمات" : "Consumption & Service Recipes"}
              </button>
            )}

            {role !== "doctor" && (
              <button
                type="button"
                onClick={() => setShowAddPurchaseModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
              >
                <Plus className="h-4 w-4" />
                {role === "receptionist"
                  ? isAr
                    ? "استلام توريد صناديق (+ Receive Delivery)"
                    : "Receive Delivery"
                  : isAr
                  ? "صنف جديد / توريد"
                  : "New Item / Purchase"}
              </button>
            )}
          </div>
        </div>

        {/* Status Filter Pills + Search Row — Exact match to Image 8 */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 transition ${
                statusFilter === "all"
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span>{isAr ? "النشطة" : "Active"}</span>
              <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[11px] tabular-nums">
                20
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("available")}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 transition ${
                statusFilter === "available"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span className="text-emerald-500">●</span>
              <span>{isAr ? "متوفر 18" : "In Stock 18"}</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("low")}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 transition ${
                statusFilter === "low"
                  ? "border-amber-600 bg-amber-50 text-amber-800"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span className="text-amber-500">●</span>
              <span>{isAr ? "منخفض 2" : "Low Stock 2"}</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("out")}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 transition ${
                statusFilter === "out"
                  ? "border-rose-600 bg-rose-50 text-rose-800"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span className="text-rose-500">●</span>
              <span>{isAr ? "نفد 0" : "Out of Stock 0"}</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("expiring")}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 transition ${
                statusFilter === "expiring"
                  ? "border-orange-600 bg-orange-50 text-orange-800"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span className="text-orange-500">●</span>
              <span>{isAr ? "تاريخ الانتهاء 1" : "Expiring Soon 1"}</span>
            </button>
          </div>

          <div className="relative min-w-[230px]">
            <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? "ابحث بالاسم أو المورّد..." : "Search item or supplier..."}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 ps-10 pe-4 text-xs font-medium text-slate-800 focus:border-blue-600 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Specialty Category Pills Row — Exact match to Image 9 */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-4">
          {SPECIALTY_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id)}
              className={`rounded-full px-3 py-1 text-[11px] font-bold transition ${
                categoryFilter === cat.id
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {isAr ? cat.labelAr : cat.labelEn}
            </button>
          ))}
        </div>

        {/* Inventory Table — Exact match to Image 8 & Image 9 */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[920px] border-separate border-spacing-y-2 text-xs">
            <thead>
              <tr className="text-slate-400 font-bold">
                <th className="px-3 py-2 text-start">{isAr ? "الصنف" : "Item"}</th>
                <th className="px-3 py-2 text-start">{isAr ? "النوع" : "Category"}</th>
                <th className="px-3 py-2 text-start">{isAr ? "مستوى المخزون" : "Stock Level"}</th>
                <th className="px-3 py-2 text-start">{isAr ? "الكمية المتاحة" : "Available Qty"}</th>
                {role === "clinic_owner" && (
                  <th className="px-3 py-2 text-start">{isAr ? "القيمة" : "Value"}</th>
                )}
                <th className="px-3 py-2 text-start">{isAr ? "المورّد" : "Supplier"}</th>
                <th className="px-3 py-2 text-start">
                  {isAr ? "متوسط الاستخدام الشهري" : "Monthly Avg"}
                </th>
                <th className="px-3 py-2 text-start">{isAr ? "تاريخ الانتهاء" : "Expiry Date"}</th>
                <th className="px-3 py-2 text-end">{isAr ? "إجراءات" : "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const fillPct = Math.min(100, Math.round((item.quantity / 25) * 100));
                return (
                  <tr
                    key={item.id}
                    className="rounded-2xl border border-slate-200/60 bg-white shadow-2xs transition hover:bg-slate-50/80"
                  >
                    <td className="rounded-s-2xl px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                            item.status === "low"
                              ? "bg-amber-50 text-amber-600"
                              : "bg-emerald-50 text-emerald-600"
                          }`}
                        >
                          <Package className="h-4 w-4" />
                        </span>
                        <div>
                          <div className="font-bold text-slate-900">
                            {isAr ? item.nameAr : item.nameEn}
                          </div>
                          {item.isExpiringSoon && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-600">
                              ▲ {isAr ? "يقترب من الانتهاء" : "Expiring soon"}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                        {isAr ? item.categoryAr : item.categoryEn}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            item.status === "available"
                              ? "bg-emerald-50 text-emerald-700"
                              : item.status === "low"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          ●{" "}
                          {item.status === "available"
                            ? isAr
                              ? "متوفر"
                              : "Available"
                            : item.status === "low"
                            ? isAr
                              ? "منخفض"
                              : "Low"
                            : isAr
                            ? "نفد"
                            : "Out"}
                        </span>
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
                          <div
                            style={{ width: `${fillPct}%` }}
                            className={`h-full rounded-full ${
                              item.status === "low" ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-black text-slate-900 tabular-nums">
                      {item.quantity}{" "}
                      <span className="text-[11px] font-normal text-slate-400">
                        {isAr ? item.unitAr : item.unitEn}
                      </span>
                    </td>
                    {role === "clinic_owner" && (
                      <td className="px-3 py-3 font-bold text-slate-700 tabular-nums">
                        {item.valueEgp.toLocaleString()} {isAr ? "ج.م" : "EGP"}
                      </td>
                    )}
                    <td className="px-3 py-3 font-semibold text-slate-600">
                      {isAr ? item.supplierAr : item.supplierEn}
                    </td>
                    <td className="px-3 py-3 text-slate-500 tabular-nums">
                      {item.monthlyUsageAvg} {isAr ? "شهرياً" : "/ mo"}
                    </td>
                    <td className="px-3 py-3 text-slate-500 tabular-nums">{item.expiryDate}</td>
                    <td className="rounded-e-2xl px-3 py-3 text-end">
                      <div className="inline-flex items-center gap-1.5">
                        {role === "doctor" ? (
                          <button
                            type="button"
                            onClick={() => handleQuickAdjustStock(item.id, -1)}
                            className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800 hover:bg-amber-100"
                          >
                            <Flag className="h-3 w-3" />
                            {isAr ? "تبليغ نقص" : "Flag Low"}
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleQuickAdjustStock(item.id, 5)}
                              title={isAr ? "إضافة توريد (+5)" : "Receive Delivery (+5)"}
                              className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-black text-emerald-700 hover:bg-emerald-50"
                            >
                              +5
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickAdjustStock(item.id, -1)}
                              title={isAr ? "تسجيل استهلاك (-1)" : "Log Usage (-1)"}
                              className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-black text-rose-700 hover:bg-rose-50"
                            >
                              -1
                            </button>
                            <button
                              type="button"
                              className="rounded-lg border border-slate-200 p-1.5 text-emerald-600 hover:bg-emerald-50"
                              title={isAr ? "إرسال طلب للمورّد عبر واتساب" : "Send WhatsApp Order"}
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* LOWER SPLIT ROW: Image 10 ("Inventory alerts 3") & Image 11 ("Al Sharq supplier 12 purchases") */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* IMAGE 10 EXACT CARD: Inventory alerts (3) */}
        <div
          dir={isAr ? "rtl" : "ltr"}
          className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_16px_rgba(11,37,40,0.04)]"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-base font-black text-slate-900">
              {isAr ? "تنبيهات المخزون" : "Inventory alerts"}
            </h3>
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-amber-300 bg-amber-50 text-xs font-black text-amber-700">
              3
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {/* Row 1 */}
            <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5">
              <div className="flex items-center gap-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500 text-sm font-black text-white">
                  !
                </span>
                <div>
                  <div className="text-sm font-black text-slate-900">
                    {isAr ? "كمبوزيت تجميلي A2" : "Composite A2"}
                  </div>
                  <div className="text-xs text-slate-500">
                    {isAr ? "متبقي 2 — الحد الأدنى 5" : "2 left — minimum 5"}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddPurchaseModal(true)}
                className="rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-black text-blue-700 hover:bg-blue-100"
              >
                {isAr ? "طلب" : "Order"}
              </button>
            </div>

            {/* Row 2 */}
            <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5">
              <div className="flex items-center gap-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-500 text-sm font-black text-white">
                  !
                </span>
                <div>
                  <div className="text-sm font-black text-slate-900">
                    {isAr ? "إبر التخدير الموضعي" : "Anesthetic needles"}
                  </div>
                  <div className="text-xs text-slate-500">
                    {isAr ? "نفد من المخزن — 3 زيارات غداً" : "Out of stock — 3 visits tomorrow"}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddPurchaseModal(true)}
                className="rounded-full border border-rose-200 bg-rose-50 px-3.5 py-1 text-xs font-black text-rose-700 hover:bg-rose-100"
              >
                {isAr ? "عاجل" : "Urgent"}
              </button>
            </div>

            {/* Row 3 */}
            <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5">
              <div className="flex items-center gap-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500 text-sm font-black text-white">
                  E
                </span>
                <div>
                  <div className="text-sm font-black text-slate-900">
                    {isAr ? "مادة أخذ المقاسات — الصلاحية" : "Impression material — expiry"}
                  </div>
                  <div className="text-xs text-slate-500">
                    {isAr ? "تنتهي الصلاحية خلال 20 يوماً" : "Expires in 20 days"}
                  </div>
                </div>
              </div>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1 text-xs font-black text-amber-700">
                {isAr ? "يُستخدم أولاً" : "Use first"}
              </span>
            </div>
          </div>

          <div className="mt-4 text-xs text-slate-500">
            {isAr
              ? "يصل التنبيه مبكراً بينما لا يزال هناك متسع من الوقت للطلب"
              : "The alert reaches you while there is still time to order"}
          </div>
        </div>

        {/* IMAGE 11 EXACT CARD: Al Sharq supplier (Strictly Clinic Owner only; Receptionist sees Physical Shelf Delivery Log) */}
        {role === "clinic_owner" ? (
          <div
            dir={isAr ? "rtl" : "ltr"}
            className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_16px_rgba(11,37,40,0.04)]"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-black text-slate-900">
                {isAr ? "مورّد شركة الشرق" : "Al Sharq supplier"}
              </h3>
              <span className="rounded-full border border-slate-200 bg-slate-100 px-3.5 py-1 text-xs font-bold text-slate-700">
                {isAr ? "12 عملية شراء" : "12 purchases"}
              </span>
            </div>

            {/* 3 Metric Boxes */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5">
                <div className="text-[11px] font-semibold text-slate-400">
                  {isAr ? "مشتريات 2026" : "2026 purchases"}
                </div>
                <div className="mt-1 text-base font-black text-slate-900 tabular-nums">
                  {isAr ? "38,400 ج.م" : "EGP 38,400"}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5">
                <div className="text-[11px] font-semibold text-slate-400">
                  {isAr ? "آخر طلب" : "Last order"}
                </div>
                <div className="mt-1 text-base font-black text-slate-900">
                  {isAr ? "6 سبتمبر" : "6 September"}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5">
                <div className="text-[11px] font-semibold text-slate-400">
                  {isAr ? "تغيّر السعر" : "Price change"}
                </div>
                <div className="mt-1 text-base font-black text-rose-600 tabular-nums">+8%</div>
                <div className="text-[10px] font-semibold text-slate-400">
                  {isAr ? "منذ مارس" : "Since March"}
                </div>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white p-4">
              <div className="text-xs font-semibold text-slate-500">
                {isAr
                  ? "تطور سعر كمبوزيت A2 خلال الأشهر"
                  : "Composite A2 price over the months"}
              </div>
              <div className="mt-3 grid grid-cols-6 items-end gap-2.5 h-24 pt-2">
                {[
                  { m: "Apr", h: 58, color: "bg-blue-500" },
                  { m: "May", h: 60, color: "bg-blue-500" },
                  { m: "Jun", h: 66, color: "bg-blue-500" },
                  { m: "Jul", h: 70, color: "bg-blue-600" },
                  { m: "Aug", h: 82, color: "bg-purple-600" },
                  { m: "Sep", h: 95, color: "bg-purple-600" },
                ].map((bar) => (
                  <div key={bar.m} className="flex flex-col items-center justify-end h-full gap-1.5">
                    <div
                      style={{ height: `${bar.h}%` }}
                      className={`w-full rounded-t-lg ${bar.color}`}
                    />
                    <span className="text-[11px] font-semibold text-slate-400">{bar.m}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_16px_rgba(11,37,40,0.04)]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-black text-slate-900">
                {isAr
                  ? "سجل استلام التوريدات وحركة الأصناف بالفرع"
                  : "Branch Delivery & Physical Shelf Count Log"}
              </h3>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-700">
                {movementLog.length} {isAr ? "حركات مسجلة" : "logged movements"}
              </span>
            </div>
            <div className="mt-4 space-y-2.5 text-xs">
              {movementLog.slice(0, 5).map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3"
                >
                  <div>
                    <div className="font-bold text-slate-900">{m.item}</div>
                    <div className="text-slate-500">{m.person}</div>
                  </div>
                  <div className="flex items-center gap-3 tabular-nums">
                    <span
                      className={`font-black ${
                        m.delta.startsWith("+") ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {m.delta}
                    </span>
                    <span className="text-slate-400">{m.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Service-to-Material Recipes & Stock Movement Log */}
      {showRecipesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {isAr
                    ? "ربط كل خدمة بخاماتها وسجل حركات المخزن"
                    : "Link Each Service to Its Materials & Stock Movement Log"}
                </h3>
                <p className="text-xs text-slate-500">
                  {isAr
                    ? "حدد مرة واحدة ما يستهلكه الحشو أو الزراعة، وسيتم الخصم وحساب التكلفة تلقائياً مع كل كشف"
                    : "Define once what a filling uses — stock is deducted and cost is calculated automatically"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRecipesModal(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="font-black text-slate-800">
                {isAr ? "وصفات استهلاك الخدمات المعتمدة:" : "Active Service Material Recipes:"}
              </div>
              {SERVICE_MATERIAL_RECIPES.map((rec, idx) => (
                <div
                  key={idx}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5"
                >
                  <div>
                    <div className="font-black text-slate-900">
                      {isAr ? rec.serviceAr : rec.serviceEn}
                    </div>
                    <div className="text-slate-500">
                      {isAr ? rec.materialsAr : rec.materialsEn}
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 font-black text-emerald-700 tabular-nums">
                    {isAr ? `تكلفة الخامات: ${rec.autoCostEgp} ج.م` : `Auto Cost: EGP ${rec.autoCostEgp}`}
                  </span>
                </div>
              ))}

              <div className="pt-3 font-black text-slate-800">
                {isAr
                  ? "سجل حركات المخزن بالتاريخ والشخص:"
                  : "Every Stock Movement Logged with Date and Person:"}
              </div>
              <div className="max-h-40 space-y-2 overflow-y-auto">
                {movementLog.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-white px-3.5 py-2"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{m.item}</span>{" "}
                      <span className="text-slate-500">· {m.person}</span>
                    </div>
                    <div className="flex items-center gap-3 tabular-nums">
                      <span
                        className={`font-black ${
                          m.delta.startsWith("+") ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {m.delta}
                      </span>
                      <span className="text-slate-400">{m.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: 1-Step Purchase Entry (Supplier + Inventory + Expense) */}
      {showAddPurchaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {role === "receptionist"
                    ? isAr
                      ? "تسجيل استلام صناديق توريد للفرع"
                      : "Receive Supply Delivery Boxes (Minya Branch)"
                    : isAr
                    ? "توريد جديد بخطوة واحدة (مخزن + مصروفات)"
                    : "One-Step Purchase to Inventory & Expenses"}
                </h3>
                <p className="text-xs text-slate-500">
                  {role === "receptionist"
                    ? isAr
                      ? "تحديث الكمية الفعلية على الرفوف عند وصول المندوب"
                      : "Log physical received boxes and update branch shelf quantities"
                    : isAr
                    ? "يدخل للمخزن ويُسجل كمصروف مرتبط بالمورّد في نفس اللحظة"
                    : "Enters inventory and records as a supplier-linked expense in one step"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddPurchaseModal(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  {isAr ? "الصنف" : "Inventory Item"}
                </label>
                <input
                  type="text"
                  value={purchaseItemName}
                  onChange={(e) => setPurchaseItemName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 font-semibold"
                />
              </div>

              <div className={role === "clinic_owner" ? "grid grid-cols-2 gap-3" : "grid grid-cols-1 gap-3"}>
                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    {isAr ? "الكمية الواردة (عدد الصناديق/العبوات)" : "Received Quantity (Boxes / Units)"}
                  </label>
                  <input
                    type="number"
                    value={purchaseQty}
                    onChange={(e) => setPurchaseQty(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 font-bold tabular-nums"
                  />
                </div>
                {role === "clinic_owner" && (
                  <div>
                    <label className="mb-1 block font-bold text-slate-700">
                      {isAr ? "سعر الوحدة (ج.م)" : "Unit Price (EGP)"}
                    </label>
                    <input
                      type="number"
                      value={purchaseUnitCost}
                      onChange={(e) => setPurchaseUnitCost(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 font-bold tabular-nums"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  {isAr ? "المورّد" : "Supplier"}
                </label>
                <select
                  value={purchaseSupplier}
                  onChange={(e) => setPurchaseSupplier(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 font-bold"
                >
                  <option value="Al Sharq supplier">Al Sharq supplier (شركة الشرق)</option>
                  <option value="الشركة الطبية">Medical Co. (الشركة الطبية)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddPurchaseModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600"
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={handleRecordOneStepPurchase}
                  className="rounded-xl bg-blue-600 px-5 py-2 font-bold text-white shadow-sm hover:bg-blue-700"
                >
                  {isAr ? "تأكيد الإضافة للمخزن والمصروفات" : "Add to Inventory & Expenses"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
