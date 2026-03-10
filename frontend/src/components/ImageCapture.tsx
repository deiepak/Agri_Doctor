'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from '@/i18n';
import { useCamera } from '@/hooks/useCamera';
import { useAppStore } from '@/lib/store';

export function ImageCapture() {
    const { t } = useTranslation();
    const { setCapturedImage, setStep } = useAppStore();
    const { videoRef, canvasRef, isStreaming, error, startCamera, stopCamera, capturePhoto } = useCamera();
    const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        startCamera();
        return () => {
            stopCamera();
        };
    }, [startCamera, stopCamera]);

    const handleCapture = useCallback(() => {
        const photo = capturePhoto();
        if (photo) {
            setCapturedPreview(photo);
        }
    }, [capturePhoto]);

    const handleRetake = useCallback(() => {
        setCapturedPreview(null);
    }, []);

    const handleConfirm = useCallback(() => {
        if (capturedPreview) {
            setCapturedImage(capturedPreview);
            setStep('crop');
        }
    }, [capturedPreview, setCapturedImage, setStep]);

    const handleBack = useCallback(() => {
        stopCamera();
        setStep('plant');
    }, [stopCamera, setStep]);

    if (error) {
        return (
            <div className="w-full max-w-2xl mx-auto px-4">
                <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-6 text-center">
                    <div className="text-red-500 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                        Camera Access Error
                    </h3>
                    <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
                    <button
                        onClick={handleBack}
                        className="px-6 py-3 bg-gray-200 dark:bg-gray-700 rounded-xl text-gray-700 dark:text-gray-300 font-medium"
                    >
                        {t('app.back')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-2xl mx-auto px-4" ref={containerRef}>
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                    {t('capture.title')}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    {t('capture.subtitle')}
                </p>
            </div>

            {/* Camera/Preview container */}
            <div className="relative bg-black rounded-2xl overflow-hidden aspect-[4/3] mb-6 shadow-2xl">
                {capturedPreview ? (
                    // Show captured image
                    <img
                        src={capturedPreview}
                        alt="Captured"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    // Show camera feed
                    <>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                        />

                        {/* Camera overlay guides */}
                        <div className="absolute inset-0 pointer-events-none">
                            {/* Corner guides */}
                            <div className="absolute top-4 left-4 w-12 h-12 border-l-4 border-t-4 border-white/60 rounded-tl-lg" />
                            <div className="absolute top-4 right-4 w-12 h-12 border-r-4 border-t-4 border-white/60 rounded-tr-lg" />
                            <div className="absolute bottom-4 left-4 w-12 h-12 border-l-4 border-b-4 border-white/60 rounded-bl-lg" />
                            <div className="absolute bottom-4 right-4 w-12 h-12 border-r-4 border-b-4 border-white/60 rounded-br-lg" />

                            {/* Center focus indicator */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-20 h-20 border-2 border-white/40 rounded-full" />
                            </div>
                        </div>

                        {/* Loading overlay */}
                        {!isStreaming && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500" />
                            </div>
                        )}
                    </>
                )}

                {/* Hidden canvas for capture */}
                <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Tips */}
            {!capturedPreview && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 mb-6">
                    <h4 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-2">
                        {t('capture.tips.title')}
                    </h4>
                    <ul className="text-sm text-green-700 dark:text-green-400 space-y-1">
                        <li className="flex items-center gap-2">
                            <span className="text-green-500">✓</span> {t('capture.tips.tip1')}
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="text-green-500">✓</span> {t('capture.tips.tip2')}
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="text-green-500">✓</span> {t('capture.tips.tip3')}
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="text-green-500">✓</span> {t('capture.tips.tip4')}
                        </li>
                    </ul>
                </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-4">
                {capturedPreview ? (
                    <>
                        <button
                            onClick={handleRetake}
                            className="flex-1 py-4 px-6 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold transition-all hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                            <span className="flex items-center justify-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                {t('capture.retake')}
                            </span>
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="flex-1 py-4 px-6 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold shadow-lg shadow-green-500/30 transition-all hover:shadow-xl hover:shadow-green-500/40 hover:scale-102"
                        >
                            <span className="flex items-center justify-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                {t('capture.confirm')}
                            </span>
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={handleBack}
                            className="py-4 px-6 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold transition-all hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            onClick={handleCapture}
                            disabled={!isStreaming}
                            className="flex-1 py-4 px-6 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold shadow-lg shadow-green-500/30 transition-all hover:shadow-xl hover:shadow-green-500/40 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                        >
                            <span className="flex items-center justify-center gap-2">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {t('capture.camera')}
                            </span>
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
