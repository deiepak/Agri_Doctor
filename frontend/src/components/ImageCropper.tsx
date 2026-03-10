'use client';

import { useRef, useCallback, useState } from 'react';
import Cropper, { ReactCropperElement } from 'react-cropper';
// CSS imported via globals.css
import { useTranslation } from '@/i18n';
import { useAppStore } from '@/lib/store';
import { analyzeImage } from '@/lib/api';

export function ImageCropper() {
    const { t } = useTranslation();
    const { capturedImage, selectedPlant, location, setCroppedImage, setAnalysisResult, setStep, setIsLoading, setError } = useAppStore();
    const cropperRef = useRef<ReactCropperElement>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleCrop = useCallback(async () => {
        const cropper = cropperRef.current?.cropper;
        if (!cropper || !selectedPlant) return;

        setIsProcessing(true);

        try {
            // Get cropped image as base64
            const croppedCanvas = cropper.getCroppedCanvas({
                maxWidth: 1024,
                maxHeight: 1024,
                imageSmoothingEnabled: true,
                imageSmoothingQuality: 'high',
            });

            const croppedImageData = croppedCanvas.toDataURL('image/jpeg', 0.9);
            setCroppedImage(croppedImageData);
            setStep('analyzing');

            // Start analysis
            setIsLoading(true);
            const result = await analyzeImage({
                image: croppedImageData,
                plantType: selectedPlant,
                location: location || undefined,
            });

            setAnalysisResult(result);
            setStep('results');
        } catch (err) {
            console.error('Analysis error:', err);
            setError(err instanceof Error ? err.message : 'Failed to analyze image');
            setStep('capture');
        } finally {
            setIsLoading(false);
            setIsProcessing(false);
        }
    }, [selectedPlant, location, setCroppedImage, setAnalysisResult, setStep, setIsLoading, setError]);

    const handleBack = useCallback(() => {
        setStep('capture');
    }, [setStep]);

    if (!capturedImage) {
        return null;
    }

    return (
        <div className="w-full max-w-2xl mx-auto px-4">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                    {t('capture.crop')}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    {t('capture.cropHint')}
                </p>
            </div>

            {/* Cropper */}
            <div className="relative bg-black rounded-2xl overflow-hidden mb-6 shadow-2xl">
                <Cropper
                    ref={cropperRef}
                    src={capturedImage}
                    style={{ height: 400, width: '100%' }}
                    initialAspectRatio={1}
                    aspectRatio={1}
                    guides={true}
                    viewMode={1}
                    dragMode="move"
                    scalable={true}
                    zoomable={true}
                    cropBoxMovable={true}
                    cropBoxResizable={true}
                    background={false}
                    responsive={true}
                    autoCropArea={0.8}
                    checkOrientation={true}
                />
            </div>

            {/* Controls */}
            <div className="flex gap-4 mb-4">
                <button
                    onClick={() => cropperRef.current?.cropper.zoom(0.1)}
                    className="flex-1 py-3 px-4 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium transition-all hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                    <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                        Zoom In
                    </span>
                </button>
                <button
                    onClick={() => cropperRef.current?.cropper.zoom(-0.1)}
                    className="flex-1 py-3 px-4 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium transition-all hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                    <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                        </svg>
                        Zoom Out
                    </span>
                </button>
                <button
                    onClick={() => cropperRef.current?.cropper.reset()}
                    className="py-3 px-4 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium transition-all hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
            </div>

            {/* Action buttons */}
            <div className="flex gap-4">
                <button
                    onClick={handleBack}
                    disabled={isProcessing}
                    className="py-4 px-6 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold transition-all hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <button
                    onClick={handleCrop}
                    disabled={isProcessing}
                    className="flex-1 py-4 px-6 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold shadow-lg shadow-green-500/30 transition-all hover:shadow-xl hover:shadow-green-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isProcessing ? (
                        <span className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" />
                            {t('app.loading')}
                        </span>
                    ) : (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                            {t('app.submit')}
                        </span>
                    )}
                </button>
            </div>
        </div>
    );
}
