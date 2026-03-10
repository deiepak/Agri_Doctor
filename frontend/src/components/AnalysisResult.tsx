'use client';

import { useCallback } from 'react';
import { useTranslation } from '@/i18n';
import { useAppStore } from '@/lib/store';

export function AnalysisResult() {
    const { t } = useTranslation();
    const { analysisResult, setStep, setConfirmedDisease, croppedImage } = useAppStore();

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 85) return 'from-green-500 to-emerald-500';
        if (confidence >= 50) return 'from-amber-500 to-orange-500';
        return 'from-red-500 to-rose-500';
    };

    const getConfidenceLabel = (confidence: number) => {
        if (confidence >= 85) return t('analysis.highConfidence');
        if (confidence >= 50) return t('analysis.lowConfidence');
        return t('analysis.uncertain');
    };

    const handleSelectDisease = useCallback((prediction: { disease: string; diseaseId: string; confidence: number }) => {
        const maxConfidence = Math.max(...(analysisResult?.predictions.map(p => p.confidence) || [0]));

        if (maxConfidence >= 85) {
            // High confidence - go directly to confirmation
            setConfirmedDisease({
                disease: prediction.disease,
                diseaseId: prediction.disease.toLowerCase().replace(/\s+/g, '_'),
                confidence: prediction.confidence,
            });
            setStep('confirmation');
        } else {
            // Low confidence - start question engine
            setStep('questions');
        }
    }, [analysisResult, setConfirmedDisease, setStep]);

    const handleStartQuestions = useCallback(() => {
        setStep('questions');
    }, [setStep]);

    const handleBack = useCallback(() => {
        setStep('crop');
    }, [setStep]);

    if (!analysisResult) {
        return null;
    }

    const maxConfidence = Math.max(...analysisResult.predictions.map(p => p.confidence));
    const shouldShowQuestions = maxConfidence < 85;

    return (
        <div className="w-full max-w-2xl mx-auto px-4">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                    {t('analysis.title')}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    {t('analysis.subtitle')}
                </p>
            </div>

            {/* Analyzed image thumbnail */}
            {croppedImage && (
                <div className="flex justify-center mb-6">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-green-500/30 shadow-lg">
                        <img src={croppedImage} alt="Analyzed" className="w-full h-full object-cover" />
                    </div>
                </div>
            )}

            {/* Confidence status */}
            <div className={`
        rounded-xl p-4 mb-6 text-center
        ${maxConfidence >= 85
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                    : maxConfidence >= 50
                        ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                }
      `}>
                <p className="font-medium">{getConfidenceLabel(maxConfidence)}</p>
            </div>

            {/* Detection Tier Badge */}
            {analysisResult.tier && (
                <div className={`
                    flex items-center justify-center gap-2 mb-4 py-2 px-4 rounded-lg text-sm font-medium
                    ${analysisResult.tier === 'openai'
                        ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                        : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    }
                `}>
                    {analysisResult.tier === 'openai' ? (
                        <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                            </svg>
                            Cloud AI Analysis (OpenAI)
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Local AI Model ({analysisResult.tier === 'common' ? 'Common Diseases' : 'Extended Analysis'})
                        </>
                    )}
                </div>
            )}

            {/* Predictions */}
            <div className="space-y-4 mb-6">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300">
                    {t('analysis.predictions')}
                </h3>

                {analysisResult.predictions.map((prediction, index) => (
                    <button
                        key={index}
                        onClick={() => handleSelectDisease(prediction)}
                        className={`
              w-full p-4 rounded-xl bg-white dark:bg-gray-800 shadow-lg
              border-2 transition-all duration-200
              ${maxConfidence >= 85 && prediction.confidence === maxConfidence
                                ? 'border-green-500 hover:shadow-green-500/20'
                                : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                            }
              hover:scale-102
            `}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="font-semibold text-gray-800 dark:text-white">
                                {prediction.disease}
                            </span>
                            <span className={`
                px-3 py-1 rounded-full text-sm font-medium text-white
                bg-gradient-to-r ${getConfidenceColor(prediction.confidence)}
              `}>
                                {prediction.confidence}%
                            </span>
                        </div>

                        {/* Confidence bar */}
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full bg-gradient-to-r ${getConfidenceColor(prediction.confidence)} rounded-full transition-all duration-500`}
                                style={{ width: `${prediction.confidence}%` }}
                            />
                        </div>
                    </button>
                ))}
            </div>

            {/* AI Notes */}
            {analysisResult.notes && (
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-6">
                    <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                        {t('analysis.notes')}
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                        {analysisResult.notes}
                    </p>
                </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-4">
                <button
                    onClick={handleBack}
                    className="py-4 px-6 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold transition-all hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                {shouldShowQuestions ? (
                    <button
                        onClick={handleStartQuestions}
                        className="flex-1 py-4 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-lg shadow-amber-500/30 transition-all hover:shadow-xl hover:shadow-amber-500/40"
                    >
                        <span className="flex items-center justify-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Answer Questions to Confirm
                        </span>
                    </button>
                ) : (
                    <button
                        onClick={() => handleSelectDisease(analysisResult.predictions[0])}
                        className="flex-1 py-4 px-6 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold shadow-lg shadow-green-500/30 transition-all hover:shadow-xl hover:shadow-green-500/40"
                    >
                        <span className="flex items-center justify-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            View Treatment
                        </span>
                    </button>
                )}
            </div>
        </div>
    );
}
