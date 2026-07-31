// Admin configuration - store admin password hash and authorized addresses
// In production, store the password hash securely in environment variables

export const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123"

// Authorized admin wallet addresses (will be checked against contract owner/isAdmin)
export const AUTHORIZED_ADMINS = [
  // Add addresses here that should have admin access
  // These will be verified against the contract's owner() and isAdmin() functions
] as const
