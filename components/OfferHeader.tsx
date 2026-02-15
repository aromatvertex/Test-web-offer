import React from 'react';
import { Truck, Languages } from 'lucide-react';
import { useOffer } from '../context/OfferContext';

interface Props {
  onOpenRates: () => void;
}

const OfferHeader: React.FC<Props> = ({ onOpenRates }) => {
  const { language, setLanguage, t } = useOffer();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-[1600px] mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo Area */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-av-blue rounded flex items-center justify-center text-white font-bold text-lg">
            V
          </div>
          <span className="font-bold text-lg text-slate-800">Offer Maker</span>
        </div>

        {/* Actions Area */}
        <div className="flex items-center gap-4">
          <button 
            onClick={onOpenRates}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
          >
            <Truck className="w-4 h-4" />
            {t.manageRates}
          </button>

          <div className="flex items-center bg-gray-100 rounded-lg p-1 border border-gray-200">
            <button 
                onClick={() => setLanguage('EN')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${language === 'EN' ? 'bg-white text-av-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                EN
            </button>
            <button 
                onClick={() => setLanguage('PL')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${language === 'PL' ? 'bg-white text-av-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                PL
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default OfferHeader;