import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  console.log('📍 API route called');
  console.log('📋 Content-Type:', request.headers.get('content-type'));
  
  try {
    // 尝试读取请求体
    const contentType = request.headers.get('content-type') || '';
    
    if (!contentType.includes('multipart/form-data')) {
      console.log('❌ Invalid Content-Type:', contentType);
      return NextResponse.json(
        { error: 'Invalid Content-Type. Expected multipart/form-data.' },
        { status: 400 }
      );
    }

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
    
    // Convert file to base64
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    console.log('📤 Calling Remove.bg API...');
    console.log('📊 Base64 length:', base64.length);

    // Call Remove.bg API using form-data format
    const formDataForApi = new FormData();
    formDataForApi.append('image_file_b64', base64);
    formDataForApi.append('size', 'auto');

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey || '',
      },
      body: formDataForApi,
    });

    console.log('📥 Remove.bg response:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Remove.bg API error:', errorText);
      return NextResponse.json(
        { error: `Remove.bg API error: ${response.status} - ${errorText}` },
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

// 处理 OPTIONS 请求（CORS preflight）
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
