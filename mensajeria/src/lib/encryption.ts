import { x25519 } from '@noble/curves/ed25519.js'
import { randomBytes } from '@noble/hashes/utils.js'

// AES-GCM encryption utilities
const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const IV_LENGTH = 12 // 96 bits for GCM

export interface EncryptedMessageData {
  encryptedContent: string
  iv: string
  tag: string
}

interface EncryptedMessageForDecryption {
  encryptedContent: string
  senderPublicKey: string
  algorithm: string
  iv: string
  tag: string
}

export interface KeyPair {
  privateKey: Uint8Array
  publicKey: Uint8Array
}

/**
 * Perform Diffie-Hellman key agreement
 */
export function performKeyAgreement(privateKey: Uint8Array, publicKey: Uint8Array): Uint8Array {
  return x25519.getSharedSecret(privateKey, publicKey)
}

/**
 * Derive encryption key from shared secret using HKDF
 */
async function deriveEncryptionKey(sharedSecret: Uint8Array): Promise<CryptoKey> {
  // Check if Web Crypto API is available
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    throw new Error('Web Crypto API is not available. Make sure you are running in a secure context (HTTPS or localhost).')
  }

  // Use Web Crypto API to derive key from shared secret
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    new Uint8Array(sharedSecret),
    { name: 'HKDF' },
    false,
    ['deriveKey']
  )

  return window.crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(32), // Zero salt for simplicity
      info: new TextEncoder().encode('x25519-aes-gcm')
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Encrypt message using AES-GCM
 */
async function encryptWithAES(plaintext: string, key: CryptoKey): Promise<{ encrypted: Uint8Array, iv: Uint8Array, tag: Uint8Array }> {
  // Check if Web Crypto API is available
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    throw new Error('Web Crypto API is not available. Make sure you are running in a secure context (HTTPS or localhost).')
  }

  const iv = randomBytes(IV_LENGTH)
  const encodedText = new TextEncoder().encode(plaintext)
  
  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv: new Uint8Array(iv)
    },
    key,
    encodedText
  )

  // Extract tag from encrypted data (last 16 bytes)
  const encryptedArray = new Uint8Array(encrypted)
  const tag = encryptedArray.slice(-16)
  const encryptedContent = encryptedArray.slice(0, -16)

  return {
    encrypted: encryptedContent,
    iv,
    tag
  }
}

/**
 * Decrypt message using AES-GCM
 */
async function decryptWithAES(encrypted: Uint8Array, iv: Uint8Array, tag: Uint8Array, key: CryptoKey): Promise<string> {
  // Check if Web Crypto API is available
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    throw new Error('Web Crypto API is not available. Make sure you are running in a secure context (HTTPS or localhost).')
  }

  // Combine encrypted content and tag
  const combined = new Uint8Array(encrypted.length + tag.length)
  combined.set(encrypted)
  combined.set(tag, encrypted.length)

  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: ALGORITHM,
      iv: new Uint8Array(iv)
    },
    key,
    combined
  )

  return new TextDecoder().decode(decrypted)
}

/**
 * Encrypt a message and return data suitable for database storage
 */
export async function encryptMessageForStorage(
  message: string,
  senderPrivateKey: Uint8Array,
  recipientPublicKey: Uint8Array
): Promise<{ encryptedData: string, senderPublicKey: string }> {
  try {
    // Perform key agreement
    const sharedSecret = performKeyAgreement(senderPrivateKey, recipientPublicKey)
    
    // Derive encryption key
    const encryptionKey = await deriveEncryptionKey(sharedSecret)
    
    // Encrypt the message
    const { encrypted, iv, tag } = await encryptWithAES(message, encryptionKey)
    
    // Get sender's public key
    const senderPublicKey = x25519.getPublicKey(senderPrivateKey)
    
    // Create data structure for database storage
    const encryptedData: EncryptedMessageData = {
      encryptedContent: uint8ArrayToBase64(encrypted),
      iv: uint8ArrayToBase64(iv),
      tag: uint8ArrayToBase64(tag)
    }
    
    return {
      encryptedData: JSON.stringify(encryptedData),
      senderPublicKey: uint8ArrayToHex(senderPublicKey)
    }
  } catch (error) {
    console.error('Error encrypting message for storage:', error)
    throw new Error('Failed to encrypt message')
  }
}

/**
 * Decrypt a message using Diffie-Hellman key agreement
 */
export async function decryptMessage(
  encryptedMessage: EncryptedMessageForDecryption,
  recipientPrivateKey: Uint8Array
): Promise<string> {
  try {
    // Convert hex strings back to Uint8Array
    const senderPublicKey = hexToUint8Array(encryptedMessage.senderPublicKey)
    const encryptedContent = base64ToUint8Array(encryptedMessage.encryptedContent)
    const iv = base64ToUint8Array(encryptedMessage.iv)
    const tag = base64ToUint8Array(encryptedMessage.tag)
    
    // Perform key agreement
    const sharedSecret = performKeyAgreement(recipientPrivateKey, senderPublicKey)
    
    // Derive encryption key
    const encryptionKey = await deriveEncryptionKey(sharedSecret)
    
    // Decrypt the message
    return await decryptWithAES(encryptedContent, iv, tag, encryptionKey)
  } catch (error) {
    console.error('Error decrypting message:', error)
    throw new Error('Failed to decrypt message')
  }
}

/**
 * Convert hex string to Uint8Array
 */
export function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16)
  }
  return bytes
}

/**
 * Convert Uint8Array to hex string
 */
export function uint8ArrayToHex(array: Uint8Array): string {
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Convert base64 string to Uint8Array
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

/**
 * Convert Uint8Array to base64 string
 */
export function uint8ArrayToBase64(array: Uint8Array): string {
  const binaryString = Array.from(array)
    .map(b => String.fromCharCode(b))
    .join('')
  return btoa(binaryString)
}
