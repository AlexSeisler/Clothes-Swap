'use client';

import { useState, useRef } from 'react';
import { Upload, Zap, Download, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';

type JobState = 'idle' | 'uploading' | 'processing' | 'done' | 'error';

interface FormData {
  sourceImage: File | null;
  referenceGarment: File | null;
  prompt: string;
}

export default function ClothSwap() {
  const [jobState, setJobState] = useState<JobState>('idle');
  const [formData, setFormData] = useState<FormData>({
    sourceImage: null,
    referenceGarment: null,
    prompt: '',
  });
  const [resultUrl, setResultUrl] = useState<string>('');
  const [error, setError] = useState<string>('');

  const sourceInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > 10 * 1024 * 1024) {
      return 'File size must be less than 10MB';
    }
    if (!file.type.startsWith('image/')) {
      return 'Please select an image file';
    }
    return null;
  };

  const handleFileChange = (type: 'source' | 'reference', file: File | null) => {
    if (file) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
    }
    
    setError('');
    setFormData(prev => ({
      ...prev,
      [type === 'source' ? 'sourceImage' : 'referenceGarment']: file,
    }));
  };

  const extractImageUrl = (response: any): string => {
    if (response.image_url) return response.image_url;
    if (response.result?.image_url) return response.result.image_url;
    if (response.outputUrl) return response.outputUrl;
    throw new Error('No image URL found in response');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.sourceImage) {
      setError('Please select a source image');
      return;
    }

    setJobState('uploading');

    try {
      setJobState('processing');

      const submitData = new FormData();
      submitData.append('source_image', formData.sourceImage);
      if (formData.referenceGarment) {
        submitData.append('reference_garment', formData.referenceGarment);
      }
      if (formData.prompt.trim()) {
        submitData.append('prompt', formData.prompt.trim());
      }

      // Always send to backend route for field remapping
      const response = await fetch('/api/clothswap', {
        method: 'POST',
        body: submitData,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      const imageUrl = extractImageUrl(responseData);

      setResultUrl(imageUrl);
      setJobState('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setJobState('error');
    }
  };


  const handleReset = () => {
    setJobState('idle');
    setFormData({
      sourceImage: null,
      referenceGarment: null,
      prompt: '',
    });
    setResultUrl('');
    setError('');
    
    if (sourceInputRef.current) sourceInputRef.current.value = '';
    if (referenceInputRef.current) referenceInputRef.current.value = '';
  };

  const handleDownload = () => {
    if (resultUrl) {
      const link = document.createElement('a');
      link.href = resultUrl;
      link.download = 'clothswap-result.png';
      link.click();
    }
  };

  const isProcessing = jobState === 'uploading' || jobState === 'processing';
  const canSubmit = formData.sourceImage && !isProcessing;

  if (jobState === 'done' && resultUrl) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
        
        <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 max-w-2xl w-full text-center">
          {/* Glowing border effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-cyan-500/20 to-purple-500/20 rounded-2xl blur-sm"></div>
          <div className="relative">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl blur-md opacity-50 animate-pulse"></div>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
                ClothSwap
              </h1>
            </div>
            
            <div className="mb-6 text-emerald-400 font-medium flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span className="text-lg">Transformation Complete</span>
            </div>

            <div className="mb-8 relative">
              <div className="relative overflow-hidden rounded-xl border border-white/20 shadow-2xl">
                <img
                  src={resultUrl}
                  alt="ClothSwap Result"
                  className="w-full max-w-md mx-auto"
                  onError={() => setError('Failed to load result image')}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/50 to-cyan-500/50 rounded-xl blur-sm opacity-75"></div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleDownload}
                className="group relative px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium transition-all duration-300 hover:from-blue-500 hover:to-purple-500 hover:shadow-lg hover:shadow-purple-500/25 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Download Result
              </button>
              <button
                onClick={handleReset}
                className="group relative px-8 py-3 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-xl font-medium transition-all duration-300 hover:bg-white/20 hover:border-white/30 flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                Create Another
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </div>
      
      <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
        {/* Glowing border effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-cyan-500/20 to-purple-500/20 rounded-2xl blur-sm"></div>
        
        <div className="relative">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl blur-md opacity-50 animate-pulse"></div>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
                ClothSwap
              </h1>
            </div>
            <p className="text-gray-300 text-lg">
              Transform your look instantly with AI-powered clothing swapping
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Source Image Upload */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-200 mb-3">
                  <span className="flex items-center gap-2">
                    <Upload className="w-4 h-4 text-purple-400" />
                    Person Photo *
                  </span>
                </label>
                <div className="relative group">
                  <input
                    ref={sourceInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange('source', e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    required
                  />
                  <div className={`
                    relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300
                    ${formData.sourceImage 
                      ? 'border-emerald-400/50 bg-emerald-500/10 shadow-lg shadow-emerald-500/20' 
                      : 'border-white/20 hover:border-purple-400/50 hover:bg-purple-500/10 group-hover:shadow-lg group-hover:shadow-purple-500/20'
                    }
                  `}>
                    {formData.sourceImage ? (
                      <div className="space-y-3">
                        <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
                        <p className="text-sm font-medium text-emerald-300">
                          {formData.sourceImage.name}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="w-12 h-12 bg-white/10 rounded-full mx-auto flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                          <Upload className="w-6 h-6 text-gray-400 group-hover:text-purple-300" />
                        </div>
                        <p className="text-sm text-gray-300">Upload person photo</p>
                        <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Reference Garment Upload */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-200 mb-3">
                  <span className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    Clothing Item (Optional)
                  </span>
                </label>
                <div className="relative group">
                  <input
                    ref={referenceInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange('reference', e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className={`
                    relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300
                    ${formData.referenceGarment 
                      ? 'border-emerald-400/50 bg-emerald-500/10 shadow-lg shadow-emerald-500/20' 
                      : 'border-white/20 hover:border-cyan-400/50 hover:bg-cyan-500/10 group-hover:shadow-lg group-hover:shadow-cyan-500/20'
                    }
                  `}>
                    {formData.referenceGarment ? (
                      <div className="space-y-3">
                        <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
                        <p className="text-sm font-medium text-emerald-300">
                          {formData.referenceGarment.name}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="w-12 h-12 bg-white/10 rounded-full mx-auto flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                          <Upload className="w-6 h-6 text-gray-400 group-hover:text-cyan-300" />
                        </div>
                        <p className="text-sm text-gray-300">Upload clothing reference</p>
                        <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Prompt Input */}
            <div className="space-y-3">
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-200">
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-violet-400" />
                  Garment Description (Optional)
                </span>
              </label>
              <div className="relative">
                <input
                  id="prompt"
                  type="text"
                  value={formData.prompt}
                  onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
                  placeholder="e.g., blue denim jacket, red hoodie, vintage t-shirt..."
                  className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-400/50 transition-all duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-purple-500/10 rounded-xl opacity-0 focus-within:opacity-100 transition-opacity pointer-events-none"></div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/30 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="text-center">
              <button
                type="submit"
                disabled={!canSubmit}
                className={`
                  relative px-12 py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-3 mx-auto overflow-hidden
                  ${canSubmit
                    ? 'bg-gradient-to-r from-purple-600 via-violet-600 to-cyan-600 text-white hover:from-purple-500 hover:via-violet-500 hover:to-cyan-500 shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/40 hover:scale-105'
                    : 'bg-white/10 text-gray-500 cursor-not-allowed border border-white/10'
                  }
                `}
              >
                {canSubmit && (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-violet-600/20 to-cyan-600/20 animate-pulse"></div>
                )}
                <div className="relative flex items-center gap-3">
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>{jobState === 'uploading' ? 'Uploading...' : 'AI Processing...'}</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      <span>Transform Clothing</span>
                    </>
                  )}
                </div>
              </button>
            </div>
          </form>

          {/* Empty State */}
          {jobState === 'idle' && !formData.sourceImage && (
            <div className="text-center mt-8 text-gray-400">
              <div className="w-16 h-16 bg-white/5 backdrop-blur-sm rounded-full mx-auto mb-4 flex items-center justify-center border border-white/10">
                <Zap className="w-8 h-8 text-purple-400" />
              </div>
              <p className="text-sm">Upload a photo to begin the transformation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}