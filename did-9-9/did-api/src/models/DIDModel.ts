import { supabase, supabaseAdmin } from '../config/supabase';
import { DID, DIDDocument, DIDDocumentRecord, PrivateKeyRecord, CreateDIDRequest, DIDResponse, KeyUsage, AddKeyRequest, UpdateKeyActiveRequest } from '../types/did';
import { CryptoUtils } from '../utils/crypto';

export class DIDModel {
  /**
   * Generate DID Document based on keys and their usage
   */
  static generateDIDDocumentFromKeys(did: string, keys: PrivateKeyRecord[]): DIDDocument {
    // Filter only active keys
    const activeKeys = keys.filter(key => key.active);
    
    const verificationMethods = activeKeys.map((key, index) => ({
      id: `${did}#key-${index + 1}`,
      type: key.key_type === 'ed25519' ? 'Ed25519VerificationKey2020' : 'X25519KeyAgreementKey2020',
      controller: did,
      publicKeyMultibase: key.public_key
    }));

    // Group active keys by usage
    const authenticationKeys: string[] = [];
    const assertionMethodKeys: string[] = [];
    const keyAgreementKeys: string[] = [];

    activeKeys.forEach((key, index) => {
      const keyId = `${did}#key-${index + 1}`;
      switch (key.key_usage) {
        case 'authentication':
          authenticationKeys.push(keyId);
          break;
        case 'assertionMethod':
          assertionMethodKeys.push(keyId);
          break;
        case 'keyAgreement':
          keyAgreementKeys.push(keyId);
          break;
      }
    });

    return {
      '@context': [
        'https://www.w3.org/ns/did/v1',
        'https://w3id.org/security/suites/ed25519-2020/v1',
        'https://w3id.org/security/suites/x25519-2020/v1'
      ],
      id: did,
      verificationMethod: verificationMethods,
      ...(authenticationKeys.length > 0 && { authentication: authenticationKeys }),
      ...(assertionMethodKeys.length > 0 && { assertionMethod: assertionMethodKeys }),
      ...(keyAgreementKeys.length > 0 && { keyAgreement: keyAgreementKeys }),
      controller: did
    };
  }

  /**
   * Create a new DID with document and keys
   */
  static async createDID(request: CreateDIDRequest): Promise<DIDResponse> {
    try {
      // Generate encrypted key pairs
      const derivationPath = CryptoUtils.generateDerivationPath(request.did);
      const keyPairs = CryptoUtils.generateEncryptedKeyPairs(derivationPath);

      // Start transaction
      const { data: didData, error: didError } = await supabaseAdmin!
        .from('dids')
        .insert({
          did: request.did
        })
        .select()
        .single();

      if (didError) {
        throw new Error(`Failed to create DID: ${didError.message}`);
      }

      // Create DID document
      const { data: documentData, error: documentError } = await supabaseAdmin!
        .from('did_documents')
        .insert({
          did_id: didData.id,
          document: request.document
        })
        .select()
        .single();

      if (documentError) {
        throw new Error(`Failed to create DID document: ${documentError.message}`);
      }

      // Create private keys
      const privateKeysData = [
        {
          did_id: didData.id,
          key_type: keyPairs.ed25519.keyType,
          name: keyPairs.ed25519.name,
          key_usage: keyPairs.ed25519.keyUsage,
          active: keyPairs.ed25519.active,
          encrypted_private_key: keyPairs.ed25519.encryptedPrivateKey,
          public_key: keyPairs.ed25519.publicKey,
          key_derivation_path: keyPairs.ed25519.derivationPath
        },
        {
          did_id: didData.id,
          key_type: keyPairs.x25519.keyType,
          name: keyPairs.x25519.name,
          key_usage: keyPairs.x25519.keyUsage,
          active: keyPairs.x25519.active,
          encrypted_private_key: keyPairs.x25519.encryptedPrivateKey,
          public_key: keyPairs.x25519.publicKey,
          key_derivation_path: keyPairs.x25519.derivationPath
        }
      ];

      const { data: keysData, error: keysError } = await supabaseAdmin!
        .from('private_keys')
        .insert(privateKeysData)
        .select();

      if (keysError) {
        throw new Error(`Failed to create private keys: ${keysError.message}`);
      }

      return {
        did: didData,
        document: documentData,
        keys: keysData
      };
    } catch (error) {
      throw new Error(`Failed to create DID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get DID by identifier
   */
  static async getDID(did: string): Promise<DIDResponse | null> {
    try {
      const { data: didData, error: didError } = await supabase
        .from('dids')
        .select(`
          *,
          did_documents(*),
          private_keys(*)
        `)
        .eq('did', did)
        .single();

      if (didError) {
        if (didError.code === 'PGRST116') {
          return null; // DID not found
        }
        throw new Error(`Failed to get DID: ${didError.message}`);
      }

      return {
        did: {
          id: didData.id,
          did: didData.did,
          created_at: didData.created_at,
          updated_at: didData.updated_at
        },
        document: didData.did_documents[0],
        keys: didData.private_keys
      };
    } catch (error) {
      throw new Error(`Failed to get DID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all DIDs with pagination
   */
  static async getAllDIDs(page: number = 1, limit: number = 10): Promise<{
    dids: DIDResponse[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const offset = (page - 1) * limit;

      const { data: didsData, error: didsError, count } = await supabase
        .from('dids')
        .select(`
          *,
          did_documents(*),
          private_keys(*)
        `, { count: 'exact' })
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (didsError) {
        throw new Error(`Failed to get DIDs: ${didsError.message}`);
      }

      const dids = didsData.map(didData => ({
        did: {
          id: didData.id,
          did: didData.did,
          created_at: didData.created_at,
          updated_at: didData.updated_at
        },
        document: didData.did_documents[0],
        keys: didData.private_keys
      }));

      return {
        dids,
        total: count || 0,
        page,
        limit
      };
    } catch (error) {
      throw new Error(`Failed to get DIDs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update DID document
   */
  static async updateDID(did: string, document: DIDDocument): Promise<DIDResponse> {
    try {
      // First get the DID
      const existingDID = await this.getDID(did);
      if (!existingDID) {
        throw new Error('DID not found');
      }

      // Update the document
      const { data: documentData, error: documentError } = await supabaseAdmin!
        .from('did_documents')
        .update({
          document: document
        })
        .eq('did_id', existingDID.did.id)
        .select()
        .single();

      if (documentError) {
        throw new Error(`Failed to update DID document: ${documentError.message}`);
      }

      return {
        did: existingDID.did,
        document: documentData,
        keys: existingDID.keys
      };
    } catch (error) {
      throw new Error(`Failed to update DID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete DID and all related data
   */
  static async deleteDID(did: string): Promise<boolean> {
    try {
      const { data: didData, error: didError } = await supabase
        .from('dids')
        .select('id')
        .eq('did', did)
        .single();

      if (didError) {
        if (didError.code === 'PGRST116') {
          return false; // DID not found
        }
        throw new Error(`Failed to find DID: ${didError.message}`);
      }

      // Delete the DID (cascade will handle related records)
      const { error: deleteError } = await supabaseAdmin!
        .from('dids')
        .delete()
        .eq('id', didData.id);

      if (deleteError) {
        throw new Error(`Failed to delete DID: ${deleteError.message}`);
      }

      return true;
    } catch (error) {
      throw new Error(`Failed to delete DID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get private key for a DID (decrypted)
   */
  static async getPrivateKey(did: string, keyType: 'ed25519' | 'x25519'): Promise<Uint8Array | null> {
    try {
      const { data: keyData, error: keyError } = await supabase
        .from('private_keys')
        .select('encrypted_private_key')
        .eq('did_id', (await this.getDID(did))?.did.id)
        .eq('key_type', keyType)
        .single();

      if (keyError) {
        if (keyError.code === 'PGRST116') {
          return null; // Key not found
        }
        throw new Error(`Failed to get private key: ${keyError.message}`);
      }

      return CryptoUtils.decryptPrivateKey(keyData.encrypted_private_key);
    } catch (error) {
      throw new Error(`Failed to get private key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add a new key to an existing DID
   */
  static async addKeyToDID(did: string, keyRequest: AddKeyRequest): Promise<DIDResponse> {
    try {
      // Get the DID
      const { data: didData, error: didError } = await supabaseAdmin!
        .from('dids')
        .select('id')
        .eq('did', did)
        .single();

      if (didError) {
        if (didError.code === 'PGRST116') {
          throw new Error('DID not found');
        }
        throw new Error(`Failed to get DID: ${didError.message}`);
      }

      // Get the next key number for this DID
      const { data: existingKeys, error: keysError } = await supabaseAdmin!
        .from('private_keys')
        .select('id')
        .eq('did_id', didData.id);

      if (keysError) {
        throw new Error(`Failed to get existing keys: ${keysError.message}`);
      }

      const keyNumber = existingKeys.length;
      const derivationPath = CryptoUtils.generateDerivationPathForKey(did, keyNumber);

      // Generate the new key
      const encryptedKeyPair = CryptoUtils.generateSingleEncryptedKeyPair(
        keyRequest.key_type,
        keyRequest.name,
        keyRequest.key_usage,
        keyNumber,
        keyRequest.active ?? true
      );

      // Insert the new key
      const { data: newKeyData, error: insertError } = await supabaseAdmin!
        .from('private_keys')
        .insert({
          did_id: didData.id,
          key_type: encryptedKeyPair.keyType,
          name: encryptedKeyPair.name,
          key_usage: encryptedKeyPair.keyUsage,
          active: encryptedKeyPair.active,
          encrypted_private_key: encryptedKeyPair.encryptedPrivateKey,
          public_key: encryptedKeyPair.publicKey,
          key_derivation_path: encryptedKeyPair.derivationPath
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to add key: ${insertError.message}`);
      }

      // Get the updated DID with all keys
      const updatedDID = await this.getDID(did);
      if (!updatedDID) {
        throw new Error('Failed to retrieve updated DID');
      }

      // Update the DID Document
      const updatedDocument = this.generateDIDDocumentFromKeys(did, updatedDID.keys);
      
      const { error: documentError } = await supabaseAdmin!
        .from('did_documents')
        .update({ document: updatedDocument })
        .eq('did_id', didData.id);

      if (documentError) {
        throw new Error(`Failed to update DID document: ${documentError.message}`);
      }

      return {
        did: updatedDID.did,
        document: updatedDID.document,
        keys: updatedDID.keys
      };
    } catch (error) {
      throw new Error(`Failed to add key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update the active status of a key
   */
  static async updateKeyActiveStatus(did: string, keyId: string, activeRequest: UpdateKeyActiveRequest): Promise<DIDResponse> {
    try {
      // Get the DID
      const { data: didData, error: didError } = await supabaseAdmin!
        .from('dids')
        .select('id')
        .eq('did', did)
        .single();

      if (didError) {
        if (didError.code === 'PGRST116') {
          throw new Error('DID not found');
        }
        throw new Error(`Failed to get DID: ${didError.message}`);
      }

      // Update the key's active status
      const { error: updateError } = await supabaseAdmin!
        .from('private_keys')
        .update({ active: activeRequest.active })
        .eq('id', keyId)
        .eq('did_id', didData.id);

      if (updateError) {
        if (updateError.code === 'PGRST116') {
          throw new Error('Key not found');
        }
        throw new Error(`Failed to update key: ${updateError.message}`);
      }

      // Get the updated DID with all keys
      const updatedDID = await this.getDID(did);
      if (!updatedDID) {
        throw new Error('Failed to retrieve updated DID');
      }

      // Update the DID Document
      const updatedDocument = this.generateDIDDocumentFromKeys(did, updatedDID.keys);
      
      const { error: documentError } = await supabaseAdmin!
        .from('did_documents')
        .update({ document: updatedDocument })
        .eq('did_id', didData.id);

      if (documentError) {
        throw new Error(`Failed to update DID document: ${documentError.message}`);
      }

      return {
        did: updatedDID.did,
        document: updatedDID.document,
        keys: updatedDID.keys
      };
    } catch (error) {
      throw new Error(`Failed to update key active status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
