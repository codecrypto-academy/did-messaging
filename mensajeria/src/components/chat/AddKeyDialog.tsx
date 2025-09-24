'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Key, Plus } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { mnemonicToSeedSync } from '@scure/bip39'
import { HDKey } from '@scure/bip32'
import { ed25519, x25519 } from '@noble/curves/ed25519.js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface AddKeyDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  profileId: string
}

export default function AddKeyDialog({ isOpen, onClose, onSuccess, profileId }: AddKeyDialogProps) {
  const [formData, setFormData] = useState({
    derived_path: "m/44'/0'/0'/0/0",
    curve_type: 'ed25519',
    key_usage: 'authorization'
  })
  const [mnemonic, setMnemonic] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const loadProfileMnemonic = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('mnemonic')
        .eq('id', profileId)
        .single()

      if (error) {
        console.error('Error loading mnemonic:', error)
        setMessage({ type: 'error', text: 'Error cargando el mnemónico del perfil' })
        return
      }

      if (data?.mnemonic) {
        setMnemonic(data.mnemonic)
      } else {
        setMessage({ type: 'error', text: 'No se encontró mnemónico en el perfil. Configura primero el perfil DID.' })
      }
    } catch (error) {
      console.error('Error loading mnemonic:', error)
      setMessage({ type: 'error', text: 'Error cargando el mnemónico del perfil' })
    }
  }, [profileId])

  // Load mnemonic from profile when dialog opens
  useEffect(() => {
    if (isOpen && profileId) {
      loadProfileMnemonic()
    }
  }, [isOpen, profileId, loadProfileMnemonic])

  const generateKeys = (mnemonic: string, derivedPath: string, curveType: string) => {
    try {
      const seed = mnemonicToSeedSync(mnemonic)
      const hdkey = HDKey.fromMasterSeed(seed)
      const derivedKey = hdkey.derive(derivedPath)
      
      if (!derivedKey.privateKey) {
        throw new Error('No se pudo derivar la clave privada')
      }

      const privateKey = Buffer.from(derivedKey.privateKey).toString('hex')
      let publicKey: string

      if (curveType === 'ed25519') {
        const pubKey = ed25519.getPublicKey(derivedKey.privateKey)
        publicKey = Buffer.from(pubKey).toString('hex')
      } else if (curveType === 'x25519') {
        const pubKey = x25519.getPublicKey(derivedKey.privateKey)
        publicKey = Buffer.from(pubKey).toString('hex')
      } else {
        throw new Error('Tipo de curva no soportado')
      }

      return { privateKey, publicKey }
    } catch (error) {
      console.error('Error generating keys:', error)
      throw new Error(`Error generando claves: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.derived_path.trim() || !mnemonic.trim()) {
      setMessage({ type: 'error', text: 'Por favor, completa todos los campos requeridos' })
      return
    }

    setIsSaving(true)
    setMessage(null)

    try {
      // Generate keys automatically from mnemonic
      const { privateKey, publicKey } = generateKeys(mnemonic, formData.derived_path, formData.curve_type)

      const { error } = await supabase
        .from('profile_keys')
        .insert({
          profile_id: profileId,
          derived_path: formData.derived_path,
          curve_type: formData.curve_type,
          key_usage: formData.key_usage,
          public_key: publicKey,
          private_key: privateKey
        })

      if (error) {
        throw error
      }

      setMessage({ type: 'success', text: 'Clave agregada exitosamente' })
      setTimeout(() => {
        onSuccess()
        onClose()
        resetForm()
      }, 1000)
    } catch (error: unknown) {
      console.error('Error adding key:', error)
      setMessage({ type: 'error', text: (error as Error).message || 'Error al agregar la clave' })
    } finally {
      setIsSaving(false)
    }
  }

  const resetForm = () => {
    setFormData({
      derived_path: "m/44'/0'/0'/0/0",
      curve_type: 'ed25519',
      key_usage: 'authorization'
    })
    setMnemonic('')
    setMessage(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Key className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Agregar Clave</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {message && (
            <div className={`p-3 rounded-lg flex items-center space-x-2 ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                message.type === 'success' ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ruta Derivada *
            </label>
            <input
              type="text"
              value={formData.derived_path}
              onChange={(e) => setFormData(prev => ({ ...prev, derived_path: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              placeholder="m/44'/0'/0'/0/0"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Curva *
            </label>
            <select
              value={formData.curve_type}
              onChange={(e) => setFormData(prev => ({ ...prev, curve_type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            >
              <option value="ed25519">ed25519</option>
              <option value="x25519">x25519</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Uso de la Clave *
            </label>
            <select
              value={formData.key_usage}
              onChange={(e) => setFormData(prev => ({ ...prev, key_usage: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            >
              <option value="authorization">authorization</option>
              <option value="keyAgreement">keyAgreement</option>
              <option value="assertion">assertion</option>
            </select>
          </div>


          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>{isSaving ? 'Agregando...' : 'Agregar Clave'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
