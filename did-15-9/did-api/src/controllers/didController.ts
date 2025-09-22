import { Request, Response } from 'express';
import { DIDModel } from '../models/DIDModel';
import { CryptoManager } from '../utils/crypto';
import { CreateDIDRequest, DIDDocument, UpdateDIDRequest, SendMessageRequest, ReadMessageRequest } from '../types/did';
import { config } from '../config/supabase';

export class DIDController {
  private didModel: DIDModel;
  private cryptoManager: CryptoManager;

  constructor() {
    this.didModel = new DIDModel();
    this.cryptoManager = new CryptoManager(config.encryption.key);
  }

  /**
   * Crea un nuevo DID
   */
  async createDID(req: Request, res: Response): Promise<void> {
    try {
      const { did, document, keys } = req.body;

      if (!did) {
        res.status(400).json({ error: 'DID is required' });
        return;
      }

      // Verificar si el DID ya existe
      const existingDID = await this.didModel.getDID(did);
      if (existingDID) {
        res.status(409).json({ error: 'DID already exists' });
        return;
      }

      // Generar documento DID si no se proporciona
      let didDocument: DIDDocument;
      if (document) {
        didDocument = document;
      } else {
        // Obtener el mnemonic del DID
        const didData = await this.didModel.getDID(did);
        const mnemonic = didData?.mnemonic;
        didDocument = await this.generateDIDDocument(did, keys, mnemonic);
      }

      const createRequest: CreateDIDRequest = {
        did,
        document: didDocument,
        keys: keys || []
      };

      const newDID = await this.didModel.createDID(createRequest);

      res.status(201).json({
        success: true,
        data: newDID,
        message: 'DID created successfully'
      });
    } catch (error) {
      console.error('Error creating DID:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Crea un nuevo DID de forma simplificada (para la web app)
   */
  async createSimpleDID(req: Request, res: Response): Promise<void> {
    try {
      const { keyType = 'ed25519', purpose = 'authentication', didName } = req.body;

      // Usar el DID proporcionado o generar uno único
      let did: string;
      if (didName && didName.trim()) {
        // Validar que el didName comience con 'did:'
        if (!didName.startsWith('did:')) {
          res.status(400).json({ error: 'DID name must start with "did:"' });
          return;
        }
        did = didName.trim();
      } else {
        // Generar un DID único si no se proporciona
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 8);
        did = `did:innovation:${timestamp}-${randomId}`;
      }

      // Verificar si el DID ya existe (muy improbable)
      const existingDID = await this.didModel.getDID(did);
      if (existingDID) {
        res.status(409).json({ error: 'DID already exists, please try again' });
        return;
      }

      // Generar mnemonic único para este DID
      const mnemonic = this.cryptoManager.generateMnemonic();

      // Generar todas las claves necesarias
      const allKeys = this.cryptoManager.generateAllKeys(mnemonic);

      // Generar documento DID con todas las claves
      const didDocument = await this.generateDIDDocument(did, allKeys, mnemonic);

      const createRequest: CreateDIDRequest = {
        did,
        document: didDocument,
        keys: allKeys
      };

      const newDID = await this.didModel.createDID(createRequest);

      // Obtener el documento y las claves creadas
      const document = await this.didModel.getDIDDocument(did);
      const keys = await this.didModel.getDIDKeys(did);

      res.status(201).json({
        id: newDID.id,
        did: newDID.did,
        did_document: document,
        private_key: keys.find(k => k.key_usage === 'authentication')?.encrypted_private_key || '',
        public_key: keys.find(k => k.key_usage === 'authentication')?.public_key || '',
        created_at: newDID.created_at,
        updated_at: newDID.updated_at
      });
    } catch (error) {
      console.error('Error creating simple DID:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Obtiene un DID por su identificador
   */
  async getDID(req: Request, res: Response): Promise<void> {
    try {
      const { did } = req.params;

      const didData = await this.didModel.getDID(did);
      if (!didData) {
        res.status(404).json({ error: 'DID not found' });
        return;
      }

      const document = await this.didModel.getDIDDocument(did);
      const keys = await this.didModel.getDIDKeys(did);

      res.json({
        success: true,
        data: {
          ...didData,
          document,
          keys: keys.map(key => ({
            id: key.id,
            name: key.name,
            keyType: key.key_type,
            keyUsage: key.key_usage,
            active: key.active,
            publicKey: key.public_key,
            derivationPath: key.key_derivation_path,
            createdAt: key.created_at,
            updatedAt: key.updated_at
          }))
        }
      });
    } catch (error) {
      console.error('Error getting DID:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Obtiene el documento DID
   */
  async getDIDDocument(req: Request, res: Response): Promise<void> {
    try {
      const { did } = req.params;

      const document = await this.didModel.getDIDDocument(did);
      if (!document) {
        res.status(404).json({ error: 'DID document not found' });
        return;
      }

      res.json({
        success: true,
        data: document
      });
    } catch (error) {
      console.error('Error getting DID document:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Actualiza un DID
   */
  async updateDID(req: Request, res: Response): Promise<void> {
    try {
      const { did } = req.params;
      const { document, keys } = req.body;

      const updateRequest: UpdateDIDRequest = {
        document,
        keys
      };

      const updatedDID = await this.didModel.updateDID(did, updateRequest);

      res.json({
        success: true,
        data: updatedDID,
        message: 'DID updated successfully'
      });
    } catch (error) {
      console.error('Error updating DID:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Elimina un DID
   */
  async deleteDID(req: Request, res: Response): Promise<void> {
    try {
      const { did } = req.params;

      const deleted = await this.didModel.deleteDID(did);
      if (!deleted) {
        res.status(404).json({ error: 'DID not found' });
        return;
      }

      res.json({
        success: true,
        message: 'DID deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting DID:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Lista todos los DIDs
   */
  async listDIDs(req: Request, res: Response): Promise<void> {
    try {
      const dids = await this.didModel.listDIDs();

      // Obtener detalles completos de cada DID
      const didsWithDetails = await Promise.all(dids.map(async (did) => {
        try {
          const document = await this.didModel.getDIDDocument(did.did);
          const keys = await this.didModel.getDIDKeys(did.did);

          return {
            id: did.id,
            did: did.did,
            did_document: document,
            private_key: keys.find(k => k.key_usage === 'authentication')?.encrypted_private_key || '',
            public_key: keys.find(k => k.key_usage === 'authentication')?.public_key || '',
            created_at: did.created_at,
            updated_at: did.updated_at
          };
        } catch (error) {
          console.error(`Error getting details for DID ${did.did}:`, error);
          return {
            id: did.id,
            did: did.did,
            did_document: {},
            private_key: '',
            public_key: '',
            created_at: did.created_at,
            updated_at: did.updated_at
          };
        }
      }));

      res.json(didsWithDetails);
    } catch (error) {
      console.error('Error listing DIDs:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Firma un mensaje usando assertionMethod
   */
  async signMessage(req: Request, res: Response): Promise<void> {
    try {
      const { did } = req.params;
      const { message, keyName } = req.body;

      if (!message) {
        res.status(400).json({ error: 'Message is required' });
        return;
      }

      const keyRecord = await this.didModel.getPrivateKey(did, keyName || 'assertion-key');
      if (!keyRecord) {
        res.status(404).json({ error: 'Private key not found' });
        return;
      }

      if (keyRecord.key_type !== 'ed25519') {
        res.status(400).json({ error: 'Only Ed25519 keys can be used for signing' });
        return;
      }

      const encryptedKeyPair = {
        name: keyRecord.name,
        keyType: keyRecord.key_type as 'ed25519',
        keyUsage: keyRecord.key_usage as 'assertionMethod',
        active: keyRecord.active,
        encryptedPrivateKey: keyRecord.encrypted_private_key,
        publicKey: keyRecord.public_key, 
        derivationPath: keyRecord.key_derivation_path
      };

      const keyPair = this.cryptoManager.decryptKeyPair(encryptedKeyPair);
      const signature = this.cryptoManager.signMessage(message, keyPair.privateKey);

      res.json({
        success: true,
        data: {
          message,
          signature,
          publicKey: keyRecord.public_key,
          keyName: keyRecord.name
        }
      });
    } catch (error) {
      console.error('Error signing message:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Verifica una firma
   */
  async verifySignature(req: Request, res: Response): Promise<void> {
    try {
      const { did } = req.params;
      const { message, signature, keyName } = req.body;

      if (!message || !signature) {
        res.status(400).json({ error: 'Message and signature are required' });
        return;
      }

      const keyRecord = await this.didModel.getPrivateKey(did, keyName || 'assertion-key');
      if (!keyRecord) {
        res.status(404).json({ error: 'Public key not found' });
        return;
      }

      const isValid = this.cryptoManager.verifySignature(message, signature, keyRecord.public_key);

      res.json({
        success: true,
        data: {
          message,
          signature,
          publicKey: keyRecord.public_key,
          valid: isValid
        }
      });
    } catch (error) {
      console.error('Error verifying signature:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Genera una clave compartida usando keyAgreement
   */
  async generateSharedSecret(req: Request, res: Response): Promise<void> {
    try {
      const { did } = req.params;
      const { otherPublicKey, keyName } = req.body;

      if (!otherPublicKey) {
        res.status(400).json({ error: 'Other public key is required' });
        return;
      }

      const keyRecord = await this.didModel.getPrivateKey(did, keyName || 'key-agreement-1');
      if (!keyRecord) {
        res.status(404).json({ error: 'Private key not found' });
        return;
      }

      if (keyRecord.key_type !== 'x25519') {
        res.status(400).json({ error: 'Only X25519 keys can be used for key agreement' });
        return;
      }

      const encryptedKeyPair = {
        name: keyRecord.name,
        keyType: keyRecord.key_type as 'x25519',
        keyUsage: keyRecord.key_usage as 'keyAgreement',
        active: keyRecord.active,
        encryptedPrivateKey: keyRecord.encrypted_private_key,
        publicKey: keyRecord.public_key,
        derivationPath: keyRecord.key_derivation_path
      };

      const keyPair = this.cryptoManager.decryptKeyPair(encryptedKeyPair);
      const privateKeyHex = this.cryptoManager.privateKeyToHex(keyPair.privateKey);
      const sharedSecret = this.cryptoManager.generateSharedSecret(privateKeyHex, otherPublicKey);

      res.json({
        success: true,
        data: {
          sharedSecret: Buffer.from(sharedSecret).toString('base64'),
          ourPublicKey: keyRecord.public_key,
          otherPublicKey,
          keyName: keyRecord.name
        }
      });
    } catch (error) {
      console.error('Error generating shared secret:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Genera un documento DID automáticamente
   */
  private async generateDIDDocument(did: string, keys?: any[], mnemonic?: string): Promise<DIDDocument> {
    const generatedKeys = mnemonic ? this.cryptoManager.generateAllKeys(mnemonic) : this.cryptoManager.generateAllKeys();
    const usedKeys = keys && keys.length > 0 ? keys : generatedKeys;

    const verificationMethods = usedKeys.map((key, index) => (        {
          id: `${did}#key-${index + 1}`,
          type: key.keyType === 'ed25519' ? 'Ed25519VerificationKey2020' : 'X25519KeyAgreementKey2020',
          controller: did,
          publicKeyMultibase: this.cryptoManager.publicKeyToHex(
            key.publicKey || generatedKeys.find(k => k.name === key.name)?.publicKey!
          )
        }));

    const authentication = verificationMethods
      .filter((_, index) => usedKeys[index]?.keyUsage === 'authentication')
      .map(vm => vm.id);

    const assertionMethod = verificationMethods
      .filter((_, index) => usedKeys[index]?.keyUsage === 'assertionMethod')
      .map(vm => vm.id);

    const keyAgreement = verificationMethods
      .filter((_, index) => usedKeys[index]?.keyUsage === 'keyAgreement')
      .map(vm => vm.id);

    return {
      id: did,
      '@context': [
        'https://www.w3.org/ns/did/v1',
        'https://w3id.org/security/suites/ed25519-2020/v1',
        'https://w3id.org/security/suites/x25519-2020/v1'
      ],
      controller: did,
      alsoKnownAs: [
        `https://example.com/users/${did.split(':').pop()}`,
        `https://social.example.com/@${did.split(':').pop()}`
      ],
      service: [
        {
          id: `${did}#vcs`,
          type: 'VerifiableCredentialService',
          serviceEndpoint: `https://example.com/vc/${did.split(':').pop()}/`
        },
        {
          id: `${did}#hub`,
          type: 'HubService',
          serviceEndpoint: `https://example.com/hub/${did.split(':').pop()}/`
        },
        {
          id: `${did}#profile`,
          type: 'ProfileService',
          serviceEndpoint: `https://example.com/profile/${did.split(':').pop()}/`
        }
      ],
      authentication,
      assertionMethod,
      keyAgreement,
      verificationMethod: verificationMethods
    };
  }

  /**
   * Envía un mensaje encriptado
   */
  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const { did } = req.params;
      const { to_did, message, sender_key_name = 'key-agreement-1' }: SendMessageRequest & { sender_key_name?: string } = req.body;

      if (!to_did || !message) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: to_did and message'
        });
        return;
      }

      const messageData = await this.didModel.sendMessage(did, to_did, message, sender_key_name);

      res.json({
        success: true,
        data: {
          message_id: messageData.id,
          from_did: messageData.from_did,
          to_did: messageData.to_did,
          sender_key_name: messageData.sender_key_name,
          created_at: messageData.created_at
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Lee un mensaje encriptado
   */
  async readMessage(req: Request, res: Response): Promise<void> {
    try {
      const { did } = req.params;
      const { message_id }: ReadMessageRequest = req.body;

      if (!message_id) {
        res.status(400).json({
          success: false,
          error: 'Missing required field: message_id'
        });
        return;
      }

      const result = await this.didModel.readMessage(message_id, did);

      res.json({
        success: true,
        data: {
          message: result.message,
          from_did: result.from_did,
          sender_key_name: result.sender_key_name,
          message_id: message_id
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Obtiene los mensajes de un DID
   */
  async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const { did } = req.params;

      const messages = await this.didModel.getMessages(did);

      res.json({
        success: true,
        data: messages,
        count: messages.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
