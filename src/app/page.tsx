'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';

export default function Home() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const handleFileSelect = useCallback(async (file: File) => {
    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please upload PNG, JPG, or WEBP.');
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File too large. Maximum size is 10MB.');
      return;
    }

    setError(null);
    setProcessedImage(null);
    setFileName(file.name);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Process image
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/remove-bg', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to process image');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setProcessedImage(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleDownload = useCallback(() => {
    if (!processedImage) return;
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = 'bg-removed.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [processedImage]);

  const handleReset = useCallback(() => {
    setOriginalImage(null);
    setProcessedImage(null);
    setError(null);
    setFileName('');
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            ✨ Background Remover
          </h1>
          <p className="text-xl text-gray-300">
            Remove image backgrounds instantly with AI
          </p>
        </header>

        {/* Main Content */}
        {!originalImage ? (
          // Upload Area
          <div className="max-w-2xl mx-auto">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-purple-500/50 rounded-2xl p-16 text-center bg-slate-800/50 backdrop-blur-sm hover:border-purple-400 transition-all cursor-pointer"
            >
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleInputChange}
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input" className="cursor-pointer">
                <div className="text-6xl mb-4">🖼️</div>
                <p className="text-2xl text-white mb-2">
                  Drop your image here
                </p>
                <p className="text-gray-400 mb-4">or click to browse</p>
                <p className="text-sm text-gray-500">
                  Supports PNG, JPG, JPEG, WEBP • Max 10MB
                </p>
              </label>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-center">
                {error}
              </div>
            )}
          </div>
        ) : (
          // Result Area
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Original Image */}
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  📷 Original
                </h2>
                <div className="aspect-square relative rounded-lg overflow-hidden bg-slate-700">
                  <Image
                    src={originalImage}
                    alt="Original"
                    fill
                    className="object-contain"
                  />
                </div>
                <p className="text-gray-400 text-sm mt-2 truncate">
                  {fileName}
                </p>
              </div>

              {/* Processed Image */}
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  ✨ Background Removed
                </h2>
                <div 
                  className="aspect-square relative rounded-lg overflow-hidden"
                  style={{
                    backgroundImage: `
                      linear-gradient(45deg, #374151 25%, transparent 25%),
                      linear-gradient(-45deg, #374151 25%, transparent 25%),
                      linear-gradient(45deg, transparent 75%, #374151 75%),
                      linear-gradient(-45deg, transparent 75%, #374151 75%)
                    `,
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                    backgroundColor: '#1f2937'
                  }}
                >
                  {isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-800/80">
                      <div className="text-center">
                        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-white">Processing...</p>
                      </div>
                    </div>
                  ) : processedImage ? (
                    <Image
                      src={processedImage}
                      alt="Processed"
                      fill
                      className="object-contain"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-gray-400">Waiting for result...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-8 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-center">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center gap-4">
              {processedImage && (
                <button
                  onClick={handleDownload}
                  className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all flex items-center gap-2"
                >
                  ⬇️ Download PNG
                </button>
              )}
              <button
                onClick={handleReset}
                className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-all"
              >
                Upload New Image
              </button>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="max-w-4xl mx-auto mt-16 grid md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="text-4xl mb-3">⚡</div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Lightning Fast
            </h3>
            <p className="text-gray-400 text-sm">
              Process images in seconds with AI
            </p>
          </div>
          <div className="text-center p-6">
            <div className="text-4xl mb-3">🔒</div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Privacy First
            </h3>
            <p className="text-gray-400 text-sm">
              Your images are not stored on our servers
            </p>
          </div>
          <div className="text-center p-6">
            <div className="text-4xl mb-3">✨</div>
            <h3 className="text-lg font-semibold text-white mb-2">
              High Quality
            </h3>
            <p className="text-gray-400 text-sm">
              Professional results powered by AI
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-16 text-gray-500 text-sm">
          <p>Powered by Remove.bg API • Built with Next.js</p>
        </footer>
      </div>
    </main>
  );
}
