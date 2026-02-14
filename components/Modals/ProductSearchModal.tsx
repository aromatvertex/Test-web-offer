import React, { useState } from 'react';
import { Search, X, Package } from 'lucide-react';
import { useOffer } from '../../context/OfferContext';

interface Props {
  onClose: () => void;
}

const ProductSearchModal: React.FC<Props> = ({ onClose }) => {
  const { products, addProduct } = useOffer();
  const [term, setTerm] = useState('');

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(term.toLowerCase()) || 
    p.id.toLowerCase().includes(term.toLowerCase()) ||
    p.supplierName.toLowerCase().includes(term.toLowerCase())
  ).slice(0, 10); // Limit results

  const handleSelect = (p: any) => {
      addProduct(p.id);
      onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <Package className="w-5 h-5 text-av-blue" />
                Vertex Product Catalog
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors">
                <X className="w-5 h-5" />
            </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-100">
            <div className="relative">
                <Search className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                <input 
                    type="text" 
                    autoFocus
                    placeholder="Search by Name, Code or Supplier..." 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-av-blue focus:bg-white transition-all font-medium text-slate-700"
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                />
            </div>
        </div>

        {/* Results */}
        <div className="overflow-y-auto p-2 flex-1 custom-scrollbar">
            <table className="w-full text-sm">
                <thead className="text-xs text-slate-400 uppercase bg-white sticky top-0">
                    <tr>
                        <th className="px-4 py-2 text-left">Code</th>
                        <th className="px-4 py-2 text-left">Product Name</th>
                        <th className="px-4 py-2 text-left">Category</th>
                        <th className="px-4 py-2 text-left">Supplier</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {filtered.map(p => (
                        <tr 
                            key={p.id} 
                            onClick={() => handleSelect(p)}
                            className="hover:bg-blue-50 cursor-pointer transition-colors group"
                        >
                            <td className="px-4 py-3 font-bold text-slate-600 group-hover:text-av-blue">{p.id}</td>
                            <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                            <td className="px-4 py-3 text-slate-500">
                                <span className="px-2 py-1 rounded bg-slate-100 text-xs font-bold text-slate-600">{p.category}</span>
                            </td>
                            <td className="px-4 py-3 text-slate-500">{p.supplierName}</td>
                        </tr>
                    ))}
                    {filtered.length === 0 && (
                        <tr>
                            <td colSpan={4} className="text-center py-10 text-slate-400">
                                No products found matching "{term}"
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default ProductSearchModal;
