'use client'

import { useState, useEffect } from 'react'
import { X, Key, User, Save, AlertCircle, Shuffle, Plus, Trash2 } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { generateMnemonic, mnemonicToSeedSync } from '@scure/bip39'
import { wordlist } from '@scure/bip39/wordlists/english'
import { HDKey } from '@scure/bip32'
import { ed25519, x25519 } from '@noble/curves/ed25519.js'
import AddKeyDialog from './AddKeyDialog'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface ProfileDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}


export default function ProfileDialog({ isOpen, onClose, onSuccess }: ProfileDialogProps) {
  const [mnemonic, setMnemonic] = useState('')
  const [did, setDid] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [profileKeys, setProfileKeys] = useState<any[]>([])
  const [showAddKeyDialog, setShowAddKeyDialog] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>('')

  const generateNewMnemonic = () => {
    const newMnemonic = generateMnemonic(wordlist)
    setMnemonic(newMnemonic)
  }

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setCurrentUserId(user.id)
    console.log('Loading profile for user:', user.id)
    
    const { data, error } = await supabase
      .from('profiles')
      .select('mnemonic, did')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error loading profile:', error)
      return
    }

    console.log('Profile loaded:', data)
    if (data?.mnemonic) {
      setMnemonic(data.mnemonic)
    }
    if (data?.did) {
      setDid(data.did)
    }
  }

  const loadProfileKeys = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setCurrentUserId(user.id)
    console.log('Loading profile keys for user:', user.id)
    const { data, error } = await supabase
      .from('profile_keys')
      .select('*')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error loading profile keys:', error)
      return
    }

    console.log('Profile keys loaded:', data)
    setProfileKeys(data || [])
  }

  const handleAddKeySuccess = () => {
    loadProfileKeys()
  }

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta clave?')) {
      return
    }

    const { error } = await supabase
      .from('profile_keys')
      .delete()
      .eq('id', keyId)

    if (error) {
      console.error('Error deleting key:', error)
      setMessage({ type: 'error', text: 'Error eliminando la clave' })
      return
    }

    // Reload keys after deletion
    loadProfileKeys()
    setMessage({ type: 'success', text: 'Clave eliminada exitosamente' })
  }

  const regenerateAllKeys = async () => {
    if (!mnemonic.trim() || !currentUserId) {
      return
    }

    try {
      // Get all existing keys to regenerate them
      const { data: existingKeys, error: fetchError } = await supabase
        .from('profile_keys')
        .select('*')
        .eq('profile_id', currentUserId)

      if (fetchError) {
        console.error('Error fetching existing keys:', fetchError)
        return
      }

      if (!existingKeys || existingKeys.length === 0) {
        return // No keys to regenerate
      }

      // Generate seed from mnemonic
      const seed = mnemonicToSeedSync(mnemonic)
      const hdkey = HDKey.fromMasterSeed(seed)

      // Delete all existing keys
      const { error: deleteError } = await supabase
        .from('profile_keys')
        .delete()
        .eq('profile_id', currentUserId)

      if (deleteError) {
        console.error('Error deleting existing keys:', deleteError)
        return
      }

      // Regenerate all keys with the new mnemonic
      const keyInserts = []
      for (const existingKey of existingKeys) {
        const derivedKey = hdkey.derive(existingKey.derived_path)
        if (!derivedKey.privateKey) {
          console.error(`No se pudo derivar la clave para ${existingKey.derived_path}`)
          continue
        }

        let publicKey: Uint8Array
        let privateKey: Uint8Array

        if (existingKey.curve_type === 'ed25519') {
          privateKey = derivedKey.privateKey
          publicKey = ed25519.getPublicKey(privateKey)
        } else {
          privateKey = derivedKey.privateKey
          publicKey = x25519.getPublicKey(privateKey)
        }

        keyInserts.push({
          profile_id: currentUserId,
          derived_path: existingKey.derived_path,
          curve_type: existingKey.curve_type,
          key_usage: existingKey.key_usage,
          public_key: Buffer.from(publicKey).toString('hex'),
          private_key: Buffer.from(privateKey).toString('hex')
        })
      }

      // Insert regenerated keys
      if (keyInserts.length > 0) {
        const { error: insertError } = await supabase
          .from('profile_keys')
          .insert(keyInserts)

        if (insertError) {
          console.error('Error inserting regenerated keys:', insertError)
          setMessage({ type: 'error', text: 'Error regenerando las claves' })
          return
        }
      }

      // Reload keys
      loadProfileKeys()
      setMessage({ type: 'success', text: 'Claves regeneradas exitosamente con el nuevo mnemónico' })

    } catch (error) {
      console.error('Error regenerating keys:', error)
      setMessage({ type: 'error', text: 'Error regenerando las claves' })
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadProfile()
      loadProfileKeys()
    }
  }, [isOpen])

  // Regenerate keys when mnemonic changes (but not on initial load)
  useEffect(() => {
    if (isOpen && mnemonic.trim() && profileKeys.length > 0) {
      const timeoutId = setTimeout(() => {
        regenerateAllKeys()
      }, 1000) // Wait 1 second after mnemonic change

      return () => clearTimeout(timeoutId)
    }
  }, [mnemonic])


  const saveProfile = async () => {
    if (!mnemonic.trim() || !did.trim()) {
      setMessage({ type: 'error', text: 'Por favor, completa todos los campos antes de guardar' })
      return
    }

    setIsGenerating(true)
    setMessage(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Usuario no autenticado')
      }

      // Create basic DID document
      const didDocument = {
        "@context": ["https://www.w3.org/ns/did/v1"],
        "id": did
      }

      // Update profile with mnemonic, DID and DID document
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          mnemonic: mnemonic,
          did: did,
          diddocument: didDocument
        })
        .eq('id', user.id)

      if (profileError) {
        throw new Error(`Error actualizando perfil: ${profileError.message}`)
      }

      setMessage({ type: 'success', text: 'Perfil guardado exitosamente' })
      
      // Close dialog after success
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 2000)

    } catch (error) {
      console.error('Error saving profile:', error)
      setMessage({ type: 'error', text: `Error guardando perfil: ${error instanceof Error ? error.message : 'Error desconocido'}` })
    } finally {
      setIsGenerating(false)
    }
  }

  const resetForm = () => {
    setMnemonic('')
    setDid('')
    setMessage(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <User className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Configurar Perfil DID
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Message Display */}
          {message && (
            <div className={`p-3 rounded-lg flex items-center space-x-2 ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          )}

          {/* Mnemonic Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Mnemónico (12-24 palabras)
            </label>
            <div className="flex space-x-2">
              <textarea
                value={mnemonic}
                onChange={(e) => setMnemonic(e.target.value)}
                placeholder="Ingresa tu mnemónico o genera uno nuevo"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                rows={3}
              />
              <button
                onClick={generateNewMnemonic}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
                title="Generar mnemónico aleatorio"
              >
                <Shuffle className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* DID Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              DID
            </label>
            <input
              type="text"
              value={did}
              onChange={(e) => setDid(e.target.value)}
              placeholder="did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
          </div>


          {/* Profile Keys Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">Claves del Perfil</h3>
              <button
                type="button"
                onClick={() => {
                  console.log('Add clave button clicked')
                  setShowAddKeyDialog(true)
                }}
                disabled={!mnemonic.trim()}
                className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title={!mnemonic.trim() ? 'Primero debes ingresar un mnemónico' : 'Agregar nueva clave'}
              >
                <Plus className="w-4 h-4" />
                <span>Add clave</span>
              </button>
            </div>
            
            {profileKeys.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        Uso
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        Curva
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        Ruta
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        Clave Pública
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        Clave Privada
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {profileKeys.map((key, index) => (
                      <tr key={key.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-2 text-sm text-black border-b">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {key.key_usage}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-sm text-black border-b">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {key.curve_type}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-sm text-black border-b font-mono">
                          {key.derived_path}
                        </td>
                        <td className="px-3 py-2 text-sm text-black border-b font-mono">
                          <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                            {key.public_key.substring(0, 20)}...
                          </code>
                        </td>
                        <td className="px-3 py-2 text-sm text-black border-b font-mono">
                          <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                            {key.private_key.substring(0, 20)}...
                          </code>
                        </td>
                        <td className="px-3 py-2 text-sm text-black border-b">
                          <button
                            onClick={() => handleDeleteKey(key.id)}
                            className="flex items-center space-x-1 px-2 py-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                            title="Eliminar clave"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="text-xs">Eliminar</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg bg-gray-50">
                <Key className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="font-medium">No hay claves agregadas</p>
                <p className="text-sm">Haz clic en &quot;Add clave&quot; para agregar una nueva clave</p>
              </div>
            )}
            
            <p className="text-xs text-gray-500">
              Claves criptográficas del perfil
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={saveProfile}
            disabled={isGenerating}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Perfil</span>
          </button>
        </div>
      </div>

      {/* AddKeyDialog */}
      {showAddKeyDialog && currentUserId && (
        <AddKeyDialog
          isOpen={showAddKeyDialog}
          onClose={() => setShowAddKeyDialog(false)}
          onSuccess={handleAddKeySuccess}
          profileId={currentUserId}
        />
      )}
    </div>
  )
}

