export interface DIDDocument {
  '@context': string | string[];
  id: string;
  verificationMethod?: VerificationMethod[];
  authentication?: (string | VerificationMethod)[];
  assertionMethod?: (string | VerificationMethod)[];
  keyAgreement?: (string | VerificationMethod)[];
  service?: Service[];
  alsoKnownAs?: string[];
  controller?: string | string[];
}

export interface VerificationMethod {
  id: string;
  type: string;
  controller: string;
  publicKeyJwk?: PublicKeyJwk;
  publicKeyMultibase?: string;
  publicKeyBase58?: string;
}

export interface PublicKeyJwk {
  kty: string;
  crv: string;
  x: string;
  y?: string;
  d?: string;
  use?: string;
  key_ops?: string[];
  alg?: string;
  kid?: string;
}

export interface Service {
  id: string;
  type: string;
  serviceEndpoint: string | ServiceEndpoint;
  [key: string]: any;
}

export interface ServiceEndpoint {
  uri: string;
  [key: string]: any;
}

export interface DID {
  id: string;
  did: string;
  created_at: string;
  updated_at: string;
}

export interface DIDDocumentRecord {
  id: string;
  did_id: string;
  document: DIDDocument;
  created_at: string;
  updated_at: string;
}

export type KeyUsage = 'authentication' | 'assertionMethod' | 'keyAgreement';

export interface PrivateKeyRecord {
  id: string;
  did_id: string;
  key_type: 'ed25519' | 'x25519';
  name: string;
  key_usage: KeyUsage;
  active: boolean;
  encrypted_private_key: string;
  public_key: string;
  key_derivation_path: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDIDRequest {
  did: string;
  document: DIDDocument;
}

export interface UpdateDIDRequest {
  document: DIDDocument;
}

export interface AddKeyRequest {
  name: string;
  key_type: 'ed25519' | 'x25519';
  key_usage: KeyUsage;
  active?: boolean;
}

export interface UpdateKeyActiveRequest {
  active: boolean;
}

export interface DIDResponse {
  did: DID;
  document: DIDDocumentRecord;
  keys: PrivateKeyRecord[];
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: {
    dids: T[];
    total: number;
    page: number;
    limit: number;
  };
  message?: string;
}

export interface PrivateKeyResponse {
  success: boolean;
  data: {
    did: string;
    keyType: 'ed25519' | 'x25519';
    privateKey: number[];
  };
  message?: string;
}
