import * as bip39 from 'bip39';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';
import { ed25519 } from '@noble/curves/ed25519';
import { x25519 } from '@noble/curves/ed25519';
import { sha256 } from '@noble/hashes/sha256';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { KeyPair, EncryptedKeyPair, DERIVATION_PATHS, TEST_MNEMONIC } from '../types/did';

export class CryptoManager {
  private encryptionKey: string;
  private bip32: any;

  constructor(encryptionKey: string) {
    this.encryptionKey = encryptionKey;
    this.bip32 = BIP32Factory(ecc);
  }

  /**
   * Genera un par de claves Ed25519 desde un mnemonic
   */
  generateEd25519KeyPair(mnemonic: string, derivationPath: string, name: string, keyUsage: 'authentication' | 'assertionMethod'): KeyPair {
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic');
    }

    // Generar seed desde mnemonic
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    
    // Usar BIP32 para derivar la clave
    const hdkey = this.bip32.fromSeed(seed);
    const derivedKey = hdkey.derivePath(derivationPath);
    
    if (!derivedKey.privateKey) {
      throw new Error('Failed to derive private key');
    }

    // Usar @noble/curves para generar el par de claves
    const privateKey = new Uint8Array(derivedKey.privateKey);
    const publicKey = ed25519.getPublicKey(privateKey);
    console.log('privateKey', privateKey);
    console.log('publicKey', publicKey);
    console.log('derivationPath', derivationPath);
    console.log('name', name);
    console.log('keyUsage', keyUsage);
    console.log('active', true);
    console.log('derivationPath', derivationPath);
    console.log('name', name);
    console.log('keyUsage', keyUsage);
    console.log('active', true);
    return {
      name,
      keyType: 'ed25519',
      keyUsage,
      active: true,
      privateKey: privateKey,
      publicKey: publicKey,
      derivationPath
    };
  }

  /**
   * Genera un par de claves X25519 desde un mnemonic
   */
  generateX25519KeyPair(mnemonic: string, derivationPath: string, name: string, keyUsage: 'keyAgreement'): KeyPair {
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic');
    }

    // Generar seed desde mnemonic
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    
    // Usar BIP32 para derivar la clave
    const hdkey = this.bip32.fromSeed(seed);
    const derivedKey = hdkey.derivePath(derivationPath);
    
    if (!derivedKey.privateKey) {
      throw new Error('Failed to derive private key');
    }

    // Convert Ed25519 private key to X25519
    const ed25519PrivateKey = new Uint8Array(derivedKey.privateKey);
    const ed25519PublicKey = ed25519.getPublicKey(ed25519PrivateKey);
    
    // Convert to X25519 format
    const x25519PrivateKey = this.ed25519ToX25519PrivateKey(ed25519PrivateKey);
    const x25519PublicKey = x25519.getPublicKey(x25519PrivateKey);

    return {
      name,
      keyType: 'x25519',
      keyUsage,
      active: true,
      privateKey: x25519PrivateKey,
      publicKey: x25519PublicKey,
      derivationPath
    };
  }

  /**
   * Genera un mnemonic único
   */
  generateMnemonic(): string {
    return bip39.generateMnemonic();
  }

  /**
   * Genera todas las claves necesarias para un DID
   */
  generateAllKeys(mnemonic: string = TEST_MNEMONIC): KeyPair[] {
    const keys: KeyPair[] = [];

    // Ed25519 keys
    keys.push(this.generateEd25519KeyPair(
      mnemonic, 
      DERIVATION_PATHS.ed25519.authentication, 
      'auth-key', 
      'authentication'
    ));

    keys.push(this.generateEd25519KeyPair(
      mnemonic, 
      DERIVATION_PATHS.ed25519.assertionMethod, 
      'assertion-key', 
      'assertionMethod'
    ));

    // X25519 keys
    DERIVATION_PATHS.x25519.keyAgreement.forEach((path, index) => {
      keys.push(this.generateX25519KeyPair(
        mnemonic, 
        path, 
        `key-agreement-${index + 1}`, 
        'keyAgreement'
      ));
    });

    return keys;
  }

  /**
   * Convierte una clave privada a formato hexadecimal (sin cifrar)
   */
  privateKeyToHex(privateKey: Uint8Array): string {
    return Buffer.from(privateKey).toString('hex');
  }

  /**
   * Convierte hexadecimal a clave privada
   */
  hexToPrivateKey(hex: string): Uint8Array {
    return new Uint8Array(Buffer.from(hex, 'hex'));
  }

  /**
   * Encripta un mensaje usando Diffie-Hellman
   */
  encryptMessage(message: string, senderPrivateKeyHex: string, recipientPublicKeyHex: string): string {
    try {
      // Generar shared secret usando Diffie-Hellman
      const sharedSecret = this.generateSharedSecret(senderPrivateKeyHex, recipientPublicKeyHex);
      
      // Usar el shared secret como clave para AES
      const key = sharedSecret.slice(0, 32); // Tomar los primeros 32 bytes
      const iv = randomBytes(16);
      
      // Encriptar el mensaje
      const cipher = createCipheriv('aes-256-cbc', key, iv);
      let encrypted = cipher.update(message, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Combinar IV y mensaje encriptado
      const result = iv.toString('hex') + ':' + encrypted;
      return result; // Devolver directamente como string, no en base64
    } catch (error) {
      throw new Error(`Error encrypting message: ${error}`);
    }
  }

  /**
   * Desencripta un mensaje usando Diffie-Hellman
   */
  decryptMessage(encryptedMessage: string, recipientPrivateKeyHex: string, senderPublicKeyHex: string): string {
    try {
      // Generar shared secret usando Diffie-Hellman
      const sharedSecret = this.generateSharedSecret(recipientPrivateKeyHex, senderPublicKeyHex);
      
      // Usar el shared secret como clave para AES
      const key = sharedSecret.slice(0, 32); // Tomar los primeros 32 bytes
      
      // Separar IV y mensaje encriptado
      const [ivHex, encrypted] = encryptedMessage.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      
      // Desencriptar el mensaje
      const decipher = createDecipheriv('aes-256-cbc', key, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error(`Error decrypting message: ${error}`);
    }
  }

  /**
   * Convierte una clave pública a formato hexadecimal
   */
  publicKeyToHex(publicKey: Uint8Array): string {
    return Buffer.from(publicKey).toString('hex');
  }

  /**
   * Convierte hexadecimal a clave pública
   */
  hexToPublicKey(hex: string): Uint8Array {
    return new Uint8Array(Buffer.from(hex, 'hex'));
  }

  /**
   * Firma un mensaje con una clave privada Ed25519
   */
  signMessage(message: string, privateKey: Uint8Array): string {
    const messageBytes = new TextEncoder().encode(message);
    const signature = ed25519.sign(messageBytes, privateKey);
    return Buffer.from(signature).toString('base64');
  }

  /**
   * Verifica una firma con una clave pública Ed25519 (formato hexadecimal)
   */
  verifySignature(message: string, signature: string, publicKeyHex: string): boolean {
    try {
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = new Uint8Array(Buffer.from(signature, 'base64'));
      const publicKey = this.hexToPublicKey(publicKeyHex);
      return ed25519.verify(signatureBytes, messageBytes, publicKey);
    } catch {
      return false;
    }
  }

  /**
   * Genera una clave compartida usando Diffie-Hellman (X25519) con formato hexadecimal
   */
  generateSharedSecret(privateKeyHex: string, publicKeyHex: string): Uint8Array {
    const privateKey = this.hexToPrivateKey(privateKeyHex);
    const publicKey = this.hexToPublicKey(publicKeyHex);
    return x25519.getSharedSecret(privateKey, publicKey);
  }

  /**
   * Convierte un KeyPair a EncryptedKeyPair (ahora sin cifrar)
   */
  encryptKeyPair(keyPair: KeyPair): EncryptedKeyPair {
    return {
      name: keyPair.name,
      keyType: keyPair.keyType,
      keyUsage: keyPair.keyUsage,
      active: keyPair.active,
      encryptedPrivateKey: this.privateKeyToHex(keyPair.privateKey),
      publicKey: this.publicKeyToHex(keyPair.publicKey),
      derivationPath: keyPair.derivationPath
    };
  }

  /**
   * Convierte un EncryptedKeyPair a KeyPair
   */
  decryptKeyPair(encryptedKeyPair: EncryptedKeyPair): KeyPair {
    // Ahora las claves privadas están en formato hexadecimal sin cifrar
    const privateKey = this.hexToPrivateKey(encryptedKeyPair.encryptedPrivateKey);
    
    // Generar la clave pública correspondiente a partir de la clave privada
    let publicKey: Uint8Array;
    if (encryptedKeyPair.keyType === 'ed25519') {
      publicKey = ed25519.getPublicKey(privateKey);
    } else {
      publicKey = x25519.getPublicKey(privateKey);
    }
    
    return {
      name: encryptedKeyPair.name,
      keyType: encryptedKeyPair.keyType,
      keyUsage: encryptedKeyPair.keyUsage,
      active: encryptedKeyPair.active,
      privateKey: privateKey,
      publicKey: publicKey,
      derivationPath: encryptedKeyPair.derivationPath
    };
  }

  /**
   * Convierte una clave privada Ed25519 a X25519
   */
  private ed25519ToX25519PrivateKey(ed25519PrivateKey: Uint8Array): Uint8Array {
    // Para la conversión de Ed25519 a X25519, usamos el hash de la clave privada
    // Esto es una simplificación - en producción se debería usar la conversión matemática correcta
    const hash = sha256(ed25519PrivateKey);
    return hash.slice(0, 32);
  }

  /**
   * Codificación Base58 simple (para propósitos de demostración)
   */
  private base58Encode(buffer: Uint8Array): string {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let result = '';
    let num = BigInt('0x' + Buffer.from(buffer).toString('hex'));
    
    while (num > 0n) {
      result = alphabet[Number(num % 58n)] + result;
      num = num / 58n;
    }
    
    // Add leading '1's for leading zeros
    for (let i = 0; i < buffer.length && buffer[i] === 0; i++) {
      result = '1' + result;
    }
    
    return result;
  }

  /**
   * Decodificación Base58 simple (para propósitos de demostración)
   */
  private base58Decode(str: string): Uint8Array {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let num = 0n;
    let multi = 1n;
    
    for (let i = str.length - 1; i >= 0; i--) {
      const char = str[i];
      const index = alphabet.indexOf(char);
      if (index === -1) {
        throw new Error('Invalid base58 character');
      }
      num += BigInt(index) * multi;
      multi *= 58n;
    }
    
    const hex = num.toString(16);
    const padded = hex.padStart(hex.length + (hex.length % 2), '0');
    return new Uint8Array(Buffer.from(padded, 'hex'));
  }
}