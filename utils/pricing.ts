import { SupplierRates, OfferItem } from '../types';

export interface RateResult {
  eur: number;
  estimated: boolean;
}

/**
 * Get transport rate based on weight and supplier rates
 */
export const getTransportRate = (
  weight: number, 
  supplierName: string, 
  supplierRates: SupplierRates
): RateResult => {
  if (weight <= 0) return { eur: 0, estimated: false };

  // Default fallback rates if supplier not found
  const defaultRates = {
    validity: '',
    tiers: [
      { from: 0, to: 24.99, eur: 20 },
      { from: 25, to: 99.99, eur: 35 },
      { from: 100, to: 249.99, eur: 75 },
      { from: 250, to: 499.99, eur: 150 },
      { from: 500, to: 9999999, eur: 250 }
    ]
  };

  const supplierData = supplierRates[supplierName] || defaultRates;
  const tiers = [...(supplierData.tiers || [])].sort((a, b) => a.from - b.from);

  if (tiers.length === 0) return { eur: 0, estimated: true };

  // Find exact range match
  for (const tier of tiers) {
    if (weight >= tier.from && weight <= tier.to) {
      return { eur: tier.eur, estimated: false };
    }
  }

  // Handle out of bounds
  if (weight < tiers[0].from) {
    return { eur: tiers[0].eur, estimated: true };
  }
  return { eur: tiers[tiers.length - 1].eur, estimated: true };
};

/**
 * Calculate final price based on Incoterms rules
 */
export const calculateFinalPrice = (
  basePrice: number,
  markupPercent: number,
  transportCostPerUnit: number,
  incotermSupplier: string,
  incotermAV: string
): number => {
  // Base price with markup
  const baseWithMarkup = basePrice * (1 + markupPercent / 100);

  // Normalize inputs
  const sup = (incotermSupplier || '').toUpperCase();
  const av = (incotermAV || '').toUpperCase();

  // Logic Table:
  // 1. DAP -> EXW A-V: No Transport charged to customer
  if (sup === 'DAP' && av === 'EXW A-V') return baseWithMarkup;

  // 2. DAP -> DAP: AV->PL Transport charged
  if (sup === 'DAP' && av === 'DAP') return baseWithMarkup + transportCostPerUnit;

  // 3. EXW/FCA -> DAP: Both legs charged
  if ((sup.includes('EXW') || sup.includes('FCA')) && av === 'DAP') return baseWithMarkup + transportCostPerUnit;

  // 4. EXW/FCA -> EXW A-V: Supplier->AV leg charged
  if ((sup.includes('EXW') || sup.includes('FCA')) && av === 'EXW A-V') return baseWithMarkup + transportCostPerUnit;

  // 5. EXW/FCA -> EXW SUPPLIER: No transport charged (customer picks up from supplier)
  if ((sup.includes('EXW') || sup.includes('FCA')) && av === 'EXW SUPPLIER') return baseWithMarkup;

  // Default fallback
  return baseWithMarkup + transportCostPerUnit;
};

/**
 * Calculate tier transport costs
 */
export const calculateTransportCosts = (
  item: OfferItem,
  supplierName: string,
  supplierRates: SupplierRates
): {
  leg1Amount: number;
  leg2Amount: number;
  totalTrans: number;
  leg1Rate: RateResult;
  leg2Rate: RateResult;
} => {
  const totalQuantity = item['Actual Quantity'] || item['Quantity Unit From'] || 0;
  const numberOfShips = item['Number Ships'] || 1;
  const weightPerShip = numberOfShips > 0 ? totalQuantity / numberOfShips : 0;

  // Leg 1: Supplier -> AV (Using Supplier's Rate)
  const leg1Rate = getTransportRate(totalQuantity, supplierName, supplierRates);
  
  // Leg 2: AV -> Customer (Using Aromat Vertex Rate)
  const leg2Rate = getTransportRate(weightPerShip, 'Aromat Vertex', supplierRates);

  // Determine inclusion based on Incoterms
  const sup = (item['Incoterms Supplier'] || '').toUpperCase();
  const av = (item['Incoterms A V'] || '').toUpperCase();

  let leg1Included = false;
  let leg2Included = false;

  // Scenario 1: DAP / EXW A-V
  if (sup === 'DAP' && av === 'EXW A-V') {
    leg1Included = false; 
    leg2Included = false;
  } 
  // Scenario 2: DAP / DAP
  else if (sup === 'DAP' && av === 'DAP') {
    leg1Included = false; 
    leg2Included = true;
  }
  // Scenario 3: EXW or FCA / DAP
  else if ((sup.includes('EXW') || sup.includes('FCA')) && av === 'DAP') {
    leg1Included = true;
    leg2Included = true;
  }
  // Scenario 4: EXW or FCA / EXW A-V
  else if ((sup.includes('EXW') || sup.includes('FCA')) && av === 'EXW A-V') {
    leg1Included = true;
    leg2Included = false;
  }
  // Scenario 5: EXW or FCA / EXW SUPPLIER
  else if ((sup.includes('EXW') || sup.includes('FCA')) && av === 'EXW SUPPLIER') {
    leg1Included = false;
    leg2Included = false;
  }

  // Calculate Totals
  // Leg 1 is usually one-off or per shipment? Assuming per shipment logic applies generally, 
  // but if Leg 1 is bulk to AV, it might be total. 
  // Logic: "Fixed" usually implies total for the whole quantity if it comes in one go, 
  // but if we ship to customer in 4 parts, we might bring it from supplier in 1 part or 4 parts.
  // Standard logic: Leg 1 follows total qty logic usually if we stock it, but here it's likely per shipment too.
  // Let's assume standard behavior: Rate * Ships.
  
  const leg1Amount = leg1Included ? (leg1Rate.eur * numberOfShips) : 0;
  const leg2Amount = leg2Included ? (leg2Rate.eur * numberOfShips) : 0;
  
  const totalTrans = leg1Amount + leg2Amount;

  return {
    leg1Amount,
    leg2Amount,
    totalTrans,
    leg1Rate,
    leg2Rate
  };
};