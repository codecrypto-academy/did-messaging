'use client'

import { Database, AlertCircle, Play } from 'lucide-react'

interface DatabaseErrorProps {
  onRetry: () => void
}

export default function DatabaseError({ onRetry }: DatabaseErrorProps) {
  return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <Database className="w-8 h-8 text-red-600" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Base de Datos No Configurada
        </h2>
        
        <p className="text-gray-600 mb-6">
          La base de datos de Supabase no está configurada o no está ejecutándose. 
          Necesitas configurar la base de datos local antes de usar la aplicación.
        </p>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-left">
              <h3 className="text-sm font-medium text-yellow-800 mb-2">
                Pasos para configurar:
              </h3>
              <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
                <li>Ejecuta: <code className="bg-yellow-100 px-1 rounded">npm run setup</code></li>
                <li>O ejecuta: <code className="bg-yellow-100 px-1 rounded">./setup-local-supabase.sh</code></li>
                <li>Espera a que Supabase se inicie completamente</li>
                <li>Recarga esta página</li>
              </ol>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={onRetry}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Play className="w-5 h-5" />
            <span>Reintentar Conexión</span>
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Recargar Página
          </button>
        </div>
        
        <div className="mt-6 text-xs text-gray-500">
          <p>Si el problema persiste, verifica que:</p>
          <ul className="mt-2 space-y-1">
            <li>• Supabase CLI esté instalado</li>
            <li>• El puerto 54321 esté disponible</li>
            <li>• Docker esté ejecutándose (si usas Docker)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
