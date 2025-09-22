'use client'

import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import Navbar from '@/components/Navbar'
import { didAPI, DID, CreateDIDRequest } from '@/lib/did-api'

export default function DashboardPage() {
  const [dids, setDids] = useState<DID[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedDID, setSelectedDID] = useState<DID | null>(null)

  const [createForm, setCreateForm] = useState<CreateDIDRequest>({
    keyType: 'ed25519',
    purpose: 'authentication',
    didName: ''
  })

  useEffect(() => {
    loadDIDs()
  }, [])

  const loadDIDs = async () => {
    try {
      setError('')
      const response = await didAPI.getDIDs()
      // Asegurar que response es un array
      setDids(Array.isArray(response) ? response : [])
    } catch (error: any) {
      setError(error.message || 'Error al cargar DIDs')
      setDids([]) // Asegurar que dids sea un array vacío en caso de error
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDID = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError('')

    try {
      const newDID = await didAPI.createDID(createForm)
      setDids([...dids, newDID])
      setShowCreateForm(false)
      setCreateForm({ keyType: 'ed25519', purpose: 'authentication', didName: '' })
    } catch (error: any) {
      setError(error.message || 'Error al crear DID')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteDID = async (didString: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este DID?')) return

    try {
      await didAPI.deleteDID(didString)
      setDids(dids.filter(did => did.did !== didString))
      if (selectedDID?.did === didString) {
        setSelectedDID(null)
      }
    } catch (error: any) {
      setError(error.message || 'Error al eliminar DID')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Dashboard de DIDs</h1>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Crear DID
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Mis DIDs ({Array.isArray(dids) ? dids.length : 0})</h2>

                {!Array.isArray(dids) || dids.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No hay DIDs</h3>
                    <p className="mt-1 text-sm text-gray-500">Comienza creando tu primer DID.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(Array.isArray(dids) ? dids : []).map((did) => (
                      <div
                        key={did.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedDID?.id === did.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedDID(did)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {did.did}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Creado: {new Date(did.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteDID(did.did)
                            }}
                            className="text-red-600 hover:text-red-800 ml-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Detalles del DID</h2>

                {selectedDID ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">DID</label>
                      <div className="flex">
                        <input
                          type="text"
                          value={selectedDID.did}
                          readOnly
                          className="flex-1 p-2 border border-gray-300 rounded-l-md bg-gray-50 text-sm"
                        />
                        <button
                          onClick={() => copyToClipboard(selectedDID.did)}
                          className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-200"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Clave Pública</label>
                      <div className="flex">
                        <textarea
                          value={selectedDID.public_key}
                          readOnly
                          rows={3}
                          className="flex-1 p-2 border border-gray-300 rounded-l-md bg-gray-50 text-sm resize-none"
                        />
                        <button
                          onClick={() => copyToClipboard(selectedDID.public_key)}
                          className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-200"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Clave Privada</label>
                      <div className="flex">
                        <textarea
                          value={selectedDID.private_key}
                          readOnly
                          rows={3}
                          className="flex-1 p-2 border border-gray-300 rounded-l-md bg-gray-50 text-sm resize-none"
                        />
                        <button
                          onClick={() => copyToClipboard(selectedDID.private_key)}
                          className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-200"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">DID Document</label>
                      <textarea
                        value={JSON.stringify(selectedDID.did_document, null, 2)}
                        readOnly
                        rows={8}
                        className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-sm resize-none font-mono"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Selecciona un DID</h3>
                    <p className="mt-1 text-sm text-gray-500">Elige un DID de la lista para ver sus detalles.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Crear Nuevo DID</h3>

            <form onSubmit={handleCreateDID} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del DID
                </label>
                <input
                  type="text"
                  value={createForm.didName}
                  onChange={(e) => setCreateForm({...createForm, didName: e.target.value})}
                  placeholder="did:web:user/alice"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ejemplo: did:web:user/alice, did:example:123abc
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  {creating ? 'Creando...' : 'Crear DID'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ProtectedRoute>
  )
}