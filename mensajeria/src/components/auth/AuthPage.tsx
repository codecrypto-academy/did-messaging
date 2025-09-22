'use client'

import { useState } from 'react'
import LoginForm from './LoginForm'
import SignUpForm from './SignUpForm'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">💬 WhatsApp Clone</h1>
          <p className="mt-2 text-sm text-gray-600">
            Conecta con tus amigos en tiempo real
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 text-center rounded-l-md transition-colors ${
                isLogin
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 text-center rounded-r-md transition-colors ${
                !isLogin
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Registrarse
            </button>
          </div>

          {isLogin ? <LoginForm /> : <SignUpForm />}
        </div>
      </div>
    </div>
  )
}