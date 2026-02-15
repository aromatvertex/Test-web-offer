import React, { useState, useMemo } from 'react';
import { Plus, AlertOctagon } from 'lucide-react';
import { useOffer } from '../../context/OfferContext';
import ProductGroup from './ProductGroup';
import ProductSearchModal from '../Modals/ProductSearchModal';

const ItemsTable: React.FC = () => {
  const { items, loading, error, t } = useOffer();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Group items by Product ID
  const productIds = useMemo(() => {
    return Array.from(new Set(items.map(i => i['Product ID'])));
  }, [items]);
  
  const oldItems = useMemo(() => {
    return items.filter(i => false); // Placeholder logic
  }, [items]);

  if (loading) {
      return (
          <div className="p-12 text-center">
              <div className="w-8 h-8 border-4 border-av-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-500 font-medium">{t.loading}</p>
          </div>
      );
  }

  if (error) {
      return (
          <div className="p-8 text-center bg-red-50 rounded-xl border border-red-100">
              <p className="text-red-600 font-bold mb-2">{t.error}</p>
              <p className="text-red-500 text-sm">{error}</p>
          </div>
      );
  }

  return (
    <div className="space-y-6">
        
        {/* Old Item Configuration (Conditional) */}
        {oldItems.length > 0 && (
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm opacity-80">
                <h3 className="text-sm font-bold text-slate-700 uppercase mb-4 flex items-center gap-2">
                    <AlertOctagon className="w-5 h-5 text-orange-500" />
                    {t.oldItemConfig}
                </h3>
                <div className="p-4 bg-orange-50 text-orange-800 text-sm rounded border border-orange-100">
                    Legacy items detected. These are read-only in this view.
                </div>
            </div>
        )}

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 uppercase mb-4 flex items-center gap-2">
                <span className="w-2 h-6 bg-av-blue rounded-full"></span>
                {t.newItemConfig}
            </h3>
            
            {productIds.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                    {t.noProducts}
                </div>
            ) : (
                productIds.map(pid => (
                    <ProductGroup key={pid} productId={pid} />
                ))
            )}

            <button 
                onClick={() => setIsModalOpen(true)}
                className="w-full py-4 border-2 border-dashed border-av-blue border-opacity-30 rounded-xl flex items-center justify-center gap-2 text-av-blue font-bold hover:bg-blue-50 hover:border-opacity-60 transition-all group mt-4"
            >
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus className="w-5 h-5" />
                </div>
                {t.addProduct}
            </button>
        </div>

        {isModalOpen && <ProductSearchModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
};

export default ItemsTable;