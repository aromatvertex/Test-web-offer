import React, { useState } from 'react';
import { OfferProvider, useOffer } from './context/OfferContext';
import OfferHeader from './components/OfferHeader';
import OfferInfo from './components/OfferInfo';
import ItemsTable from './components/ItemsTable/ItemsTable';
import SupplierRatesModal from './components/Modals/SupplierRatesModal';
import { Check } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { saveOffer, offer } = useOffer();
  const [showRates, setShowRates] = useState(false);

  // Get Offer ID from URL if present
  // In a real router scenario, use useParams or useSearchParams
  // For now we rely on the default loaded by Context or mock
  
  return (
    <div className="min-h-screen pb-24">
      <OfferHeader onOpenRates={() => setShowRates(true)} />
      
      <main className="max-w-[1600px] mx-auto px-4 py-6">
        <OfferInfo />
        <ItemsTable />
      </main>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white bg-opacity-90 backdrop-blur-md border-t border-gray-200 p-4 z-40 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
        <div className="max-w-[1600px] mx-auto flex items-center justify-end gap-4">
             <button className="px-8 py-3 font-bold text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors flex items-center gap-2">
                Anuluj
             </button>
             <button 
                onClick={() => saveOffer().then(() => alert("Oferta Zapisana!"))}
                className="px-10 py-3 bg-av-green hover:bg-av-green-dark text-white font-bold rounded-full shadow-xl shadow-green-100 flex items-center gap-2 transform hover:-translate-y-0.5 transition-all"
            >
                <Check className="w-5 h-5" />
                Zapisz i Generuj Ofertę
             </button>
        </div>
      </div>

      {showRates && <SupplierRatesModal onClose={() => setShowRates(false)} />}
    </div>
  );
};

const App: React.FC = () => {
  // Simple extraction of ID for demo purposes
  const urlParams = new URLSearchParams(window.location.search);
  const offerId = urlParams.get('id') || undefined;

  return (
    <OfferProvider initialOfferId={offerId}>
        <MainLayout />
    </OfferProvider>
  );
};

export default App;