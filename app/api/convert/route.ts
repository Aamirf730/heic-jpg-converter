import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
}

function withCors(response: NextResponse) {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => response.headers.set(k, v))
  return response
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }))
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.toLowerCase().includes('multipart/form-data')) {
      return withCors(NextResponse.json({ error: 'Expected multipart/form-data with a file field named "file"' }, { status: 400 }))
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return withCors(NextResponse.json({ error: 'Missing file field "file"' }, { status: 400 }))
    }

    const originalName = (file as any).name || 'input.heic'
    const arrayBuffer = await file.arrayBuffer()
    const inputBuffer = Buffer.from(arrayBuffer)

    // Lazy-load to avoid increasing cold-start cost
    const heicDecodeModule: any = await import('heic-decode')
    const heicDecode = heicDecodeModule.default || heicDecodeModule
    const jpegModule: any = await import('jpeg-js')
    const jpeg = jpegModule.default || jpegModule

    let decoded
    try {
      decoded = await heicDecode({ buffer: inputBuffer })
    } catch (err) {
      return withCors(NextResponse.json({ error: 'Failed to decode HEIC/HEIF image', details: String(err) }, { status: 422 }))
    }

    const width: number = decoded.width
    const height: number = decoded.height
    const rgba: Uint8Array = decoded.data

    // Convert RGBA to RGB (drop alpha)
    const rgb = Buffer.allocUnsafe(width * height * 3)
    for (let i = 0, j = 0; i < rgba.length; i += 4, j += 3) {
      rgb[j] = rgba[i]      // R
      rgb[j + 1] = rgba[i + 1]  // G
      rgb[j + 2] = rgba[i + 2]  // B
    }

    const quality = 0.9
    const jpegData = jpeg.encode({ data: rgb, width, height }, Math.round(quality * 100))
    const outputBuffer: Buffer = Buffer.from(jpegData.data)

    const outName = originalName.replace(/\.[^.]+$/, '') + '.jpg'

    const headers = new Headers({
      'Content-Type': 'image/jpeg',
      'Content-Disposition': `inline; filename="${outName}"`,
      'Cache-Control': 'no-store',
    })
    Object.entries(CORS_HEADERS).forEach(([k, v]) => headers.set(k, v))

    return new NextResponse(outputBuffer, { status: 200, headers })
  } catch (error: any) {
    return withCors(NextResponse.json({ error: 'Unexpected server error', details: String(error?.message || error) }, { status: 500 }))
  }
} 