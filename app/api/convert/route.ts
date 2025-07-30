import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Client-side conversion is used for privacy. This API route is not needed.' 
  }, { status: 200 })
} 