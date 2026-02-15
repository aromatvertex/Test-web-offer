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

/**
 * Generate automatic comment based on Incoterms logic
 */
export const generateAutoComment = (
  incotermSupplier: string,
  incotermAV: string,
  leg1Amount: number,
  leg2Amount: number,
  totalQty: number
): string => {
  const sup = (incotermSupplier || '').toUpperCase();
  const av = (incotermAV || '').toUpperCase();
  
  // Use a fallback quantity to avoid division by zero in rare cases, though amounts are total usually.
  // The requirements show just "amount", assuming total amount EUR.

  // Scenario 1: DAP -> EXW A-V
  if (sup === 'DAP' && av === 'EXW A-V') {
      // Logic dictates leg 2 is cost for customer to pick up? No, DAP means supplier delivers to AV. 
      // EXW A-V means customer picks up from AV.
      // Usually "A-V -> PL transport cost" implies we are informing customer of a cost they might incur 
      // OR we are explaining a cost included?
      // The prompt says: "A-V -> PL transport cost: {amount} EUR"
      // But in this scenario, transport is NOT added to price. So this comment is likely informational about the hidden/excluded cost?
      // Or maybe it refers to the AV->PL leg that IS calculated but not charged?
      // Let's blindly follow the prompt text requirement.
      // Wait, prompt says: DAP->EXW A-V: "A-V -> PL transport cost: {amount} EUR"
      // In this scenario, leg2 is AV->PL.
      // However, CalculateTransportCosts sets leg2Included = false.
      // So leg2Amount returned by that function is 0. 
      // We need the *potential* cost.
      // Thus we need to know the raw rate even if not included.
      // But `generateAutoComment` receives `leg2Amount` which is the *charged* amount.
      // We should probably rely on the logic in TierRow to pass the raw amount if needed, 
      // or change this signature. 
      // Actually, looking at prompt: "EXW/FCA -> EXW Supplier: 'Supplier -> A-V transport cost...'"
      // This usually implies showing costs that are NOT included in the final price, for transparency.
      return `A-V → PL transport cost: ??? EUR`; // Placeholder, logic needs raw rates.
  }

  return "";
};

/**
 * Refined auto comment generator that takes Raw Rates
 */
export const getAutoComment = (
    incotermSupplier: string,
    incotermAV: string,
    leg1Total: number, // Raw total cost for Leg 1
    leg2Total: number  // Raw total cost for Leg 2
): string => {
    const sup = (incotermSupplier || '').toUpperCase();
    const av = (incotermAV || '').toUpperCase();

    if (sup === 'DAP' && av === 'EXW A-V') {
        return `A-V → PL transport cost: ${leg2Total.toFixed(2)} EUR`;
    }
    
    if ((sup.includes('EXW') || sup.includes('FCA')) && av === 'EXW A-V') {
        return `A-V → PL transport cost: ${leg2Total.toFixed(2)} EUR`;
    }
    
    if ((sup.includes('EXW') || sup.includes('FCA')) && av === 'EXW SUPPLIER') {
        return `Supplier → A-V transport cost: ${leg1Total.toFixed(2)} EUR`;
    }

    return "";
}