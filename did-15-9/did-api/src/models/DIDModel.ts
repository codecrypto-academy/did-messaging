import { supabase } from '../config/supabase';
import { DID, DIDDocument, DIDDocumentRecord, PrivateKeyRecord, CreateDIDRequest, UpdateDIDRequest, Message, SendMessageRequest } from '../types/did';
import { CryptoManager } from '../utils/crypto';
import { config } from '../config/supabase';

export class DIDModel {
  private cryptoManager: CryptoManager;

  constructor() {
    this.cryptoManager = new CryptoManager(config.encryption.key);
  }

  /**
   * Crea un nuevo DID con su documento y claves
   */
  async createDID(request: CreateDIDRequest): Promise<DID> {
    try {
      // Generar mnemonic único para este DID
      const mnemonic = this.cryptoManager.generateMnemonic();
      
      // Generar claves usando el mnemonic específico
      const keys = request.keys.length > 0 ? request.keys : this.cryptoManager.generateAllKeys(mnemonic);

      // Crear el DID con mnemonic
      const { data: didData, error: didError } = await supabase
        .from('dids')
        .insert({ did: request.did, mnemonic: mnemonic })
        .select()
        .single();

      if (didError) {
        throw new Error(`Failed to create DID: ${didError.message}`);
      }

      // Crear el documento DID
      const { error: docError } = await supabase
        .from('did_documents')
        .insert({
          did_id: didData.id,
          document: request.document
        });

      if (docError) {
        // Rollback: eliminar el DID si falla la creación del documento
        await supabase.from('dids').delete().eq('id', didData.id);
        throw new Error(`Failed to create DID document: ${docError.message}`);
      }

      // Crear las claves privadas
      const keyPromises = keys.map(async (keyTemplate) => {
        const keyPair = this.cryptoManager.generateAllKeys().find(k => 
          k.name === keyTemplate.name && 
          k.keyType === keyTemplate.keyType && 
          k.keyUsage === keyTemplate.keyUsage
        );

        if (!keyPair) {
          throw new Error(`Failed to generate key pair for ${keyTemplate.name}`);
        }

        const encryptedKeyPair = this.cryptoManager.encryptKeyPair(keyPair);

        return supabase
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
          });
      });

      const keyResults = await Promise.all(keyPromises);
      const keyErrors = keyResults.filter(result => result.error);

      if (keyErrors.length > 0) {
        // Rollback: eliminar todo si falla la creación de claves
        await supabase.from('dids').delete().eq('id', didData.id);
        throw new Error(`Failed to create private keys: ${keyErrors[0].error?.message}`);
      }

      return didData;
    } catch (error) {
      throw new Error(`Error creating DID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Obtiene un DID por su identificador
   */
  async getDID(did: string): Promise<DID | null> {
    try {
      const { data, error } = await supabase
        .from('dids')
        .select('*')
        .eq('did', did)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No encontrado
        }
        throw new Error(`Failed to get DID: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw new Error(`Error getting DID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Obtiene el documento DID
   */
  async getDIDDocument(did: string): Promise<DIDDocument | null> {
    try {
      const { data: didData, error: didError } = await supabase
        .from('dids')
        .select('id')
        .eq('did', did)
        .single();

      if (didError || !didData) {
        return null;
      }

      const { data, error } = await supabase
        .from('did_documents')
        .select('document')
        .eq('did_id', didData.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No encontrado
        }
        throw new Error(`Failed to get DID document: ${error.message}`);
      }

      return data.document;
    } catch (error) {
      throw new Error(`Error getting DID document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Obtiene todas las claves privadas de un DID
   */
  async getDIDKeys(did: string): Promise<PrivateKeyRecord[]> {
    try {
      const { data: didData, error: didError } = await supabase
        .from('dids')
        .select('id')
        .eq('did', did)
        .single();

      if (didError || !didData) {
        return [];
      }

      const { data, error } = await supabase
        .from('private_keys')
        .select('*')
        .eq('did_id', didData.id);

      if (error) {
        throw new Error(`Failed to get DID keys: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      throw new Error(`Error getting DID keys: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Actualiza un DID
   */
  async updateDID(did: string, request: UpdateDIDRequest): Promise<DID> {
    try {
      const { data: didData, error: didError } = await supabase
        .from('dids')
        .select('id')
        .eq('did', did)
        .single();

      if (didError || !didData) {
        throw new Error('DID not found');
      }

      // Actualizar documento si se proporciona
      if (request.document) {
        const { error: docError } = await supabase
          .from('did_documents')
          .update({ document: request.document })
          .eq('did_id', didData.id);

        if (docError) {
          throw new Error(`Failed to update DID document: ${docError.message}`);
        }
      }

      // Actualizar claves si se proporcionan
      if (request.keys && request.keys.length > 0) {
        // Eliminar claves existentes
        await supabase
          .from('private_keys')
          .delete()
          .eq('did_id', didData.id);

        // Crear nuevas claves
        const keyPromises = request.keys.map(async (keyTemplate) => {
          const keyPair = this.cryptoManager.generateAllKeys().find(k => 
            k.name === keyTemplate.name && 
            k.keyType === keyTemplate.keyType && 
            k.keyUsage === keyTemplate.keyUsage
          );

          if (!keyPair) {
            throw new Error(`Failed to generate key pair for ${keyTemplate.name}`);
          }

          const encryptedKeyPair = this.cryptoManager.encryptKeyPair(keyPair);

          return supabase
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
            });
        });

        const keyResults = await Promise.all(keyPromises);
        const keyErrors = keyResults.filter(result => result.error);

        if (keyErrors.length > 0) {
          throw new Error(`Failed to update private keys: ${keyErrors[0].error?.message}`);
        }
      }

      // Obtener el DID actualizado
      const { data: updatedDID, error: updateError } = await supabase
        .from('dids')
        .select('*')
        .eq('id', didData.id)
        .single();

      if (updateError) {
        throw new Error(`Failed to get updated DID: ${updateError.message}`);
      }

      return updatedDID;
    } catch (error) {
      throw new Error(`Error updating DID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Elimina un DID
   */
  async deleteDID(did: string): Promise<boolean> {
    try {
      const { data: didData, error: didError } = await supabase
        .from('dids')
        .select('id')
        .eq('did', did)
        .single();

      if (didError || !didData) {
        return false;
      }

      const { error } = await supabase
        .from('dids')
        .delete()
        .eq('id', didData.id);

      if (error) {
        throw new Error(`Failed to delete DID: ${error.message}`);
      }

      return true;
    } catch (error) {
      throw new Error(`Error deleting DID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Lista todos los DIDs
   */
  async listDIDs(): Promise<DID[]> {
    try {
      const { data, error } = await supabase
        .from('dids')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to list DIDs: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      throw new Error(`Error listing DIDs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Obtiene una clave privada específica para operaciones criptográficas
   */
  async getPrivateKey(did: string, keyName: string): Promise<PrivateKeyRecord | null> {
    try {
      const { data: didData, error: didError } = await supabase
        .from('dids')
        .select('id')
        .eq('did', did)
        .single();

      if (didError || !didData) {
        return null;
      }

      const { data, error } = await supabase
        .from('private_keys')
        .select('*')
        .eq('did_id', didData.id)
        .eq('name', keyName)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No encontrado
        }
        throw new Error(`Failed to get private key: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw new Error(`Error getting private key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Envía un mensaje encriptado
   */
  async sendMessage(fromDid: string, toDid: string, message: string, senderKeyName: string = 'key-agreement-1'): Promise<Message> {
    try {
      // Obtener clave privada del remitente
      const senderKey = await this.getPrivateKeyByUsage(fromDid, 'keyAgreement', senderKeyName);
      if (!senderKey) {
        throw new Error(`Sender key agreement key '${senderKeyName}' not found`);
      }

      // Obtener clave pública del destinatario (key-agreement-1)
      const recipientKey = await this.getPrivateKeyByUsage(toDid, 'keyAgreement', 'key-agreement-1');
      if (!recipientKey) {
        throw new Error('Recipient key agreement key not found');
      }

      // Encriptar el mensaje
      const encryptedMessage = this.cryptoManager.encryptMessage(
        message,
        senderKey.encrypted_private_key,
        recipientKey.public_key
      );

      // Insertar el mensaje en la base de datos
      const { data, error } = await supabase
        .from('messages')
        .insert({
          from_did: fromDid,
          to_did: toDid,
          encrypted_message: encryptedMessage,
          sender_public_key: senderKey.public_key,
          sender_key_id: senderKey.id,
          sender_key_name: senderKeyName
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to send message: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw new Error(`Error sending message: ${error}`);
    }
  }

  /**
   * Lee un mensaje encriptado
   */
  async readMessage(messageId: string, recipientDid: string): Promise<{ message: string; from_did: string; sender_key_name: string }> {
    try {
      // Obtener el mensaje de la base de datos
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .select('*')
        .eq('id', messageId)
        .eq('to_did', recipientDid)
        .single();

      if (messageError) {
        throw new Error(`Message not found: ${messageError.message}`);
      }

      // Obtener clave privada del destinatario (key-agreement-1)
      const recipientKey = await this.getPrivateKeyByUsage(recipientDid, 'keyAgreement', 'key-agreement-1');
      if (!recipientKey) {
        throw new Error('Recipient key agreement key not found');
      }

      // Desencriptar el mensaje usando la clave pública específica del remitente
      const decryptedMessage = this.cryptoManager.decryptMessage(
        messageData.encrypted_message,
        recipientKey.encrypted_private_key,
        messageData.sender_public_key
      );

      return {
        message: decryptedMessage,
        from_did: messageData.from_did,
        sender_key_name: messageData.sender_key_name
      };
    } catch (error) {
      throw new Error(`Error reading message: ${error}`);
    }
  }

  /**
   * Obtiene los mensajes de un DID
   */
  async getMessages(did: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('to_did', did)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get messages: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Obtiene una clave privada por uso y nombre
   */
  private async getPrivateKeyByUsage(did: string, keyUsage: string, name: string): Promise<PrivateKeyRecord | null> {
    const didData = await this.getDID(did);
    if (!didData) {
      return null;
    }

    const { data, error } = await supabase
      .from('private_keys')
      .select('*')
      .eq('did_id', didData.id)
      .eq('key_usage', keyUsage)
      .eq('name', name)
      .single();

    if (error) {
      return null;
    }

    return data;
  }
}
