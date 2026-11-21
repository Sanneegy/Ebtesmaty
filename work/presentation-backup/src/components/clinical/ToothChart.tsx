'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface ToothFinding {
  id: string;
  toothNumber: string;
  surface?: string | null;
  condition: string;
  notes?: string | null;
  recordedAt: string;
  recordedByUser: {
    fullName: string;
  };
}

interface ToothData {
  latest?: ToothFinding;
  history?: ToothFinding[];
}

interface Props {
  toothChart: Record<string, ToothData>;
  patientId: string;
  onToothUpdated?: () => void;
  readOnly?: boolean;
}

const ADULT_UPPER_ARCH = [
  // Upper Right (Quadrant 1: 18 to 11)
  '18', '17', '16', '15', '14', '13', '12', '11',
  // Upper Left (Quadrant 2: 21 to 28)
  '21', '22', '23', '24', '25', '26', '27', '28'
];

const ADULT_LOWER_ARCH = [
  // Lower Right (Quadrant 4: 48 to 41)
  '48', '47', '46', '45', '44', '43', '42', '41',
  // Lower Left (Quadrant 3: 31 to 38)
  '31', '32', '33', '34', '35', '36', '37', '38'
];

const CONDITION_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  HEALTHY: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  CARIES: { bg: 'bg-rose-100', text: 'text-rose-800 font-bold', border: 'border-rose-400' },
  RESTORED: { bg: 'bg-blue-100', text: 'text-blue-800 font-medium', border: 'border-blue-400' },
  ROOT_CANAL_TREATED: { bg: 'bg-purple-100', text: 'text-purple-800 font-semibold', border: 'border-purple-400' },
  MISSING: { bg: 'bg-slate-200', text: 'text-slate-400 line-through', border: 'border-slate-300' },
  FRACTURED: { bg: 'bg-amber-100', text: 'text-amber-800 font-bold', border: 'border-amber-400' },
};

export function ToothChart({ toothChart, patientId, onToothUpdated, readOnly = false }: Props) {
  const [selectedTooth, setSelectedTooth] = useState<string | null>(null);
  const [condition, setCondition] = useState<string>('CARIES');
  const [surface, setSurface] = useState<string>('O');
  const [notes, setNotes] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedData = selectedTooth ? toothChart[selectedTooth] : null;

  async function handleRecordFinding(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTooth) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/clinical/teeth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          toothNumber: selectedTooth,
          surface: surface || null,
          condition,
          notes: notes || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save tooth finding');
      }

      setNotes('');
      if (onToothUpdated) onToothUpdated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function renderToothButton(toothNum: string) {
    const data = toothChart[toothNum];
    const condition = data?.latest?.condition || 'HEALTHY';
    const isSelected = selectedTooth === toothNum;
    const isMissing = condition === 'MISSING';
    const isCaries = condition === 'CARIES';
    const isRestored = condition === 'RESTORED';
    const isRCT = condition === 'ROOT_CANAL_TREATED';
    const isFractured = condition === 'FRACTURED';

    const surfaceStr = (data?.latest?.surface || '').toUpperCase();
    const hasO = surfaceStr.includes('O');
    const hasM = surfaceStr.includes('M');
    const hasD = surfaceStr.includes('D');
    const hasB = surfaceStr.includes('B');
    const hasL = surfaceStr.includes('L');

    const getSurfaceColor = (hasSurf: boolean) => {
      if (!hasSurf) return '#FFFFFF';
      if (isCaries) return '#F43F5E';
      if (isRestored) return '#3B82F6';
      if (isRCT) return '#A855F7';
      if (isFractured) return '#F59E0B';
      return '#10B981';
    };

    return (
      <button
        key={toothNum}
        type="button"
        onClick={() => setSelectedTooth(toothNum)}
        className={`w-11 sm:w-13 h-20 sm:h-22 flex flex-col items-center justify-between p-1 rounded-xl border transition-all text-center ${
          isSelected
            ? 'ring-2 ring-[#176C5B] bg-[#E3F0EB]/60 border-[#176C5B] shadow-md scale-105 z-10'
            : isMissing
            ? 'bg-slate-100/80 border-slate-200 opacity-60'
            : 'bg-white border-[#DDE5E1] hover:border-[#176C5B] hover:shadow-2xs'
        }`}
      >
        <span className="text-xs font-bold font-mono text-[#163447]">{toothNum}</span>

        {/* Anatomical 5-Surface Occlusal Cross Diagram */}
        <div className="relative w-8 h-8 my-0.5">
          {isMissing ? (
            <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xs">
              ✕
            </div>
          ) : (
            <svg viewBox="0 0 40 40" className="w-full h-full drop-shadow-2xs">
              {/* Outer Crown Border */}
              <rect x="2" y="2" width="36" height="36" rx="6" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
              
              {/* Buccal (Top trapezoid) */}
              <polygon points="2,2 38,2 28,12 12,12" fill={getSurfaceColor(hasB)} stroke="#94A3B8" strokeWidth="0.75" />
              
              {/* Lingual (Bottom trapezoid) */}
              <polygon points="2,38 38,38 28,28 12,28" fill={getSurfaceColor(hasL)} stroke="#94A3B8" strokeWidth="0.75" />
              
              {/* Mesial (Left trapezoid) */}
              <polygon points="2,2 12,12 12,28 2,38" fill={getSurfaceColor(hasM)} stroke="#94A3B8" strokeWidth="0.75" />
              
              {/* Distal (Right trapezoid) */}
              <polygon points="38,2 28,12 28,28 38,38" fill={getSurfaceColor(hasD)} stroke="#94A3B8" strokeWidth="0.75" />
              
              {/* Occlusal Center (Square) */}
              <rect x="12" y="12" width="16" height="16" fill={getSurfaceColor(hasO || (!hasB && !hasL && !hasM && !hasD && condition !== 'HEALTHY'))} stroke="#64748B" strokeWidth="1" />
            </svg>
          )}
        </div>

        {/* Condition Badge */}
        <span
          className={`text-[8px] font-bold px-1 py-0.2 rounded truncate max-w-full ${
            isMissing
              ? 'text-slate-400 line-through'
              : isCaries
              ? 'text-rose-700 bg-rose-50'
              : isRestored
              ? 'text-blue-700 bg-blue-50'
              : isRCT
              ? 'text-purple-700 bg-purple-50'
              : isFractured
              ? 'text-amber-800 bg-amber-50'
              : 'text-emerald-700 bg-emerald-50'
          }`}
        >
          {condition === 'ROOT_CANAL_TREATED' ? 'RCT' : condition.substring(0, 4)}
        </span>
      </button>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>FDI Two-Digit Odontogram (Adult Dental Chart)</span>
            <Badge variant="teal">Real-time Charting</Badge>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Standard ISO 3950 / FDI two-digit clinical notation. Select any tooth to review findings history or record pathologies.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> Caries
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span> Restored
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span> RCT
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-300 line-through">
            Missing
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Healthy
          </span>
        </div>
      </div>

      {/* Dental Arches Representation */}
      <div className="space-y-6 overflow-x-auto pb-4">
        {/* Upper Arch */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2 px-1 uppercase tracking-wider">
            <span>Maxillary Right (Q1)</span>
            <span className="text-teal-600 bg-teal-50 px-2 py-0.5 rounded">Upper Arch</span>
            <span>Maxillary Left (Q2)</span>
          </div>
          <div className="flex justify-center items-center gap-1 sm:gap-1.5 p-3 bg-slate-50/70 rounded-2xl border border-slate-100">
            <div className="flex gap-1 sm:gap-1.5">
              {ADULT_UPPER_ARCH.slice(0, 8).map(renderToothButton)}
            </div>
            <div className="w-px h-16 bg-slate-300 mx-1"></div>
            <div className="flex gap-1 sm:gap-1.5">
              {ADULT_UPPER_ARCH.slice(8).map(renderToothButton)}
            </div>
          </div>
        </div>

        {/* Lower Arch */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2 px-1 uppercase tracking-wider">
            <span>Mandibular Right (Q4)</span>
            <span className="text-teal-600 bg-teal-50 px-2 py-0.5 rounded">Lower Arch</span>
            <span>Mandibular Left (Q3)</span>
          </div>
          <div className="flex justify-center items-center gap-1 sm:gap-1.5 p-3 bg-slate-50/70 rounded-2xl border border-slate-100">
            <div className="flex gap-1 sm:gap-1.5">
              {ADULT_LOWER_ARCH.slice(0, 8).map(renderToothButton)}
            </div>
            <div className="w-px h-16 bg-slate-300 mx-1"></div>
            <div className="flex gap-1 sm:gap-1.5">
              {ADULT_LOWER_ARCH.slice(8).map(renderToothButton)}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Tooth Inspector & Finding Form */}
      {selectedTooth && (
        <div className="mt-6 p-5 bg-slate-50 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-teal-600 text-white font-bold flex items-center justify-center text-sm">
                #{selectedTooth}
              </span>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Tooth #{selectedTooth} Details & History
                </h4>
                <p className="text-xs text-slate-500">
                  Current Status: <span className="font-semibold text-slate-800">{selectedData?.latest?.condition || 'HEALTHY'}</span>
                  {selectedData?.latest?.surface && ` (Surface: ${selectedData.latest.surface})`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedTooth(null)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              ✕ Close Inspector
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Finding History */}
            <div>
              <h5 className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                Chronological Findings History
              </h5>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedData?.history && selectedData.history.length > 0 ? (
                  selectedData.history.map((h, i) => (
                    <div key={h.id || i} className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs shadow-2xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-800">{h.condition}</span>
                        <span className="text-xs text-slate-400">
                          {new Date(h.recordedAt).toLocaleDateString()}
                        </span>
                      </div>
                      {h.surface && (
                        <p className="text-xs text-slate-600">Surface: <span className="font-mono font-medium">{h.surface}</span></p>
                      )}
                      {h.notes && (
                        <p className="text-xs text-slate-500 italic mt-0.5">&quot;{h.notes}&quot;</p>
                      )}
                      <p className="text-xs text-slate-400 mt-1">Recorded by: {h.recordedByUser?.fullName}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-3 italic text-center">
                    No historical findings recorded for tooth #{selectedTooth}. Assumed healthy.
                  </p>
                )}
              </div>
            </div>

            {/* Record New Finding Form */}
            {!readOnly && (
              <form onSubmit={handleRecordFinding} className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Record New Pathology / Restoration
                </h5>
                {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Condition</label>
                    <select
                      value={condition}
                      onChange={(e) => setCondition(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-200 p-2 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    >
                      <option value="CARIES">CARIES (Active Cavity)</option>
                      <option value="RESTORED">RESTORED (Filling / Inlay)</option>
                      <option value="ROOT_CANAL_TREATED">ROOT CANAL TREATED</option>
                      <option value="FRACTURED">FRACTURED / CRACKED</option>
                      <option value="MISSING">MISSING / EXTRACTED</option>
                      <option value="HEALTHY">HEALTHY / SOUND</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Surface (e.g. MOD, O, B)</label>
                    <input
                      type="text"
                      value={surface}
                      onChange={(e) => setSurface(e.target.value.toUpperCase())}
                      placeholder="e.g. MOD, O, D"
                      className="w-full text-xs rounded-xl border border-slate-200 p-2 focus:ring-2 focus:ring-teal-500 focus:outline-hidden uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Clinical Observation Notes</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Recurrent decay under distal amalgam margin"
                    className="w-full text-xs rounded-xl border border-slate-200 p-2 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div className="pt-1 flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={saving}
                  >
                    Save Tooth #{selectedTooth} Finding
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
