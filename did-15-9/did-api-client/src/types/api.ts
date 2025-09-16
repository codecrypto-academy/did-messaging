export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
  details?: string[];
}

export interface DID {
  id: string;
  did: string;
  created_at: string;
  updated_at: string;
  document?: DIDDocument;
  keys?: KeyInfo[];
}

export interface DIDDocument {
  id: string;
  '@context': string[];
  controller: string;
  alsoKnownAs?: string[];
  service?: Service[];
  authentication: string[];
  assertionMethod: string[];
  keyAgreement: string[];
  verificationMethod: VerificationMethod[];
}

export interface Service {
  id: string;
  type: string;
  serviceEndpoint: string;
}

export interface VerificationMethod {
  id: string;
  type: string;
  controller: string;
  publicKeyMultibase: string;
}

export interface KeyInfo {
  id: string;
  name: string;
  keyType: 'ed25519' | 'x25519';
  keyUsage: 'authentication' | 'assertionMethod' | 'keyAgreement';
  active: boolean;
  publicKey: string;
  derivationPath: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDIDRequest {
  did: string;
  document?: DIDDocument;
  keys?: KeyTemplate[];
}

export interface KeyTemplate {
  name: string;
  keyType: 'ed25519' | 'x25519';
  keyUsage: 'authentication' | 'assertionMethod' | 'keyAgreement';
  active?: boolean;
}

export interface UpdateDIDRequest {
  document?: DIDDocument;
  keys?: KeyTemplate[];
}

export interface SignMessageRequest {
  message: string;
  keyName?: string;
}

export interface SignMessageResponse {
  message: string;
  signature: string;
  publicKey: string;
  keyName: string;
}

export interface VerifySignatureRequest {
  message: string;
  signature: string;
  keyName?: string;
}

export interface VerifySignatureResponse {
  message: string;
  signature: string;
  publicKey: string;
  valid: boolean;
}

export interface KeyAgreementRequest {
  otherPublicKey: string;
  keyName?: string;
}

export interface KeyAgreementResponse {
  sharedSecret: string;
  ourPublicKey: string;
  otherPublicKey: string;
  keyName: string;
}

export interface TestResult {
  testName: string;
  success: boolean;
  message: string;
  duration: number;
  data?: any;
}

export interface TestSuite {
  name: string;
  results: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  duration: number;
}
