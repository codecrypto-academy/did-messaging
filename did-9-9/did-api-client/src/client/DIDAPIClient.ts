import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  CreateDIDRequest,
  UpdateDIDRequest,
  DIDResponse,
  APIResponse,
  PaginatedResponse,
  PrivateKeyResponse,
  AddKeyRequest,
  UpdateKeyActiveRequest
} from '../types/api';

export class DIDAPIClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string = 'http://localhost:3000/api/v1') {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ Request error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        console.log(`✅ ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error(`❌ ${error.response?.status || 'Network Error'} ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<APIResponse> {
    try {
      const response: AxiosResponse<APIResponse> = await this.client.get('/health');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create a new DID
   */
  async createDID(request: CreateDIDRequest): Promise<APIResponse<DIDResponse>> {
    try {
      const response: AxiosResponse<APIResponse<DIDResponse>> = await this.client.post('/dids', request);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a DID by identifier
   */
  async getDID(did: string): Promise<APIResponse<DIDResponse>> {
    try {
      const response: AxiosResponse<APIResponse<DIDResponse>> = await this.client.get(`/dids/${encodeURIComponent(did)}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get all DIDs with pagination
   */
  async getAllDIDs(page: number = 1, limit: number = 10): Promise<PaginatedResponse<DIDResponse>> {
    try {
      const response: AxiosResponse<PaginatedResponse<DIDResponse>> = await this.client.get('/dids', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update a DID document
   */
  async updateDID(did: string, request: UpdateDIDRequest): Promise<APIResponse<DIDResponse>> {
    try {
      const response: AxiosResponse<APIResponse<DIDResponse>> = await this.client.put(
        `/dids/${encodeURIComponent(did)}`,
        request
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete a DID
   */
  async deleteDID(did: string): Promise<APIResponse> {
    try {
      const response: AxiosResponse<APIResponse> = await this.client.delete(`/dids/${encodeURIComponent(did)}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get private key for a DID
   */
  async getPrivateKey(did: string, keyType: 'ed25519' | 'x25519'): Promise<PrivateKeyResponse> {
    try {
      const response: AxiosResponse<PrivateKeyResponse> = await this.client.get(
        `/dids/${encodeURIComponent(did)}/keys/${keyType}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors
   */
  private handleError(error: any): Error {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      const message = data?.message || data?.error || `HTTP ${status} Error`;
      const apiError = new Error(message);
      (apiError as any).status = status;
      (apiError as any).data = data;
      return apiError;
    } else if (error.request) {
      // Request was made but no response received
      return new Error('Network Error: No response from server');
    } else {
      // Something else happened
      return new Error(`Request Error: ${error.message}`);
    }
  }

  /**
   * Set base URL
   */
  setBaseURL(baseURL: string): void {
    this.baseURL = baseURL;
    this.client.defaults.baseURL = baseURL;
  }

  /**
   * Add a new key to an existing DID
   */
  async addKey(did: string, keyRequest: AddKeyRequest): Promise<APIResponse<DIDResponse>> {
    try {
      console.log(`🚀 POST /dids/${encodeURIComponent(did)}/keys`);
      const response: AxiosResponse<APIResponse<DIDResponse>> = await this.client.post(
        `/dids/${encodeURIComponent(did)}/keys`,
        keyRequest
      );
      console.log(`✅ ${response.status} POST /dids/${encodeURIComponent(did)}/keys`);
      return response.data;
    } catch (error: any) {
      console.log(`❌ ${error.response?.status || 'ERROR'} POST /dids/${encodeURIComponent(did)}/keys`);
      throw error;
    }
  }

  /**
   * Update the active status of a key
   */
  async updateKeyActive(did: string, keyId: string, activeRequest: UpdateKeyActiveRequest): Promise<APIResponse<DIDResponse>> {
    try {
      console.log(`🚀 PUT /dids/${encodeURIComponent(did)}/keys/${keyId}/active`);
      const response: AxiosResponse<APIResponse<DIDResponse>> = await this.client.put(
        `/dids/${encodeURIComponent(did)}/keys/${keyId}/active`,
        activeRequest
      );
      console.log(`✅ ${response.status} PUT /dids/${encodeURIComponent(did)}/keys/${keyId}/active`);
      return response.data;
    } catch (error: any) {
      console.log(`❌ ${error.response?.status || 'ERROR'} PUT /dids/${encodeURIComponent(did)}/keys/${keyId}/active`);
      throw error;
    }
  }

  /**
   * Get current base URL
   */
  getBaseURL(): string {
    return this.baseURL;
  }
}
