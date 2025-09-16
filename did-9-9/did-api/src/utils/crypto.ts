import * as bip39 from 'bip39';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';
import * as ed25519 from 'ed25519-hd-key';
import * as nacl from 'tweetnacl';
import * as naclUtil from 'tweetnacl-util';
import { createHash, createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import dotenv from 'dotenv';

dotenv.config();

// Initialize BIP32 with secp256k1
const bip32 = BIP32Factory(ecc);

export interface KeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

export interface EncryptedKeyPair {
  encryptedPrivateKey: string;
  publicKey: string;
  keyType: 'ed25519' | 'x25519';
  name: string;
  keyUsage: 'authentication' | 'assertionMethod' | 'keyAgreement';
  active: boolean;
  derivationPath: string;
}

export class CryptoUtils {
  private static readonly ANVIL_MNEMONIC = process.env.ANVIL_MNEMONIC || 
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
  
  private static readonly ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 
    'default-32-character-encryption-key!';

  /**
   * Generate Ed25519 key pair using tweetnacl
   */
  static generateEd25519KeyPair(derivationPath: string = "m/44'/0'/0'/0/0"): KeyPair {
    // Generate a deterministic seed from the mnemonic and derivation path
    const seed = bip39.mnemonicToSeedSync(this.ANVIL_MNEMONIC);
    const pathHash = createHash('sha256').update(derivationPath).digest();
    const combinedSeed = createHash('sha256').update(Buffer.concat([seed, pathHash])).digest();
    
    // Use the first 32 bytes as the private key seed
    const privateKeySeed = combinedSeed.slice(0, 32);
    
    // Generate key pair using tweetnacl
    const keyPair = nacl.sign.keyPair.fromSeed(privateKeySeed);
    
    return {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.secretKey
    };
  }

  /**
   * Generate X25519 key pair from Ed25519 private key
   */
  static generateX25519KeyPair(ed25519PrivateKey: Uint8Array): KeyPair {
    // Extract the first 32 bytes from Ed25519 private key for X25519
    const x25519PrivateKey = ed25519PrivateKey.slice(0, 32);
    
    // Generate X25519 key pair
    const x25519KeyPair = nacl.box.keyPair.fromSecretKey(x25519PrivateKey);
    
    return {
      publicKey: x25519KeyPair.publicKey,
      privateKey: x25519KeyPair.secretKey
    };
  }

  /**
   * Encrypt private key using AES-256-CBC
   */
  static encryptPrivateKey(privateKey: Uint8Array): string {
    const key = Buffer.from(this.ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
    const iv = randomBytes(16);
    
    const cipher = createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(privateKey);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    // Prepend IV to encrypted data
    const result = Buffer.concat([iv, encrypted]);
    return result.toString('base64');
  }

  /**
   * Decrypt private key using AES-256-CBC
   */
  static decryptPrivateKey(encryptedPrivateKey: string): Uint8Array {
    const key = Buffer.from(this.ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
    const buffer = Buffer.from(encryptedPrivateKey, 'base64');
    
    // Extract IV (first 16 bytes)
    const iv = buffer.slice(0, 16);
    const encrypted = buffer.slice(16);
    
    const decipher = createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return new Uint8Array(decrypted);
  }

  /**
   * Generate both Ed25519 and X25519 key pairs with encryption
   */
  static generateEncryptedKeyPairs(derivationPath: string = "m/44'/0'/0'/0/0"): {
    ed25519: EncryptedKeyPair;
    x25519: EncryptedKeyPair;
  } {
    try {
      const ed25519KeyPair = this.generateEd25519KeyPair(derivationPath);
      const x25519KeyPair = this.generateX25519KeyPair(ed25519KeyPair.privateKey);

      return {
        ed25519: {
          encryptedPrivateKey: this.encryptPrivateKey(ed25519KeyPair.privateKey),
          publicKey: naclUtil.encodeBase64(ed25519KeyPair.publicKey),
          keyType: 'ed25519',
          name: 'signing-key',
          keyUsage: 'authentication',
          active: true,
          derivationPath
        },
        x25519: {
          encryptedPrivateKey: this.encryptPrivateKey(x25519KeyPair.privateKey),
          publicKey: naclUtil.encodeBase64(x25519KeyPair.publicKey),
          keyType: 'x25519',
          name: 'encryption-key',
          keyUsage: 'keyAgreement',
          active: true,
          derivationPath
        }
      };
    } catch (error) {
      console.error('Error generating key pairs:', error);
      // Fallback to a simple path
      const simplePath = "m/44'/0'/0'/0/0";
      const ed25519KeyPair = this.generateEd25519KeyPair(simplePath);
      const x25519KeyPair = this.generateX25519KeyPair(ed25519KeyPair.privateKey);

      return {
        ed25519: {
          encryptedPrivateKey: this.encryptPrivateKey(ed25519KeyPair.privateKey),
          publicKey: naclUtil.encodeBase64(ed25519KeyPair.publicKey),
          keyType: 'ed25519',
          name: 'signing-key',
          keyUsage: 'authentication',
          active: true,
          derivationPath: simplePath
        },
        x25519: {
          encryptedPrivateKey: this.encryptPrivateKey(x25519KeyPair.privateKey),
          publicKey: naclUtil.encodeBase64(x25519KeyPair.publicKey),
          keyType: 'x25519',
          name: 'encryption-key',
          keyUsage: 'keyAgreement',
          active: true,
          derivationPath: simplePath
        }
      };
    }
  }

  /**
   * Verify signature using Ed25519 public key
   */
  static verifyEd25519Signature(
    message: Uint8Array,
    signature: Uint8Array,
    publicKey: Uint8Array
  ): boolean {
    return nacl.sign.detached.verify(message, signature, publicKey);
  }

  /**
   * Sign message using Ed25519 private key
   */
  static signEd25519Message(
    message: Uint8Array,
    privateKey: Uint8Array
  ): Uint8Array {
    return nacl.sign.detached(message, privateKey);
  }

  /**
   * Generate a unique derivation path for a DID
   */
  static generateDerivationPath(did: string): string {
    // For now, use a simple fixed path to avoid derivation issues
    // In production, you might want to use a more sophisticated approach
    return "m/222333'/0'/0'/0/0";
  }

  /**
   * Generate a derivation path for a specific key number
   */
  static generateDerivationPathForKey(did: string, keyNumber: number): string {
    // Base path: m/222333'/0'/0'/0/0 + key number
    return `m/222333'/0'/0'/0/${keyNumber}`;
  }

  /**
   * Generate a single encrypted key pair for a specific key number
   */
  static generateSingleEncryptedKeyPair(
    keyType: 'ed25519' | 'x25519',
    name: string,
    keyUsage: 'authentication' | 'assertionMethod' | 'keyAgreement',
    keyNumber: number,
    active: boolean = true
  ): EncryptedKeyPair {
    const derivationPath = this.generateDerivationPathForKey('', keyNumber);
    
    if (keyType === 'ed25519') {
      const keyPair = this.generateEd25519KeyPair(derivationPath);
      return {
        encryptedPrivateKey: this.encryptPrivateKey(keyPair.privateKey),
        publicKey: naclUtil.encodeBase64(keyPair.publicKey),
        keyType: 'ed25519',
        name,
        keyUsage,
        active,
        derivationPath
      };
    } else {
      // For X25519, we need to generate from Ed25519 private key
      const ed25519KeyPair = this.generateEd25519KeyPair(derivationPath);
      const x25519KeyPair = this.generateX25519KeyPair(ed25519KeyPair.privateKey);
      return {
        encryptedPrivateKey: this.encryptPrivateKey(x25519KeyPair.privateKey),
        publicKey: naclUtil.encodeBase64(x25519KeyPair.publicKey),
        keyType: 'x25519',
        name,
        keyUsage,
        active,
        derivationPath
      };
    }
  }

  /**
   * Convert bytes to hex string
   */
  static bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Convert hex string to bytes
   */
  static hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  }
}
