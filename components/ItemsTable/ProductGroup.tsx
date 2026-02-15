import React, { useState } from 'react';
import { Package, ChevronDown, ChevronRight, X } from 'lucide-react';
import TierRow from './TierRow';
import { useOffer } from '../../context/OfferContext';
import { parseBoolean } from '../../utils/formatters';

interface Props {
  productId: string;
}

const ProductGroup: React.FC<Props> = ({ productId }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [showExcluded, setShowExcluded] = useState(false);
  const { getProductById, getItemsByProduct, deleteItems, t } = useOffer();

  const product = getProductById(productId);
  const items = getItemsByProduct(productId);

  const activeTiers = items.filter(t => parseBoolean(t.Included));
  const excludedTiers = items.filter(t => !parseBoolean(t.Included));

  if (!product) return null;

  const handleRemoveProduct = () => {
      deleteItems(items.map(i => i['Offer Item ID']));
  };

  return (
    <div className="mb-4 bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Product Header */}
      <div 
        className="flex items-center justify-between p-3 bg-white border-b border-gray-100 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <button className="text-slate-400 hover:text-av-blue">
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-blue-50 text-av-blue flex items-center justify-center">
                <Package className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200">{product.id}</span>
                    <span className="font-bold text-slate-800 text-sm">{product.name}</span>
                </div>
                <span className="text-xs text-slate-500 font-medium">{product.supplierName} • {product.category}</span>
            </div>
          </div>
        </div>

        <button 
            onClick={(e) => { e.stopPropagation(); handleRemoveProduct(); }}
            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
        >
            <X className="w-5 h-5" />
        </button>
      </div>

      {isOpen && (
        <div className="p-0 animate-in slide-in-from-top-1">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full min-w-[1200px]">
                    <thead>
                        <tr className="bg-slate-50 border-b border-gray-200">
                            <th className="w-16 py-2 text-center text-[10px] font-bold text-slate-500 uppercase">{t.tools}</th>
                            <th className="w-40 py-2 text-left text-[10px] font-bold text-slate-500 uppercase pl-2">{t.details}</th>
                            <th className="w-24 py-2 text-left text-[10px] font-bold text-slate-500 uppercase">{t.markup}</th>
                            <th className="w-20 py-2 text-left text-[10px] font-bold text-slate-500 uppercase">{t.curr}</th>
                            <th className="w-24 py-2 text-left text-[10px] font-bold text-slate-500 uppercase">{t.actQty}</th>
                            <th className="w-16 py-2 text-left text-[10px] font-bold text-slate-500 uppercase">{t.ships}</th>
                            <th className="w-28 py-2 text-left text-[10px] font-bold text-slate-500 uppercase">{t.incSupp}</th>
                            <th className="w-28 py-2 text-left text-[10px] font-bold text-slate-500 uppercase">{t.incAv}</th>
                            <th className="w-24 py-2 text-right text-[10px] font-bold text-slate-500 uppercase pr-2">{t.supAv}</th>
                            <th className="w-24 py-2 text-right text-[10px] font-bold text-slate-500 uppercase pr-2">{t.avPl}</th>
                            <th className="w-24 py-2 text-right text-[10px] font-bold text-slate-500 uppercase pr-2">{t.totalTrans}</th>
                            <th className="w-28 py-2 text-right text-[10px] font-bold text-slate-500 uppercase pr-2 bg-slate-100">{t.priceMark}</th>
                            <th className="w-28 py-2 text-right text-[10px] font-bold text-av-blue uppercase pr-2 bg-blue-50">{t.finalPrice}</th>
                            <th className="min-w-[150px] py-2 text-left text-[10px] font-bold text-slate-500 uppercase pl-2">{t.comment}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activeTiers.map(item => (
                            <TierRow key={item['Offer Item ID']} item={item} supplierName={product.supplierName} />
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Excluded Section */}
            {excludedTiers.length > 0 && (
                <div className="mt-2 border-t border-dashed border-gray-300">
                    <div 
                        className="flex items-center gap-2 px-4 py-2 bg-slate-50 cursor-pointer text-xs font-bold text-slate-500 uppercase"
                        onClick={() => setShowExcluded(!showExcluded)}
                    >
                         {showExcluded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                         {t.excluded} ({excludedTiers.length})
                    </div>
                    {showExcluded && (
                        <div className="overflow-x-auto custom-scrollbar bg-slate-50 opacity-80">
                            <table className="w-full min-w-[1200px]">
                                <tbody>
                                    {excludedTiers.map(item => (
                                        <TierRow key={item['Offer Item ID']} item={item} supplierName={product.supplierName} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default ProductGroup;