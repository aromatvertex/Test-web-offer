import React, { useState, useEffect } from 'react';
import { Truck, X, Plus, Save } from 'lucide-react';
import { useOffer } from '../../context/OfferContext';

interface Props {
  onClose: () => void;
}

const SupplierRatesModal: React.FC<Props> = ({ onClose }) => {
  const { supplierRates, saveTransportRates } = useOffer();
  const [localRates, setLocalRates] = useState(supplierRates);
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');

  useEffect(() => {
    setLocalRates(supplierRates);
  }, [supplierRates]);

  const suppliers = Object.keys(localRates);

  const handleSave = () => {
    saveTransportRates(localRates);
    onClose();
  };

  // Helper to safely access rates
  const getSupplierRate = (name: string) => {
      return localRates[name] || { validity: '', tiers: [] };
  };

  const handleUpdateTier = (idx: number, field: string, value: string) => {
      const current = getSupplierRate(selectedSupplier);
      const newTiers = [...current.tiers];
      newTiers[idx] = { ...newTiers[idx], [field]: parseFloat(value) };
      
      setLocalRates({
          ...localRates,
          [selectedSupplier]: { ...current, tiers: newTiers }
      });
  };

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-4 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white">
            <h3 className="font-bold text-slate-700 flex items-center gap-2 text-lg">
                <Truck className="w-6 h-6 text-av-green" />
                Manage Supplier Rates
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors">
                <X className="w-6 h-6" />
            </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-50">
            <div className="flex gap-4 mb-6">
                <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select Supplier</label>
                    <select 
                        value={selectedSupplier}
                        onChange={(e) => setSelectedSupplier(e.target.value)}
                        className="w-full p-3 bg-white border border-gray-200 rounded-lg font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-av-green"
                    >
                        <option value="">-- Select --</option>
                        {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className="w-48">
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Validity</label>
                     <input 
                        type="date" 
                        value={selectedSupplier ? getSupplierRate(selectedSupplier).validity : ''}
                        className="w-full p-3 bg-white border border-gray-200 rounded-lg text-sm" 
                    />
                </div>
            </div>

            {selectedSupplier && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Kg From</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Kg To</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Cost (EUR)</th>
                                <th className="w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {getSupplierRate(selectedSupplier).tiers.map((tier, idx) => (
                                <tr key={idx}>
                                    <td className="px-4 py-2"><input type="number" value={tier.from} onChange={(e) => handleUpdateTier(idx, 'from', e.target.value)} className="w-full p-2 border border-gray-200 rounded" /></td>
                                    <td className="px-4 py-2"><input type="number" value={tier.to} onChange={(e) => handleUpdateTier(idx, 'to', e.target.value)} className="w-full p-2 border border-gray-200 rounded" /></td>
                                    <td className="px-4 py-2"><input type="number" value={tier.eur} onChange={(e) => handleUpdateTier(idx, 'eur', e.target.value)} className="w-full p-2 border border-gray-200 rounded" /></td>
                                    <td className="px-4 py-2 text-center">
                                        <button className="text-slate-300 hover:text-red-500"><X className="w-4 h-4" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold text-sm flex items-center justify-center gap-2 border-t border-gray-100">
                        <Plus className="w-4 h-4" /> Add Rate Tier
                    </button>
                </div>
            )}
        </div>

        <div className="p-4 bg-white border-t border-gray-200 flex justify-end gap-3">
             <button onClick={onClose} className="px-6 py-2.5 font-bold text-slate-500 hover:bg-slate-50 rounded-lg transition-colors">Cancel</button>
             <button onClick={handleSave} className="px-6 py-2.5 bg-av-green hover:bg-av-green-dark text-white font-bold rounded-lg shadow-lg shadow-green-100 flex items-center gap-2 transition-all">
                <Save className="w-4 h-4" /> Save Rates
             </button>
        </div>
      </div>
    </div>
  );
};

export default SupplierRatesModal;
