import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export async function POST(request: NextRequest) {
  try {
    // Fail closed if the server isn't configured with a password.
    if (!ADMIN_PASSWORD) {
      console.error('[admin] ADMIN_PASSWORD env var is not set')
      return NextResponse.json({ error: 'Admin login is not configured' }, { status: 500 })
    }

    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }

    if (password !== ADMIN_PASSWORD) {
      await new Promise((resolve) => setTimeout(resolve, 500))
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    // Generate session token
    const token = generateToken()

    // Create response with secure session cookie
    const response = NextResponse.json({ token })
    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 4, // 4 hours
      path: '/admin',
    })

    return response
  } catch (error) {
    console.error('[admin] Password verification error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
