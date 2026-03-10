'use client';

import { useCallback, useState, useRef } from 'react';
import { useTranslation } from '@/i18n';
import { useAppStore } from '@/lib/store';

export function ImageUploader() {
    const { t } = useTranslation();
    const { setCapturedImage, setStep } = useAppStore();
    const [isDragging, setIsDragging] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processFile = useCallback((file: File) => {
        setError(null);

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            setError('Image size should be less than 10MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            setPreview(result);
        };
        reader.onerror = () => {
            setError('Failed to read image file');
        };
        reader.readAsDataURL(file);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            processFile(file);
        }
    }, [processFile]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processFile(file);
        }
    }, [processFile]);

    const handleClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleConfirm = useCallback(() => {
        if (preview) {
            setCapturedImage(preview);
            setStep('crop');
        }
    }, [preview, setCapturedImage, setStep]);

    const handleClear = useCallback(() => {
        setPreview(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

    const handleBack = useCallback(() => {
        setStep('plant');
    }, [setStep]);

    return (
        <div className="w-full max-w-2xl mx-auto px-4">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                    {t('capture.title')}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    {t('capture.subtitle')}
                </p>
            </div>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
            />

            {preview ? (
                // Preview mode
                <div className="space-y-6">
                    <div className="relative bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden aspect-[4/3] shadow-2xl">
                        <img
                            src={preview}
                            alt="Selected"
                            className="w-full h-full object-contain"
                        />
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={handleClear}
                            className="flex-1 py-4 px-6 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold transition-all hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                            <span className="flex items-center justify-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                {t('capture.retake')}
                            </span>
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="flex-1 py-4 px-6 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold shadow-lg shadow-green-500/30 transition-all hover:shadow-xl hover:shadow-green-500/40"
                        >
                            <span className="flex items-center justify-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                {t('capture.confirm')}
                            </span>
                        </button>
                    </div>
                </div>
            ) : (
                // Upload mode
                <div className="space-y-6">
                    {/* Drag and drop zone */}
                    <div
                        onClick={handleClick}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`
              relative cursor-pointer rounded-2xl border-3 border-dashed
              aspect-[4/3] flex flex-col items-center justify-center
              transition-all duration-300 ease-out
              ${isDragging
                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20 scale-102'
                                : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 hover:border-green-400 hover:bg-green-50/50 dark:hover:bg-green-900/10'
                            }
            `}
                    >
                        {/* Upload icon */}
                        <div className={`
              w-20 h-20 rounded-full flex items-center justify-center mb-4
              transition-all duration-300
              ${isDragging
                                ? 'bg-green-500 text-white scale-110'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                            }
            `}>
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>

                        <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('capture.dragDrop')}
                        </p>

                        <button className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all">
                            {t('capture.upload')}
                        </button>

                        {/* Drag overlay */}
                        {isDragging && (
                            <div className="absolute inset-0 bg-green-500/10 rounded-2xl flex items-center justify-center">
                                <div className="bg-green-500 text-white px-6 py-3 rounded-xl font-semibold shadow-xl animate-bounce">
                                    Drop here!
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    {/* Tips */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4">
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
                        </ul>
                    </div>

                    {/* Back button */}
                    <button
                        onClick={handleBack}
                        className="w-full py-4 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold transition-all hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                        <span className="flex items-center justify-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                            {t('app.back')}
                        </span>
                    </button>
                </div>
            )}
        </div>
    );
}
