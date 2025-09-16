import axios, { AxiosInstance, AxiosResponse } from 'axios';
import dotenv from 'dotenv';
import {
  ApiResponse,
  DID,
  CreateDIDRequest,
  UpdateDIDRequest,
  SignMessageRequest,
  SignMessageResponse,
  VerifySignatureRequest,
  VerifySignatureResponse,
  KeyAgreementRequest,
  KeyAgreementResponse
} from '../types/api';

dotenv.config();

export class DIDAPIClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || process.env.API_BASE_URL || 'http://localhost:3000/api/v1';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Interceptor para logging de requests
    this.client.interceptors.request.use(
      (config) => {
        console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ Request error:', error.message);
        return Promise.reject(error);
      }
    );

    // Interceptor para logging de responses
    this.client.interceptors.response.use(
      (response) => {
        console.log(`✅ ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error(`❌ ${error.response?.status || 'Network Error'} ${error.config?.url}`);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Verifica la salud de la API
   */
  async healthCheck(): Promise<ApiResponse> {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Crea un nuevo DID
   */
  async createDID(request: CreateDIDRequest): Promise<ApiResponse<DID>> {
    try {
      const response = await this.client.post('/dids', request);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Obtiene un DID por su identificador
   */
  async getDID(did: string): Promise<ApiResponse<DID>> {
    try {
      const response = await this.client.get(`/dids/${encodeURIComponent(did)}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Obtiene el documento DID
   */
  async getDIDDocument(did: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.get(`/dids/${encodeURIComponent(did)}/document`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Actualiza un DID
   */
  async updateDID(did: string, request: UpdateDIDRequest): Promise<ApiResponse<DID>> {
    try {
      const response = await this.client.put(`/dids/${encodeURIComponent(did)}`, request);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Elimina un DID
   */
  async deleteDID(did: string): Promise<ApiResponse> {
    try {
      const response = await this.client.delete(`/dids/${encodeURIComponent(did)}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Lista todos los DIDs
   */
  async listDIDs(): Promise<ApiResponse<DID[]>> {
    try {
      const response = await this.client.get('/dids');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Firma un mensaje usando assertionMethod
   */
  async signMessage(did: string, request: SignMessageRequest): Promise<ApiResponse<SignMessageResponse>> {
    try {
      const response = await this.client.post(`/dids/${encodeURIComponent(did)}/sign`, request);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Verifica una firma
   */
  async verifySignature(did: string, request: VerifySignatureRequest): Promise<ApiResponse<VerifySignatureResponse>> {
    try {
      const response = await this.client.post(`/dids/${encodeURIComponent(did)}/verify`, request);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Genera una clave compartida usando keyAgreement
   */
  async generateSharedSecret(did: string, request: KeyAgreementRequest): Promise<ApiResponse<KeyAgreementResponse>> {
    try {
      const response = await this.client.post(`/dids/${encodeURIComponent(did)}/key-agreement`, request);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Crea un DID de ejemplo con todas las claves
   */
  async createExampleDID(username: string): Promise<ApiResponse<DID>> {
    const did = `did:web:user/${username}`;
    
    const request: CreateDIDRequest = {
      did,
      keys: [
        { name: 'auth-key', keyType: 'ed25519', keyUsage: 'authentication' },
        { name: 'assertion-key', keyType: 'ed25519', keyUsage: 'assertionMethod' },
        { name: 'key-agreement-1', keyType: 'x25519', keyUsage: 'keyAgreement' },
        { name: 'key-agreement-2', keyType: 'x25519', keyUsage: 'keyAgreement' },
        { name: 'key-agreement-3', keyType: 'x25519', keyUsage: 'keyAgreement' }
      ]
    };

    return this.createDID(request);
  }

  /**
   * Ejecuta una prueba de firma digital
   */
  async testDigitalSignature(did: string, message: string = 'Hello, DID World!'): Promise<{
    success: boolean;
    message: string;
    signature: string;
    publicKey: string;
    verification: boolean;
  }> {
    try {
      // Firmar mensaje
      const signResponse = await this.signMessage(did, { message });
      
      if (!signResponse.success || !signResponse.data) {
        throw new Error('Failed to sign message');
      }

      // Verificar firma
      const verifyResponse = await this.verifySignature(did, {
        message,
        signature: signResponse.data.signature
      });

      if (!verifyResponse.success || !verifyResponse.data) {
        throw new Error('Failed to verify signature');
      }

      return {
        success: true,
        message,
        signature: signResponse.data.signature,
        publicKey: signResponse.data.publicKey,
        verification: verifyResponse.data.valid
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        signature: '',
        publicKey: '',
        verification: false
      };
    }
  }

  /**
   * Ejecuta una prueba de key agreement (Diffie-Hellman)
   */
  async testKeyAgreement(did1: string, did2: string): Promise<{
    success: boolean;
    sharedSecret1: string;
    sharedSecret2: string;
    secretsMatch: boolean;
  }> {
    try {
      // Obtener claves públicas de ambos DIDs
      const did1Data = await this.getDID(did1);
      const did2Data = await this.getDID(did2);

      if (!did1Data.success || !did1Data.data || !did2Data.success || !did2Data.data) {
        throw new Error('Failed to get DID data');
      }

      const did1Key = did1Data.data.keys?.find(k => k.keyUsage === 'keyAgreement' && k.active);
      const did2Key = did2Data.data.keys?.find(k => k.keyUsage === 'keyAgreement' && k.active);

      if (!did1Key || !did2Key) {
        throw new Error('Key agreement keys not found');
      }

      // Generar claves compartidas
      const secret1Response = await this.generateSharedSecret(did1, {
        otherPublicKey: did2Key.publicKey,
        keyName: did1Key.name
      });

      const secret2Response = await this.generateSharedSecret(did2, {
        otherPublicKey: did1Key.publicKey,
        keyName: did2Key.name
      });

      if (!secret1Response.success || !secret1Response.data || !secret2Response.success || !secret2Response.data) {
        throw new Error('Failed to generate shared secrets');
      }

      const secretsMatch = secret1Response.data.sharedSecret === secret2Response.data.sharedSecret;

      return {
        success: true,
        sharedSecret1: secret1Response.data.sharedSecret,
        sharedSecret2: secret2Response.data.sharedSecret,
        secretsMatch
      };
    } catch (error) {
      return {
        success: false,
        sharedSecret1: '',
        sharedSecret2: '',
        secretsMatch: false
      };
    }
  }

  /**
   * Maneja errores de la API
   */
  private handleError(error: any): Error {
    if (error.response) {
      // Error de respuesta de la API
      const message = error.response.data?.error || error.response.data?.message || 'API Error';
      const status = error.response.status;
      return new Error(`${status}: ${message}`);
    } else if (error.request) {
      // Error de red
      return new Error('Network Error: Unable to connect to API');
    } else {
      // Otros errores
      return new Error(error.message || 'Unknown Error');
    }
  }
}
