import { 
  ApiRequest, 
  BackendResponse, 
  UpdateItemFieldsRequest,
  OfferItem,
  SupplierRates,
  AppData,
  Config
} from '../types';

// The live API URL provided in the prompt
const API_URL = 'https://script.google.com/macros/s/AKfycbwZWiPKzURGd2Ns6t62OVRgK34gJzJ4qT0KfXUjITdvZkE6r-vGTsQFfUat2cfw4bCv/exec';

class BackendService {
  
  /**
   * Generic request handler for POST operations
   * Uses 'text/plain' content type to avoid complex CORS preflight issues with Google Apps Script
   */
  private async request<T>(payload: ApiRequest): Promise<BackendResponse<T>> {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        mode: 'cors', 
        credentials: 'omit', // Critical for GAS Web Apps
        redirect: 'follow',
        headers: {
          'Content-Type': 'text/plain', // Prevents OPTIONS preflight failures in some GAS deployments
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      
      const data: BackendResponse<T> = await response.json();
      return data;
    } catch (error) {
      console.error('API Request Failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network Error',
        data: null
      };
    }
  }

  // Load offer data (GET request with ID)
  async loadOfferData(offerId?: string): Promise<BackendResponse<AppData>> {
    try {
      const url = new URL(API_URL);
      if (offerId) {
        url.searchParams.append('id', offerId);
      }
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        redirect: 'follow'
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      
      const data: BackendResponse<AppData> = await response.json();
      return data;
    } catch (error) {
      console.error('Load Offer Failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to load offer data',
        data: null
      };
    }
  }

  async addProductToOffer(offerId: string, productId: string): Promise<BackendResponse<OfferItem[]>> {
    return this.request<OfferItem[]>({
        operation: 'add_product',
        offer_id: offerId,
        product_id: productId
    });
  }

  async updateItemFields(
    offerItemId: string, 
    fields: UpdateItemFieldsRequest['fields']
  ): Promise<BackendResponse<{ finalUnitPrice?: number; finalTotalPrice?: number }>> {
    return this.request({
      operation: 'update_item_fields',
      offer_item_id: offerItemId,
      fields
    });
  }

  async toggleItemIncluded(offerItemId: string, included: boolean): Promise<BackendResponse> {
    return this.request({
      operation: 'toggle_included',
      offer_item_id: offerItemId,
      included
    });
  }

  async duplicateItem(offerItemId: string, overrides: any): Promise<BackendResponse<{ id: string }>> {
    return this.request<{ id: string }>({
      operation: 'duplicate_offer_item',
      offer_item_id: offerItemId,
      overrides
    });
  }

  async deleteItem(offerItemId: string): Promise<BackendResponse> {
    return this.request({
      operation: 'delete_offer_item',
      offer_item_id: offerItemId
    });
  }

  async deleteItems(offerItemIds: string[]): Promise<BackendResponse<{ count: number }>> {
    return this.request({
      operation: 'delete_offer_items',
      offer_item_ids: offerItemIds
    });
  }

  async saveOffer(offerId: string): Promise<BackendResponse> {
    return this.request({
      operation: 'save_offer',
      offer_id: offerId
    });
  }

  async getTransportRates(): Promise<SupplierRates> {
    try {
      const url = new URL(API_URL);
      url.searchParams.append('action', 'getCRMData');
      
      const response = await fetch(url.toString(), { 
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        redirect: 'follow' 
      });

      if (!response.ok) throw new Error('Failed to fetch rates');
      
      const json = await response.json();
      return json.supplierRates || {};
    } catch (error) {
      console.error('Failed to get rates:', error);
      return {};
    }
  }

  async saveTransportRates(rates: SupplierRates): Promise<string> {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'saveSupplierRates',
          rates
        })
      });
      
      if (!response.ok) throw new Error('Network error');
      
      const json = await response.json();
      if (!json.success) throw new Error(json.message);

      return 'Saved';
    } catch (error) {
      console.error('Failed to save rates:', error);
      return error instanceof Error ? error.message : 'Save failed';
    }
  }

  async getConfig(): Promise<Config[]> {
    return [];
  }
}

export const backendService = new BackendService();