import React, { useState } from 'react';
import { ChevronDown, Info } from 'lucide-react';
import { useOffer } from '../context/OfferContext';

const OfferInfo: React.FC = () => {
  const { offer } = useOffer();
  const [isOpen, setIsOpen] = useState(true);

  if (!offer) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer bg-white hover:bg-slate-50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-av-blue" />
          <h2 className="font-bold text-slate-700">Offer Information</h2>
          <span className="text-sm text-slate-500 ml-2 font-medium">({offer['Subject']})</span>
        </div>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="p-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-2 duration-200">
            <div className="space-y-4">
                <div className="flex items-center">
                    <label className="w-32 text-xs font-bold text-slate-500 uppercase text-right mr-4">Temat</label>
                    <input type="text" value={offer['Subject'] || ''} readOnly className="flex-1 px-3 py-2 bg-slate-50 border border-gray-200 rounded-md text-sm text-slate-700 focus:outline-none" />
                </div>
                <div className="flex items-center">
                    <label className="w-32 text-xs font-bold text-slate-500 uppercase text-right mr-4">Assigned To</label>
                    <input type="text" value={offer['Assigned To'] || ''} readOnly className="flex-1 px-3 py-2 bg-slate-50 border border-gray-200 rounded-md text-sm text-slate-700 text-opacity-70" />
                </div>
            </div>
            <div className="space-y-4">
                <div className="flex items-center">
                    <label className="w-32 text-xs font-bold text-slate-500 uppercase text-right mr-4">Klient</label>
                    <input type="text" value={offer['Customer Name'] || ''} readOnly className="flex-1 px-3 py-2 bg-slate-50 border border-gray-200 rounded-md text-sm text-slate-700" />
                </div>
                <div className="flex items-center">
                    <label className="w-32 text-xs font-bold text-slate-500 uppercase text-right mr-4">Ważne do</label>
                    <input type="date" value={offer['Valid Until'] ? offer['Valid Until'].substring(0, 10) : ''} readOnly className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-md text-sm text-slate-700" />
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default OfferInfo;