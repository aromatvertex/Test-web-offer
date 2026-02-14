import React, { useState } from 'react';
import { OfferProvider, useOffer } from './context/OfferContext';
import OfferHeader from './components/OfferHeader';
import OfferInfo from './components/OfferInfo';
import ItemsTable from './components/ItemsTable/ItemsTable';
import SupplierRatesModal from './components/Modals/SupplierRatesModal';
import { Check, AlertTriangle, RefreshCw, ExternalLink, Settings } from 'lucide-react';

const SetupGuide: React.FC<{ error: string, onRetry: () => void }> = ({ error, onRetry }) => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <div className="bg-white max-w-2xl w-full rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      <div className="bg-red-50 p-6 border-b border-red-100 flex items-start gap-4">
        <div className="p-3 bg-red-100 rounded-full text-red-600">
            <AlertTriangle className="w-8 h-8" />
        </div>
        <div>
            <h1 className="text-xl font-bold text-red-700 mb-2">Connection Failed</h1>
            <p className="text-red-600 text-sm font-medium">{error}</p>
        </div>
      </div>
      
      <div className="p-8 space-y-6">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Settings className="w-5 h-5 text-av-blue" />
            Troubleshooting Steps
        </h2>
        
        <div className="space-y-4">
            <div className="flex gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="font-bold text-blue-800 text-lg">1</div>
                <div>
                    <h3 className="font-bold text-blue-900">Check Deployment Permissions</h3>
                    <p className="text-sm text-blue-700 mt-1">
                        In Google Apps Script editor, click <strong>Deploy &gt; Manage Deployments</strong>. 
                        Ensure "Who has access" is set to <strong>"Anyone"</strong>. If not, edit and redeploy.
                    </p>
                </div>
            </div>

            <div className="flex gap-4 p-4 bg-slate-50 rounded-xl border border-gray-200">
                <div className="font-bold text-slate-500 text-lg">2</div>
                <div>
                    <h3 className="font-bold text-slate-700">Verify Spreadsheet ID</h3>
                    <p className="text-sm text-slate-600 mt-1">
                        Open <code>backend/Code.js</code> and ensure <code>SPREADSHEET_ID</code> matches your actual Google Sheet ID.
                    </p>
                </div>
            </div>

            <div className="flex gap-4 p-4 bg-slate-50 rounded-xl border border-gray-200">
                <div className="font-bold text-slate-500 text-lg">3</div>
                <div>
                    <h3 className="font-bold text-slate-700">Browser Blocking?</h3>
                    <p className="text-sm text-slate-600 mt-1">
                        Disable AdBlockers or Privacy extensions for <code>script.google.com</code>.
                    </p>
                </div>
            </div>
        </div>

        <div className="pt-4 flex justify-end">
            <button 
                onClick={onRetry}
                className="px-6 py-3 bg-av-blue hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg hover:shadow-blue-200"
            >
                <RefreshCw className="w-5 h-5" />
                Retry Connection
            </button>
        </div>
      </div>
    </div>
  </div>
);

const MainLayout: React.FC = () => {
  const { saveOffer, loading, error, loadOffer } = useOffer();
  const [showRates, setShowRates] = useState(false);

  // If initial load failed specifically with network error
  if (!loading && error && (error.includes('Failed to fetch') || error.includes('CORS'))) {
      return <SetupGuide error={error} onRetry={() => window.location.reload()} />;
  }

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
  const urlParams = new URLSearchParams(window.location.search);
  const offerId = urlParams.get('id') || undefined;

  return (
    <OfferProvider initialOfferId={offerId}>
        <MainLayout />
    </OfferProvider>
  );
};

export default App;