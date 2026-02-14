import { 
  ApiRequest, 
  BackendResponse, 
  UpdateItemFieldsRequest,
  OfferItem,
  SupplierRates,
  AppData,
  Config
} from '../types';

// The live API URL provided
const API_URL = 'https://script.google.com/macros/s/AKfycbwUBSR4u7TmbJFjfTq0bgt3XLBGUV3HEiwJyXHE498XnV91lQlUmu0Lg_L8O4q0z8TGYQ/exec';

class BackendService {
  
  /**
   * Helper to handle fetch errors specifically for Google Apps Script CORS issues
   * Includes retry logic for transient network errors
   */
  private async handleFetch(url: string, options: RequestInit, retries = 2): Promise<Response> {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }
      return response;
    } catch (error: any) {
      // If we have retries left and it's a fetch error, wait and retry
      if (retries > 0 && (error instanceof TypeError && error.message === 'Failed to fetch')) {
        console.log(`Fetch failed, retrying... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 1500)); // Wait 1.5s
        return this.handleFetch(url, options, retries - 1);
      }

      // Check for TypeError which usually indicates CORS/Network failure in fetch
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.warn("Network/CORS Error detected. This usually means the Google Script is not accessible.");
        throw new Error(
          'CORS/Network Error: Unable to access API. \n\n' +
          'POSSIBLE CAUSES:\n' +
          '1. Google Apps Script Permissions: Ensure "Who has access" is set to "Anyone" (Anonymous).\n' +
          '2. Spreadsheet ID: Ensure the SPREADSHEET_ID in Code.gs is correct.\n' +
          '3. Ad Blockers: Disable blockers that might stop script.google.com requests.'
        );
      }
      throw error;
    }
  }

  /**
   * Generic request handler for POST operations
   */
  private async request<T>(payload: ApiRequest): Promise<BackendResponse<T>> {
    try {
      const response = await this.handleFetch(API_URL, {
        method: 'POST',
        mode: 'cors', 
        credentials: 'omit',
        redirect: 'follow',
        headers: {
          'Content-Type': 'text/plain', // Prevents preflight OPTIONS request
        },
        body: JSON.stringify(payload)
      });

      const data: BackendResponse<T> = await response.json();
      return data;
    } catch (error) {
      console.error('API POST Failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown Network Error',
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
      // Add cache buster to prevent stale CORS headers from browser cache
      url.searchParams.append('_cb', Date.now().toString());
      
      const response = await this.handleFetch(url.toString(), {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        redirect: 'follow'
      });

      const data: BackendResponse<AppData> = await response.json();
      return data;
    } catch (error) {
      console.error('Load Offer Failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to connect to backend',
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
      // Add cache buster
      url.searchParams.append('_cb', Date.now().toString());
      
      const response = await this.handleFetch(url.toString(), { 
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        redirect: 'follow' 
      });

      const json = await response.json();
      return json.supplierRates || {};
    } catch (error) {
      console.warn('Get Rates Warning:', error);
      // Return empty object instead of throwing to prevent UI crash
      return {};
    }
  }

  async saveTransportRates(rates: SupplierRates): Promise<string> {
    try {
      const response = await this.handleFetch(API_URL, {
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
      
      const json = await response.json();
      if (!json.success) throw new Error(json.message);

      return 'Saved';
    } catch (error) {
      console.error('Save Rates Failed:', error);
      return error instanceof Error ? error.message : 'Save failed';
    }
  }

  async getConfig(): Promise<Config[]> {
    return [];
  }
}

export const backendService = new BackendService();