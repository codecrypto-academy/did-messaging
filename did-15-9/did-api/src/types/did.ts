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

export interface KeyPair {
  name: string;
  keyType: 'ed25519' | 'x25519';
  keyUsage: 'authentication' | 'assertionMethod' | 'keyAgreement';
  active: boolean;
  privateKey: Uint8Array;
  publicKey: Uint8Array;
  derivationPath: string;
}

export interface EncryptedKeyPair {
  name: string;
  keyType: 'ed25519' | 'x25519';
  keyUsage: 'authentication' | 'assertionMethod' | 'keyAgreement';
  active: boolean;
  encryptedPrivateKey: string;
  publicKey: string;
  derivationPath: string;
}

export interface DID {
  id: string;
  did: string;
  mnemonic: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  from_did: string;
  to_did: string;
  encrypted_message: string;
  sender_public_key: string;
  sender_key_id: string;
  sender_key_name: string;
  created_at: string;
  updated_at: string;
}

export interface SendMessageRequest {
  to_did: string;
  message: string;
}

export interface ReadMessageRequest {
  message_id: string;
}

export interface DIDDocumentRecord {
  id: string;
  did_id: string;
  document: DIDDocument;
  created_at: string;
  updated_at: string;
}

export interface PrivateKeyRecord {
  id: string;
  did_id: string;
  key_type: string;
  name: string;
  key_usage: string;
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
  keys: Omit<KeyPair, 'privateKey' | 'publicKey'>[];
}

export interface UpdateDIDRequest {
  document?: DIDDocument;
  keys?: Omit<KeyPair, 'privateKey' | 'publicKey'>[];
}

export interface KeyDerivationPaths {
  ed25519: {
    authentication: string;
    assertionMethod: string;
  };
  x25519: {
    keyAgreement: string[];
  };
}

export const DERIVATION_PATHS: KeyDerivationPaths = {
  ed25519: {
    authentication: "m/44'/0'/0'/0/0",
    assertionMethod: "m/44'/0'/0'/0/1"
  },
  x25519: {
    keyAgreement: [
      "m/44'/0'/0'/1/0",
      "m/44'/0'/0'/1/1", 
      "m/44'/0'/0'/1/2"
    ]
  }
};

export const TEST_MNEMONIC = "test test test test test test test test test test test junk";
