const API_BASE_URL = process.env.NEXT_PUBLIC_DID_API_URL || 'http://localhost:3000'

export interface DID {
  id: string
  did: string
  did_document: any
  private_key: string
  public_key: string
  created_at: string
  updated_at: string
}

export interface CreateDIDRequest {
  keyType: 'ed25519' | 'secp256k1'
  purpose: string
  didName?: string
  metadata?: any
}

export const didAPI = {
  // Health check
  health: async (): Promise<{ status: string; timestamp: string }> => {
    const response = await fetch(`${API_BASE_URL}/health`)
    if (!response.ok) throw new Error('Health check failed')
    return response.json()
  },

  // Get all DIDs
  getDIDs: async (): Promise<DID[]> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/dids`)
    if (!response.ok) throw new Error('Failed to fetch DIDs')
    return response.json()
  },

  // Get DID by ID
  getDID: async (id: string): Promise<DID> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/dids/${id}`)
    if (!response.ok) throw new Error('Failed to fetch DID')
    return response.json()
  },

  // Create new DID
  createDID: async (data: CreateDIDRequest): Promise<DID> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/dids/simple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to create DID')
    return response.json()
  },

  // Delete DID
  deleteDID: async (did: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/dids/${encodeURIComponent(did)}`, {
      method: 'DELETE',
    })
    if (!response.ok) throw new Error('Failed to delete DID')
  },
}