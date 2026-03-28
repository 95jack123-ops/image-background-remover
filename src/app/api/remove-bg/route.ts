import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    // 获取 API key
    const apiKey = process.env.REMOVEBG_API_KEY;
    console.log('API Key exists:', !!apiKey);
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured. Please set REMOVEBG_API_KEY environment variable.' },
        { status: 500 }
      );
    }

    const contentType = request.headers.get('content-type') || '';
    console.log('Content-Type:', contentType);
    
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Invalid Content-Type. Expected multipart/form-data, got: ' + contentType },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    console.log('File received:', file?.name, file?.type, file?.size);

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided. Make sure the form field is named "file".' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type: ' + file.type + '. Please upload PNG, JPG, or WEBP.' },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large: ' + (file.size / 1024 / 1024).toFixed(2) + 'MB. Maximum is 10MB.' },
        { status: 400 }
      );
    }

    // 读取文件为 ArrayBuffer
    const fileBuffer = await file.arrayBuffer();
    console.log('File buffer size:', fileBuffer.byteLength);

    // 创建发送给 Remove.bg 的 FormData
    const apiFormData = new FormData();
    
    // 使用 Blob 而不是 File
    const blob = new Blob([fileBuffer], { type: file.type });
    apiFormData.append('image_file_b64', await blobToBase64(blob));
    apiFormData.append('size', 'auto');

    console.log('Calling Remove.bg API...');
    
    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
      },
      body: apiFormData,
    });

    console.log('Remove.bg response:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Remove.bg API error:', errorText);
      
      let errorMessage = 'Failed to process image';
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.errors && errorJson.errors[0]) {
          errorMessage = errorJson.errors[0].title || errorMessage;
        }
      } catch {
        errorMessage = errorText.substring(0, 200);
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    // Return the processed image
    const resultBuffer = await response.arrayBuffer();
    console.log('Success! Result size:', resultBuffer.byteLength);
    
    return new NextResponse(resultBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="bg-removed.png"',
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Helper function to convert Blob to base64
async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

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
