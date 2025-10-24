'use server'

import { cookies } from 'next/headers'

const COOKIE_NAME = 'glister_auth_token'
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 // 7 days in seconds

export async function setAuthCookie(token: string) {
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })
}

export async function removeAuthCookie() {
  cookies().delete(COOKIE_NAME)
}

export async function getAuthCookie() {
  const cookie = cookies().get(COOKIE_NAME)
  return cookie?.value || null
}

