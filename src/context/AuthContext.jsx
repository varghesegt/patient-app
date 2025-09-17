import React, { createContext } from 'react'
export const AuthContext = createContext({ user: { name: 'Demo Patient' } })
export function AuthProvider({ children }){ return <AuthContext.Provider value={{ user: { name: 'Demo Patient' } }}>{children}</AuthContext.Provider> }
