import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { encryptMessageForStorage, decryptMessage, hexToUint8Array, uint8ArrayToHex, EncryptedMessage, EncryptedMessageData } from '@/lib/encryption'
import { Message } from '@/types/chat'

interface ProfileKey {
  private_key: string
  public_key: string
}

export function useMessageEncryption() {
  const [isEncrypting, setIsEncrypting] = useState(false)
  const [isDecrypting, setIsDecrypting] = useState(false)

  /**
   * Get the keyAgreement key for a user
   */
  const getKeyAgreementKey = useCallback(async (userId: string) => {
    try {
      console.log('Fetching keyAgreement key for user:', userId)
      
      const { data, error } = await supabase
        .from('profile_keys')
        .select('private_key, public_key')
        .eq('profile_id', userId)
        .eq('key_usage', 'keyAgreement')
        .eq('curve_type', 'x25519')
        .limit(1)

      console.log('Query result:', { data, error })

      if (error) {
        console.error('Error fetching keyAgreement key:', error)
        return null
      }

      if (!data || data.length === 0) {
        console.warn('No keyAgreement key found for user:', userId)
        return null
      }

      const keyData = data[0] as ProfileKey
      return {
        privateKey: hexToUint8Array(keyData.private_key),
        publicKey: hexToUint8Array(keyData.public_key)
      }
    } catch (error) {
      console.error('Error getting keyAgreement key:', error)
      return null
    }
  }, [])

  /**
   * Get the public keyAgreement key for a user
   */
  const getPublicKeyAgreementKey = useCallback(async (userId: string) => {
    try {
      console.log('Fetching public keyAgreement key for user:', userId)
      
      const { data, error } = await supabase
        .from('profile_keys')
        .select('public_key')
        .eq('profile_id', userId)
        .eq('key_usage', 'keyAgreement')
        .eq('curve_type', 'x25519')
        .limit(1)

      console.log('Query result:', { data, error })

      if (error) {
        console.error('Error fetching public keyAgreement key:', error)
        return null
      }

      if (!data || data.length === 0) {
        console.warn('No keyAgreement key found for user:', userId)
        return null
      }

      return hexToUint8Array((data[0] as { public_key: string }).public_key)
    } catch (error) {
      console.error('Error getting public keyAgreement key:', error)
      return null
    }
  }, [])

  /**
   * Encrypt and send a message
   */
  const sendEncryptedMessage = useCallback(async (
    conversationId: string,
    senderId: string,
    recipientId: string,
    content: string
  ) => {
    setIsEncrypting(true)
    
    try {
      // Get sender's keyAgreement key
      const senderKeys = await getKeyAgreementKey(senderId)
      if (!senderKeys) {
        throw new Error('No keyAgreement key found for sender')
      }

      // Get recipient's public keyAgreement key
      const recipientPublicKey = await getPublicKeyAgreementKey(recipientId)
      if (!recipientPublicKey) {
        throw new Error('No public keyAgreement key found for recipient')
      }

      // Encrypt the message
      const { encryptedData, senderPublicKey } = await encryptMessageForStorage(
        content,
        senderKeys.privateKey,
        recipientPublicKey
      )

      // Store encrypted message in database
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          encrypted_content: encryptedData,
          sender_public_key: senderPublicKey,
          recipient_public_key: uint8ArrayToHex(recipientPublicKey),
          encryption_algorithm: 'x25519-aes-gcm',
          message_type: 'encrypted_text'
        } as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .select()
        .single()

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error('Error sending encrypted message:', error)
      throw error
    } finally {
      setIsEncrypting(false)
    }
  }, [getKeyAgreementKey, getPublicKeyAgreementKey])

  /**
   * Decrypt a message
   */
  const decryptMessageContent = useCallback(async (
    message: Message,
    currentUserId: string
  ): Promise<string> => {
    console.log('Decrypting message:', {
      messageId: message.id,
      hasEncryptedContent: !!message.encrypted_content,
      hasSenderPublicKey: !!message.sender_public_key,
      senderPublicKey: message.sender_public_key?.substring(0, 16) + '...',
      currentUserId,
      senderId: message.sender_id
    })

    if (!message.encrypted_content || !message.sender_public_key) {
      // Return original content if not encrypted
      console.log('Message not encrypted, returning original content')
      return message.content || ''
    }

    setIsDecrypting(true)
    
    try {
      // Determine which user's keys to use for decryption
      let decryptionKeys
      let otherUserPublicKey
      
      if (message.sender_id === currentUserId) {
        // If this is the sender's own message, use sender's private key + recipient's public key
        console.log('Decrypting own message')
        
        // Get sender's private key
        decryptionKeys = await getKeyAgreementKey(currentUserId)
        if (!decryptionKeys) {
          throw new Error('No keyAgreement key found for sender')
        }
        
        // Use the recipient's public key that was stored when the message was sent
        if (!message.recipient_public_key) {
          console.warn('No recipient public key found for own message - this may be an old message')
          // For old messages without recipient_public_key, we can't decrypt them
          // Return a placeholder message
          return '[Mensaje cifrado - No se puede descifrar mensaje antiguo]'
        }
        otherUserPublicKey = hexToUint8Array(message.recipient_public_key)
        
      } else {
        // If this is a message from someone else, use current user's private key + sender's public key
        console.log('Decrypting message from another user')
        console.log('Current user ID for decryption:', currentUserId)
        
        decryptionKeys = await getKeyAgreementKey(currentUserId)
        console.log('Decryption keys result:', {
          hasKeys: !!decryptionKeys,
          currentUserId
        })
        
        if (!decryptionKeys) {
          throw new Error('No keyAgreement key found for current user')
        }
        
        // Use the sender's public key
        otherUserPublicKey = hexToUint8Array(message.sender_public_key)
      }

      console.log('Decryption keys found:', {
        hasPrivateKey: !!decryptionKeys.privateKey,
        hasPublicKey: !!decryptionKeys.publicKey
      })

      // Parse encrypted data from JSON
      let encryptedData: EncryptedMessageData
      try {
        encryptedData = JSON.parse(message.encrypted_content)
        console.log('Encrypted data parsed successfully')
      } catch (parseError) {
        console.error('Error parsing encrypted data:', parseError)
        throw new Error('Invalid encrypted message format')
      }

      // Create encrypted message object with the correct public key for decryption
      const encryptedMessage: EncryptedMessage = {
        encryptedContent: encryptedData.encryptedContent,
        senderPublicKey: uint8ArrayToHex(otherUserPublicKey), // Use the other user's public key for decryption
        algorithm: message.encryption_algorithm || 'x25519-aes-gcm',
        iv: encryptedData.iv,
        tag: encryptedData.tag
      }

      console.log('Attempting decryption with:', {
        otherUserPublicKey: encryptedMessage.senderPublicKey.substring(0, 16) + '...',
        algorithm: encryptedMessage.algorithm,
        isOwnMessage: message.sender_id === currentUserId
      })

      // Decrypt the message
      const decryptedContent = await decryptMessage(encryptedMessage, decryptionKeys.privateKey)
      console.log('Message decrypted successfully')
      return decryptedContent
    } catch (error) {
      console.error('Error decrypting message:', error)
      return '[Mensaje cifrado - Error al descifrar]'
    } finally {
      setIsDecrypting(false)
    }
  }, [getKeyAgreementKey])

  /**
   * Check if a user has keyAgreement keys set up
   */
  const hasKeyAgreementKeys = useCallback(async (userId: string): Promise<boolean> => {
    try {
      console.log('Checking keyAgreement keys for user:', userId)
      
      const { data, error } = await supabase
        .from('profile_keys')
        .select('id')
        .eq('profile_id', userId)
        .eq('key_usage', 'keyAgreement')
        .eq('curve_type', 'x25519')

      console.log('KeyAgreement keys query result:', { data, error })

      if (error) {
        console.error('Error checking keyAgreement keys:', error)
        return false
      }

      const hasKeys = data && data.length > 0
      console.log('User has keyAgreement keys:', hasKeys)
      return hasKeys
    } catch (error) {
      console.error('Error checking keyAgreement keys:', error)
      return false
    }
  }, [])

  return {
    sendEncryptedMessage,
    decryptMessageContent,
    hasKeyAgreementKeys,
    isEncrypting,
    isDecrypting
  }
}
