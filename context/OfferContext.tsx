import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { backendService } from '../services/backendService';
import { 
  Offer, 
  OfferItem, 
  Product, 
  SupplierRates, 
  Config
} from '../types';
import { TRANSLATIONS, Language } from '../utils/translations';

interface OfferContextType {
  // Data
  offer: Offer | null;
  items: OfferItem[];
  products: Product[];
  suppliers: any[];
  config: Config[];
  supplierRates: SupplierRates;
  
  // UI State
  loading: boolean;
  saving: boolean;
  error: string | null;
  language: Language;
  t: typeof TRANSLATIONS['PL'];
  
  // Actions
  setLanguage: (lang: Language) => void;
  loadOffer: (offerId?: string) => Promise<void>;
  addProduct: (productId: string) => Promise<void>;
  updateItem: (itemId: string, fields: Partial<OfferItem>) => Promise<void>;
  toggleItemIncluded: (itemId: string, included: boolean) => Promise<void>;
  duplicateItem: (itemId: string, overrides?: Partial<OfferItem>) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
  deleteItems: (itemIds: string[]) => Promise<void>;
  saveOffer: () => Promise<void>;
  
  // Transport rates
  loadTransportRates: () => Promise<void>;
  saveTransportRates: (rates: SupplierRates) => Promise<void>;
  
  // Helpers
  getProductById: (productId: string) => Product | undefined;
  getItemsByProduct: (productId: string) => OfferItem[];
  getFilterDate: () => string | undefined;
}

const OfferContext = createContext<OfferContextType | undefined>(undefined);

export const useOffer = () => {
  const context = useContext(OfferContext);
  if (!context) {
    throw new Error('useOffer must be used within OfferProvider');
  }
  return context;
};

interface OfferProviderProps {
  children: ReactNode;
  initialOfferId?: string;
}

export const OfferProvider: React.FC<OfferProviderProps> = ({ 
  children, 
  initialOfferId 
}) => {
  const [offer, setOffer] = useState<Offer | null>(null);
  const [items, setItems] = useState<OfferItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [config, setConfig] = useState<Config[]>([]);
  const [supplierRates, setSupplierRates] = useState<SupplierRates>({});
  
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>('PL');
  
  // Keep track of mounted state to avoid setting state on unmounted component
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // Helper: Get product by ID
  const getProductById = useCallback((productId: string): Product | undefined => {
    return products.find(p => p.id === productId);
  }, [products]);

  // Helper: Get items by product ID
  const getItemsByProduct = useCallback((productId: string): OfferItem[] => {
    return items.filter(item => item['Product ID'] === productId);
  }, [items]);

  // Helper: Get filter date from config
  const getFilterDate = useCallback((): string | undefined => {
    const validConfig = config.find(c => c['Config ID'] === 'Buying Price Validity');
    return validConfig?.Value?.substring(0, 10);
  }, [config]);

  // Load offer data
  const loadOffer = useCallback(async (offerId?: string) => {
    if (!isMounted.current) return;
    setLoading(true);
    setError(null);
    
    try {
      const result = await backendService.loadOfferData(offerId);
      
      if (isMounted.current) {
        if (result.success && result.data) {
            const data = result.data;
            setOffer(data.offer || null);
            setItems(data.items || []);
            setProducts(data.products || []);
            setSuppliers(data.suppliers || []);
            setConfig(data.config || []);
        } else {
            setError(result.message);
        }
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to load offer');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  // Load transport rates
  const loadTransportRates = useCallback(async () => {
    try {
      const rates = await backendService.getTransportRates();
      if (isMounted.current) {
        setSupplierRates(rates);
      }
    } catch (err) {
      console.error('Failed to load transport rates:', err);
    }
  }, []);

  // Add product to offer
  const addProduct = async (productId: string) => {
    if (!offer) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const result = await backendService.addProductToOffer(
        offer['Offer ID'],
        productId
      );
      
      if (result.success && result.data) {
        setItems(prev => [...prev, ...result.data!]);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add product');
    } finally {
      setSaving(false);
    }
  };

  // Update item fields
  const updateItem = async (itemId: string, fields: Partial<OfferItem>) => {
    setSaving(true);
    
    try {
      // Optimistic update
      setItems(prev => 
        prev.map(item => 
          item['Offer Item ID'] === itemId 
            ? { ...item, ...fields }
            : item
        )
      );

      // Prepare fields for backend
      const backendFields: any = {};
      
      if (fields['Markup %'] !== undefined) {
        backendFields.markup = fields['Markup %'];
      }
      if (fields['Selling Currency'] !== undefined) {
        backendFields.selling_currency = fields['Selling Currency'];
      }
      if (fields['Number Ships'] !== undefined) {
        backendFields.number_ships = fields['Number Ships'];
      }
      if (fields['Comment'] !== undefined) {
        backendFields.comment = fields['Comment'];
      }
      if (fields['Incoterms Supplier'] !== undefined) {
        backendFields.incoterm_supplier = fields['Incoterms Supplier'];
      }
      if (fields['Incoterms A V'] !== undefined) {
        backendFields.incoterm_av = fields['Incoterms A V'];
      }
      if (fields['Transportation Cost Per Quantity'] !== undefined) {
        backendFields.transport_cost = fields['Transportation Cost Per Quantity'];
      }

      const result = await backendService.updateItemFields(itemId, backendFields);
      
      if (!result.success) {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item');
    } finally {
      setSaving(false);
    }
  };

  // Toggle item included status
  const toggleItemIncluded = async (itemId: string, included: boolean) => {
    setSaving(true);
    
    try {
      setItems(prev => 
        prev.map(item => 
          item['Offer Item ID'] === itemId 
            ? { ...item, Included: included }
            : item
        )
      );

      const result = await backendService.toggleItemIncluded(itemId, included);
      
      if (!result.success) {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle item');
    } finally {
      setSaving(false);
    }
  };

  // Duplicate item
  const duplicateItem = async (itemId: string, overrides?: Partial<OfferItem>) => {
    setSaving(true);
    
    try {
      const result = await backendService.duplicateItem(itemId, overrides || {});
      
      if (result.success && result.data && result.data.id) {
        await loadOffer(offer?.['Offer ID']);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate item');
    } finally {
      setSaving(false);
    }
  };

  // Delete single item
  const deleteItem = async (itemId: string) => {
    setSaving(true);
    
    try {
      setItems(prev => prev.filter(item => item['Offer Item ID'] !== itemId));
      const result = await backendService.deleteItem(itemId);
      if (!result.success) {
        setError(result.message);
        await loadOffer(offer?.['Offer ID']);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
    } finally {
      setSaving(false);
    }
  };

  // Delete multiple items
  const deleteItems = async (itemIds: string[]) => {
    if (itemIds.length === 0) return;
    setSaving(true);
    try {
      setItems(prev => prev.filter(item => !itemIds.includes(item['Offer Item ID'])));
      const result = await backendService.deleteItems(itemIds);
      if (!result.success) {
        setError(result.message);
        await loadOffer(offer?.['Offer ID']);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete items');
    } finally {
      setSaving(false);
    }
  };

  // Save offer
  const saveOffer = async () => {
    if (!offer) return;
    setSaving(true);
    setError(null);
    try {
      const result = await backendService.saveOffer(offer['Offer ID']);
      if (!result.success) {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save offer');
    } finally {
      setSaving(false);
    }
  };

  // Save transport rates
  const saveTransportRates = async (rates: SupplierRates) => {
    setSaving(true);
    try {
      const result = await backendService.saveTransportRates(rates);
      if (result !== 'Saved') {
        setError(result);
      } else {
        setSupplierRates(rates);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save transport rates');
    } finally {
      setSaving(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (initialOfferId) {
        loadOffer(initialOfferId);
    } else {
        loadOffer();
    }
    loadTransportRates();
  }, [initialOfferId, loadOffer, loadTransportRates]);

  const value: OfferContextType = {
    offer, items, products, suppliers, config, supplierRates,
    loading, saving, error,
    language, setLanguage, t: TRANSLATIONS[language],
    loadOffer, addProduct, updateItem, toggleItemIncluded, duplicateItem, deleteItem, deleteItems, saveOffer,
    loadTransportRates, saveTransportRates,
    getProductById, getItemsByProduct, getFilterDate
  };

  return (
    <OfferContext.Provider value={value}>
      {children}
    </OfferContext.Provider>
  );
};