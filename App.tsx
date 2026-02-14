import React, { useState } from 'react';
import { OfferProvider, useOffer } from './context/OfferContext';
import OfferHeader from './components/OfferHeader';
import OfferInfo from './components/OfferInfo';
import ItemsTable from './components/ItemsTable/ItemsTable';
import SupplierRatesModal from './components/Modals/SupplierRatesModal';
import { Check, AlertTriangle, RefreshCw, Settings, FileText, Search } from 'lucide-react';

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
  const { saveOffer, loading, error, offer, loadOffer } = useOffer();
  const [showRates, setShowRates] = useState(false);
  const [manualId, setManualId] = useState('');

  // If initial load failed specifically with network error
  if (!loading && error && (error.includes('Failed to fetch') || error.includes('CORS'))) {
      return <SetupGuide error={error} onRetry={() => window.location.reload()} />;
  }

  // Handle case where API is connected but no offer was loaded (e.g. invalid or missing ID)
  if (!loading && !error && !offer) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
         <OfferHeader onOpenRates={() => setShowRates(true)} />
         <div className="flex-1 flex flex-col items-center justify-center p-4">
             <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 text-center max-w-md animate-in slide-in-from-bottom-5 w-full">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                    <FileText className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">No Offer Loaded</h2>
                <p className="text-slate-500 mb-6 text-sm">
                    The Offer ID was not found in the URL. This happens in preview mode. Please enter the ID manually below.
                </p>
                
                <div className="mb-6 p-2 bg-slate-100 rounded border border-slate-200 text-left">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Current App Location:</p>
                    <code className="text-[10px] text-slate-600 font-mono break-all block">
                        {window.location.href}
                    </code>
                </div>
                
                <div className="text-left">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Offer ID</label>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={manualId}
                            onChange={(e) => setManualId(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && manualId && loadOffer(manualId)}
                            placeholder="e.g. OFE7503"
                            className="flex-1 px-4 py-3 bg-slate-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-av-blue focus:bg-white transition-all font-medium text-slate-800"
                        />
                        <button 
                            onClick={() => loadOffer(manualId)}
                            disabled={!manualId}
                            className="px-6 py-3 bg-av-blue text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center gap-2"
                        >
                            <Search className="w-4 h-4" />
                            Load
                        </button>
                    </div>
                </div>
             </div>
         </div>
         {showRates && <SupplierRatesModal onClose={() => setShowRates(false)} />}
      </div>
    );
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
  // Robust ID extraction from URL
  const getOfferId = () => {
    try {
        const params = new URLSearchParams(window.location.search);
        const idFromSearch = params.get('id');
        if (idFromSearch) return idFromSearch;
        
        // Fallback for hash router if needed
        if (window.location.hash.includes('?')) {
            const hashParams = new URLSearchParams(window.location.hash.split('?')[1]);
            return hashParams.get('id');
        }
    } catch (e) {
        console.warn("Could not parse URL for ID");
    }
    
    return undefined;
  };

  const offerId = getOfferId();

  return (
    <OfferProvider initialOfferId={offerId}>
        <MainLayout />
    </OfferProvider>
  );
};

export default App;