'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/i18n';
import { useI18n } from '@/i18n';
import { useAppStore } from '@/lib/store';
import { getTreatment, TreatmentInfo, Treatment } from '@/lib/api';

type TreatmentTab = 'organic' | 'chemical' | 'prevention';

export function TreatmentDisplay() {
    const { t } = useTranslation();
    const { language } = useI18n();
    const { confirmedDisease, selectedPlant } = useAppStore();

    const [activeTab, setActiveTab] = useState<TreatmentTab>('organic');
    const [treatmentInfo, setTreatmentInfo] = useState<TreatmentInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTreatment = async () => {
            if (!confirmedDisease) return;

            setIsLoading(true);
            setError(null);

            try {
                const data = await getTreatment(confirmedDisease.diseaseId, language);
                setTreatmentInfo(data);
            } catch (err) {
                console.error('Failed to fetch treatment:', err);
                setError('Failed to load treatment information');
            } finally {
                setIsLoading(false);
            }
        };

        fetchTreatment();
    }, [confirmedDisease, language]);

    const handleBack = useCallback(() => {
        useAppStore.getState().setStep('confirmation');
    }, []);

    const handleStartOver = useCallback(() => {
        useAppStore.getState().resetFlow();
    }, []);

    const renderTreatmentCard = (treatment: Treatment, index: number, type: TreatmentTab) => {
        const typeColors = {
            organic: 'from-green-500 to-emerald-500',
            chemical: 'from-blue-500 to-indigo-500',
            prevention: 'from-purple-500 to-violet-500',
        };

        const typeIcons = {
            organic: '🌿',
            chemical: '🧪',
            prevention: '🛡️',
        };

        return (
            <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg border border-gray-100 dark:border-gray-700"
            >
                {/* Header */}
                <div className="flex items-start gap-3 mb-4">
                    <span className="text-2xl">{typeIcons[type]}</span>
                    <h4 className="font-semibold text-gray-800 dark:text-white text-lg">
                        {treatment.name}
                    </h4>
                </div>

                {/* Details */}
                <div className="space-y-3">
                    {/* Dosage */}
                    <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${typeColors[type]} flex items-center justify-center flex-shrink-0`}>
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
                                {t('treatment.dosage')}
                            </p>
                            <p className="text-gray-700 dark:text-gray-300">
                                {treatment.dosage}
                            </p>
                        </div>
                    </div>

                    {/* Frequency */}
                    <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${typeColors[type]} flex items-center justify-center flex-shrink-0`}>
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
                                {t('treatment.frequency')}
                            </p>
                            <p className="text-gray-700 dark:text-gray-300">
                                {treatment.frequency}
                            </p>
                        </div>
                    </div>

                    {/* Warning */}
                    {treatment.warning && (
                        <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                            <div className="flex items-start gap-2">
                                <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <div>
                                    <p className="text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wide font-medium mb-1">
                                        {t('treatment.warning')}
                                    </p>
                                    <p className="text-sm text-amber-700 dark:text-amber-300">
                                        {treatment.warning}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    if (!confirmedDisease) {
        return null;
    }

    return (
        <div className="w-full max-w-2xl mx-auto px-4">
            {/* Header */}
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                    {t('treatment.title')}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    {t('treatment.subtitle')} <span className="font-semibold">{confirmedDisease.disease}</span>
                </p>
            </div>

            {/* Tabs */}
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6">
                {(['organic', 'chemical', 'prevention'] as TreatmentTab[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`
              flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200
              ${activeTab === tab
                                ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-md'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                            }
            `}
                    >
                        {t(`treatment.tabs.${tab}`)}
                    </button>
                ))}
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2].map((i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg animate-pulse">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                            </div>
                            <div className="space-y-3">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : error ? (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 text-center">
                    <p className="text-red-600 dark:text-red-400">{error}</p>
                </div>
            ) : treatmentInfo ? (
                <div className="space-y-4 mb-6">
                    {treatmentInfo[activeTab].length > 0 ? (
                        treatmentInfo[activeTab].map((treatment, index) =>
                            renderTreatmentCard(treatment, index, activeTab)
                        )
                    ) : (
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 text-center">
                            <p className="text-gray-500 dark:text-gray-400">
                                {t('treatment.noTreatment')}
                            </p>
                        </div>
                    )}
                </div>
            ) : null}

            {/* Disclaimer */}
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 mb-6 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-300 text-center">
                    {t('treatment.disclaimer')}
                </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
                <button
                    onClick={handleBack}
                    className="flex-1 py-4 px-4 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold transition-all hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                    {t('app.back')}
                </button>
                <button
                    onClick={handleStartOver}
                    className="flex-1 py-4 px-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold shadow-lg shadow-green-500/30 transition-all hover:shadow-xl hover:shadow-green-500/40"
                >
                    <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Analyze Another Plant
                    </span>
                </button>
            </div>

            {/* Safety disclaimer */}
            <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
                {t('app.disclaimer')}
            </p>
        </div>
    );
}
