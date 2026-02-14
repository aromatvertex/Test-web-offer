import { Product, SupplierRates, Offer, ProductGroup } from '../types';

export const MOCK_OFFER: Offer = {
  'Offer ID': 'OFERTA/2024/Q4/MILLANO/001',
  'Subject': 'Q4 Supply Contract - Flavorings',
  'Contact Name': 'Jan Kowalski',
  'Assigned To': 'Marek Nowak (Pricing Analyst)',
  'Customer Name': 'Z.W.C. Millano Sp. z o.o.',
  'Valid Until': '2024-12-31',
  'Currency': 'EUR'
};

export const MOCK_PRODUCTS: Product[] = [
  { id: 'PRO3191', name: 'Vanillin Extra Pure', category: 'Commodity', vendorId: 'SUP001', supplierName: 'Th. Geyer' },
  { id: 'PRO8022', name: 'Cocoa Extract 20x', category: 'Premium', vendorId: 'SUP002', supplierName: 'Lallemand' },
  { id: 'PRO1055', name: 'Citrus Oil Type A', category: 'General', vendorId: 'SUP003', supplierName: 'Domestic' },
  { id: 'PRO9999', name: 'Strawberry Flavoring', category: 'General', vendorId: 'SUP001', supplierName: 'Th. Geyer' },
];

export const MOCK_RATES: SupplierRates = {
  'Th. Geyer': {
    validity: '2024-12-31',
    tiers: [
      { from: 0, to: 24.99, eur: 25 },
      { from: 25, to: 99.99, eur: 45 },
      { from: 100, to: 249.99, eur: 90 },
      { from: 250, to: 499.99, eur: 180 },
      { from: 500, to: 999999, eur: 300 }
    ]
  },
  'Lallemand': {
    validity: '2024-12-31',
    tiers: [
      { from: 0, to: 49.99, eur: 40 },
      { from: 50, to: 199.99, eur: 80 },
      { from: 200, to: 499.99, eur: 160 }
    ]
  },
  'Domestic': {
    validity: '2024-12-31',
    tiers: [
        { from: 0, to: 999999, eur: 30 }
    ]
  },
  'Aromat Vertex': { // For AV -> PL leg
      validity: '2024-12-31',
      tiers: [
        { from: 0, to: 24.99, eur: 20 },
        { from: 25, to: 99.99, eur: 35 },
        { from: 100, to: 249.99, eur: 75 },
        { from: 250, to: 499.99, eur: 150 },
        { from: 500, to: 999999, eur: 250 }
      ]
  }
};

// Initial state for demo
export const MOCK_ITEMS: ProductGroup[] = [
    {
        productId: 'PRO3191',
        productName: 'Vanillin Extra Pure',
        supplierName: 'Th. Geyer',
        category: 'Commodity',
        tiers: [
            {
                id: 'tier_1',
                qty: 25,
                unit: 'kg',
                actQty: 25,
                purchPrice: 29.70,
                purchCurrency: 'EUR',
                markup: 15,
                sellCurrency: 'EUR',
                ships: 1,
                incTermsSupp: 'DAP',
                incTermsAV: 'DAP',
                transportCost: 0,
                finalPrice: 35.50,
                comment: '',
                validity: '2024-12-31',
                included: true
            },
            {
                id: 'tier_2',
                qty: 100,
                unit: 'kg',
                actQty: 100,
                purchPrice: 28.50,
                purchCurrency: 'EUR',
                markup: 15,
                sellCurrency: 'EUR',
                ships: 1,
                incTermsSupp: 'DAP',
                incTermsAV: 'DAP',
                transportCost: 0,
                finalPrice: 34.00,
                comment: '',
                validity: '2024-12-31',
                included: true
            }
        ]
    }
];
