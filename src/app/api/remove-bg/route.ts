import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  console.log('📍 API route called');
  console.log('📋 Content-Type:', request.headers.get('content-type'));
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    console.log('📁 File received:', file?.name, file?.type, file?.size);

    if (!file) {
      console.log('❌ No file provided');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      console.log('❌ Invalid file type:', file.type);
      return NextResponse.json(
        { error: 'Invalid file type. Please upload PNG, JPG, or WEBP.' },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      console.log('❌ File too large:', file.size);
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Get API key from environment
    const apiKey = process.env.REMOVEBG_API_KEY;
    console.log('🔑 API Key configured:', !!apiKey);
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured. Please set REMOVEBG_API_KEY environment variable.' },
        { status: 500 }
      );
    }

    // Convert file to base64 (Edge Runtime compatible way)
    const buffer = await file.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(buffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ''
      )
    );

    console.log('📤 Calling Remove.bg API...');

    // Call Remove.bg API using form-data format
    const formDataForApi = new FormData();
    formDataForApi.append('image_file_b64', base64);
    formDataForApi.append('size', 'auto');

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
      },
      body: formDataForApi,
    });

    console.log('📥 Remove.bg response:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Remove.bg API error:', errorText);
      return NextResponse.json(
        { error: `Remove.bg API error: ${response.status}` },
        { status: response.status }
      );
    }

    // Return the processed image
    const resultBuffer = await response.arrayBuffer();
    console.log('✅ Image processed successfully, size:', resultBuffer.byteLength);
    
    return new NextResponse(resultBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="bg-removed.png"',
      },
    });
  } catch (error) {
    console.error('❌ Error processing image:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request (CORS preflight)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
