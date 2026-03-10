'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from '@/i18n';
import { useI18n } from '@/i18n';
import { useAppStore } from '@/lib/store';
import { confirmDisease } from '@/lib/api';

export function DiseaseConfirmation() {
    const { t } = useTranslation();
    const { language } = useI18n();
    const {
        confirmedDisease,
        analysisResult,
        symptomAnswers,
        explanation,
        setExplanation,
        setStep
    } = useAppStore();

    const [isLoading, setIsLoading] = useState(false);

    // Fetch explanation on mount
    useEffect(() => {
        const fetchExplanation = async () => {
            if (!confirmedDisease || explanation) return;

            setIsLoading(true);
            try {
                const response = await confirmDisease({
                    diseaseId: confirmedDisease.diseaseId,
                    plantType: useAppStore.getState().selectedPlant!,
                    imageObservations: analysisResult?.notes || '',
                    symptomAnswers: symptomAnswers.map(sa => ({
                        symptom: sa.symptom,
                        answer: sa.answer,
                    })),
                    language,
                });
                setExplanation(response.explanation);
            } catch (err) {
                console.error('Failed to fetch explanation:', err);
                // Set a default explanation
                setExplanation('Based on the image analysis and your symptom responses, this disease appears to be the most likely cause of the plant issues.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchExplanation();
    }, [confirmedDisease, analysisResult, symptomAnswers, language, explanation, setExplanation]);

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 85) return 'from-green-500 to-emerald-500';
        if (confidence >= 50) return 'from-amber-500 to-orange-500';
        return 'from-red-500 to-rose-500';
    };

    const handleViewTreatment = useCallback(() => {
        setStep('treatment');
    }, [setStep]);

    const handleBack = useCallback(() => {
        setStep('results');
    }, [setStep]);

    const handleStartOver = useCallback(() => {
        useAppStore.getState().resetFlow();
    }, []);

    if (!confirmedDisease) {
        return null;
    }

    return (
        <div className="w-full max-w-2xl mx-auto px-4">
            {/* Success header */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 text-white mb-4 shadow-xl shadow-green-500/30">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                    {t('confirmation.title')}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    {t('confirmation.subtitle')}
                </p>
            </div>

            {/* Disease card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl mb-6">
                <h3 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-4">
                    {confirmedDisease.disease}
                </h3>

                {/* Confidence */}
                <div className="mb-6">
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <span>{t('confirmation.confidence')}</span>
                        <span className="font-semibold">{confirmedDisease.confidence}%</span>
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full bg-gradient-to-r ${getConfidenceColor(confirmedDisease.confidence)} rounded-full transition-all duration-500`}
                            style={{ width: `${confirmedDisease.confidence}%` }}
                        />
                    </div>
                </div>

                {/* Explanation */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {t('confirmation.why')}
                    </h4>
                    {isLoading ? (
                        <div className="animate-pulse space-y-2">
                            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-full" />
                            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4" />
                        </div>
                    ) : (
                        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                            {explanation}
                        </p>
                    )}
                </div>
            </div>

            {/* Symptom summary */}
            {symptomAnswers.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-6">
                    <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
                        Your Responses:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {symptomAnswers.map((answer, index) => (
                            <span
                                key={index}
                                className={`
                  px-3 py-1 rounded-full text-xs font-medium
                  ${answer.answer
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                    }
                `}
                            >
                                {answer.answer ? '✓' : '✗'} {answer.symptom.replace(/_/g, ' ')}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Action buttons */}
            <div className="space-y-3">
                <button
                    onClick={handleViewTreatment}
                    className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold text-lg shadow-lg shadow-green-500/30 transition-all hover:shadow-xl hover:shadow-green-500/40 hover:scale-102"
                >
                    <span className="flex items-center justify-center gap-2">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                        {t('confirmation.viewTreatment')}
                    </span>
                </button>

                <div className="flex gap-3">
                    <button
                        onClick={handleBack}
                        className="flex-1 py-3 px-4 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium transition-all hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                        {t('app.back')}
                    </button>
                    <button
                        onClick={handleStartOver}
                        className="flex-1 py-3 px-4 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium transition-all hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                        Start Over
                    </button>
                </div>
            </div>

            {/* Not sure section */}
            <div className="mt-6 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {t('confirmation.notSure')}
                </p>
                <a
                    href="#"
                    className="text-green-600 dark:text-green-400 text-sm font-medium hover:underline"
                >
                    {t('confirmation.consultExpert')}
                </a>
            </div>
        </div>
    );
}
