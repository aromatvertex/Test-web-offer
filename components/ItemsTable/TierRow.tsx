import React, { useEffect, useState } from 'react';
import { Copy, Trash2, AlertTriangle } from 'lucide-react';
import { OfferItem } from '../../types';
import { calculateTransportCosts, calculateFinalPrice } from '../../utils/pricing';
import { useOffer } from '../../context/OfferContext';
import { parseBoolean } from '../../utils/formatters';

interface Props {
  item: OfferItem;
  supplierName: string;
}

const TierRow: React.FC<Props> = ({ item, supplierName }) => {
  const { updateItem, duplicateItem, deleteItem, toggleItemIncluded, supplierRates } = useOffer();
  
  // Calculate on fly
  const transportCalc = calculateTransportCosts(item, supplierName, supplierRates);
  const markup = item['Markup %'];
  const purchPrice = parseFloat(item['Purchase Price']) || 0;
  
  // Calculate derived values
  const pricePlusMarkup = purchPrice * (1 + markup);
  const transportPerUnit = item['Actual Quantity'] > 0 
     ? transportCalc.totalTrans / item['Actual Quantity'] 
     : 0;

  // We should ideally use the backend's 'Final Price On Offer', but for interactivity we might want to recalc locally or wait for backend.
  // The provided instructions imply calculations happen.
  const finalPrice = calculateFinalPrice(
      purchPrice, 
      markup * 100, 
      transportPerUnit, 
      item['Incoterms Supplier'], 
      item['Incoterms A V']
  );

  const isIncluded = parseBoolean(item.Included);

  const handleChange = (field: keyof OfferItem, value: any) => {
    // Mapping frontend actions to backend fields
    // updateItem handles keys
    updateItem(item['Offer Item ID'], { [field]: value });
  };

  const handlePriceChange = (newFinalPrice: number) => {
      // Reverse calc: Markup = ((Final - Transport) / Base) - 1
      if (purchPrice <= 0) return;
      
      const newMarkup = ((newFinalPrice - transportPerUnit) / purchPrice) - 1;
      // Backend expects decimal for markup e.g. 0.15
      updateItem(item['Offer Item ID'], { 'Markup %': newMarkup });
  };

  return (
    <tr className={`border-b border-gray-100 hover:bg-slate-50 transition-colors group ${!isIncluded ? 'bg-slate-50 opacity-60 grayscale-[0.5]' : ''}`}>
      {/* Checkbox & Tools */}
      <td className="p-2 text-center align-middle border-r border-gray-100 bg-white group-hover:bg-slate-50">
        <div className="flex flex-col items-center gap-2">
            <input 
                type="checkbox" 
                checked={isIncluded} 
                onChange={(e) => toggleItemIncluded(item['Offer Item ID'], e.target.checked)}
                className="w-4 h-4 rounded text-av-blue focus:ring-av-blue border-gray-300 cursor-pointer" 
            />
            <button onClick={() => duplicateItem(item['Offer Item ID'])} className="text-slate-400 hover:text-av-blue transition-colors">
                <Copy className="w-3 h-3" />
            </button>
            <button onClick={() => deleteItem(item['Offer Item ID'])} className="text-slate-400 hover:text-red-500 transition-colors">
                <Trash2 className="w-3 h-3" />
            </button>
        </div>
      </td>

      {/* Purchase Details */}
      <td className="p-2 align-middle min-w-[140px]">
        <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Valid: {item['Price Validity']}</span>
            <div className="font-semibold text-sm text-slate-700">
                {item['Quantity Unit From']} {item.Unit} <span className="text-slate-300 mx-1">|</span> {purchPrice.toFixed(2)} {item['Purchase Currency']}
            </div>
        </div>
      </td>

      {/* Markup */}
      <td className="p-2 align-middle">
        <div className="relative">
            <input 
                type="number" 
                value={(markup * 100).toFixed(2)} 
                onChange={(e) => handleChange('Markup %', parseFloat(e.target.value) / 100)}
                className={`w-20 px-2 py-1 text-right text-xs border rounded focus:outline-none focus:border-av-blue ${(markup * 100) < 10 ? 'bg-red-50 border-red-200 text-red-700' : 'border-gray-200'}`}
            />
            {(markup * 100) < 10 && (
                <AlertTriangle className="w-3 h-3 text-red-500 absolute top-1.5 right-1" />
            )}
        </div>
      </td>

      {/* Currency */}
      <td className="p-2 align-middle">
        <select 
            value={item['Selling Currency']}
            onChange={(e) => handleChange('Selling Currency', e.target.value)}
            className="w-16 px-1 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:border-av-blue bg-white"
        >
            <option value="EUR">EUR</option>
            <option value="PLN">PLN</option>
            <option value="USD">USD</option>
        </select>
      </td>

      {/* Actual Qty */}
      <td className="p-2 align-middle">
        <input 
            type="number" 
            value={item['Actual Quantity']} 
            readOnly
            className="w-20 px-2 py-1 text-right text-xs bg-slate-50 border border-gray-200 rounded text-slate-500"
        />
      </td>

      {/* Ships */}
      <td className="p-2 align-middle">
        <input 
            type="number" 
            value={item['Number Ships']} 
            min={1}
            onChange={(e) => handleChange('Number Ships', parseFloat(e.target.value))}
            className="w-14 px-2 py-1 text-right text-xs border border-gray-200 rounded focus:outline-none focus:border-av-blue"
        />
      </td>

      {/* Inc Supp */}
      <td className="p-2 align-middle">
        <select 
            value={item['Incoterms Supplier']}
            onChange={(e) => handleChange('Incoterms Supplier', e.target.value)}
            className="w-24 px-1 py-1 text-[11px] border border-gray-200 rounded focus:outline-none focus:border-av-blue bg-white"
        >
            <option value="DAP">DAP</option>
            <option value="EXW Supplier">EXW Supplier</option>
            <option value="FCA">FCA</option>
        </select>
      </td>

      {/* Inc AV */}
      <td className="p-2 align-middle">
         <select 
            value={item['Incoterms A V']}
            onChange={(e) => handleChange('Incoterms A V', e.target.value)}
            className="w-24 px-1 py-1 text-[11px] border border-gray-200 rounded focus:outline-none focus:border-av-blue bg-white"
        >
            <option value="DAP">DAP</option>
            <option value="EXW A-V">EXW A-V</option>
            <option value="EXW Supplier">EXW Supplier</option>
        </select>
      </td>

      {/* Transport Leg 1 */}
      <td className="p-2 align-middle">
         <div className="flex flex-col items-end">
            <span className={`text-xs font-bold ${transportCalc.leg1Amount > 0 ? 'text-slate-700' : 'text-slate-300'}`}>
                {transportCalc.leg1Rate.eur.toFixed(2)}
            </span>
            <span className="text-[9px] text-slate-400">Fixed</span>
         </div>
      </td>

      {/* Transport Leg 2 */}
      <td className="p-2 align-middle">
         <div className="flex flex-col items-end">
            <span className={`text-xs font-bold ${transportCalc.leg2Amount > 0 ? 'text-slate-700' : 'text-slate-300'}`}>
                {transportCalc.leg2Rate.eur.toFixed(2)}
            </span>
            <span className="text-[9px] text-slate-400">Per Ship</span>
         </div>
      </td>

       {/* Total Transport */}
       <td className="p-2 align-middle">
         <div className="flex flex-col items-end">
            <span className="text-xs font-bold text-slate-600">
                {transportCalc.totalTrans.toFixed(2)}
            </span>
            <span className="text-[9px] text-slate-400">
                {(transportCalc.totalTrans / (item['Actual Quantity'] || 1)).toFixed(2)}/kg
            </span>
         </div>
      </td>

      {/* Price + Markup */}
      <td className="p-2 align-middle bg-slate-50">
         <div className="text-xs font-semibold text-slate-600 text-right px-2">
            {pricePlusMarkup.toFixed(2)}
         </div>
      </td>

      {/* FINAL PRICE */}
      <td className="p-2 align-middle bg-av-blue-light border-l-2 border-av-blue border-opacity-20">
         <input 
            type="number" 
            value={finalPrice.toFixed(2)} 
            onChange={(e) => handlePriceChange(parseFloat(e.target.value))}
            className="w-24 px-2 py-1 text-right text-sm font-bold text-av-blue bg-white border border-av-blue border-opacity-30 rounded focus:outline-none focus:ring-2 focus:ring-av-blue focus:ring-opacity-50"
         />
      </td>

      {/* Comment */}
      <td className="p-2 align-middle">
        <textarea 
            value={item.Comment}
            onChange={(e) => handleChange('Comment', e.target.value)}
            className="w-full h-8 min-h-[32px] px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:border-av-blue resize-y"
            placeholder="Notes..."
        />
      </td>
    </tr>
  );
};

export default TierRow;
