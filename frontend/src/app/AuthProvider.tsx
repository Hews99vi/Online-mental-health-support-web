/**
 * AuthProvider.tsx
 *
 * Public-API shim that satisfies the spec:
 *   import { AuthProvider } from 'src/app/AuthProvider'
 *   import { useAuth }     from 'src/app/useAuth'
 *
 * The implementation lives in AuthContext.tsx.  This file simply
 * re-exports so callers can use either import path.
 */
export { AuthProvider, useAuth } from './AuthContext';
