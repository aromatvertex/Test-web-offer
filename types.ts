export interface Product {
  id: string;
  name: string;
  category: string;
  vendorId: string;
  supplierName: string;
}

export interface Offer {
  'Offer ID': string;
  'Subject'?: string;
  'Valid Until'?: string;
  'Contact Name'?: string;
  'Assigned To'?: string;
  'Customer Name'?: string;
  'Currency'?: string;
  'Created Time'?: string;
  'Modified Time'?: string;
}

export interface OfferItem {
  'Offer Item ID': string;
  'Offer ID': string;
  'Product ID': string;
  'Quantity Unit From': number;
  'Unit': string;
  'Actual Quantity': number;
  'Number Ships': number;
  'Purchase Currency': string;
  'Selling Currency': string;
  'Offered Price': string;
  'Purchase Price': string;
  'Included': boolean | string;
  'Markup %': number;
  'Incoterms Supplier': string;
  'Incoterms A V': string;
  'Transportation Cost Per Quantity': number;
  'Final Price On Offer': number;
  'Comment'?: string;
  'Price Validity'?: string;
  'Created By'?: string;
  'Created Time'?: string;
  'Modified By'?: string;
  'Modified Time'?: string;
}

export interface SupplierRateTier {
  from: number;
  to: number;
  eur: number;
  validity?: string;
}

export interface SupplierRates {
  [supplierName: string]: {
    validity: string;
    tiers: SupplierRateTier[];
  };
}

export interface TransportCost {
  'Supplier Transport Cost ID'?: string;
  'Supplier ID'?: string;
  'Supplier Name'?: string;
  'Transport Kg From': number;
  'Transport Kg To': number;
  'In EURO': number;
  'Currency'?: string;
  'Validity'?: string;
}

export interface ProductMarkup {
  'Product Category': string;
  'Minimum Markup': number;
  'Expected Markup'?: number;
}

export interface Config {
  'Config ID': string;
  'Value': string;
  'Description'?: string;
}

export interface AppData {
  transportCosts: TransportCost[];
  products: Product[];
  suppliers: any[];
  config: Config[];
  offer?: Offer;
  items?: OfferItem[];
}

// Backend API Response
export interface BackendResponse<T = any> {
  success: boolean;
  message: string;
  data: T | null;
}

// API Request Types
export type Operation = 
  | 'add_product'
  | 'update_item_fields'
  | 'toggle_included'
  | 'duplicate_offer_item'
  | 'delete_offer_item'
  | 'save_offer'
  | 'delete_offer_items';

export interface BaseRequest {
  operation: Operation;
}

export interface AddProductRequest extends BaseRequest {
  operation: 'add_product';
  offer_id: string;
  product_id: string;
}

export interface UpdateItemFieldsRequest extends BaseRequest {
  operation: 'update_item_fields';
  offer_item_id: string;
  fields: {
    markup?: number;
    selling_currency?: string;
    number_ships?: number;
    comment?: string;
    incoterm_supplier?: string;
    incoterm_av?: string;
    transport_cost?: number;
  };
}

export interface ToggleIncludedRequest extends BaseRequest {
  operation: 'toggle_included';
  offer_item_id: string;
  included: boolean;
}

export interface DuplicateItemRequest extends BaseRequest {
  operation: 'duplicate_offer_item';
  offer_item_id: string;
  overrides: Partial<OfferItem>;
}

export interface DeleteItemRequest extends BaseRequest {
  operation: 'delete_offer_item';
  offer_item_id: string;
}

export interface DeleteItemsRequest extends BaseRequest {
  operation: 'delete_offer_items';
  offer_item_ids: string[];
}

export interface SaveOfferRequest extends BaseRequest {
  operation: 'save_offer';
  offer_id: string;
}

export type ApiRequest = 
  | AddProductRequest
  | UpdateItemFieldsRequest
  | ToggleIncludedRequest
  | DuplicateItemRequest
  | DeleteItemRequest
  | DeleteItemsRequest
  | SaveOfferRequest;

// Mock Types
export interface MockTier {
  id: string;
  qty: number;
  unit: string;
  actQty: number;
  purchPrice: number;
  purchCurrency: string;
  markup: number;
  sellCurrency: string;
  ships: number;
  incTermsSupp: string;
  incTermsAV: string;
  transportCost: number;
  finalPrice: number;
  comment: string;
  validity: string;
  included: boolean;
}

export interface ProductGroup {
  productId: string;
  productName: string;
  supplierName: string;
  category: string;
  tiers: MockTier[];
}
