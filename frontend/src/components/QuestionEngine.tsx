'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from '@/i18n';
import { useAppStore, DiseaseSymptoms, SymptomAnswer } from '@/lib/store';
import { askQuestion } from '@/lib/api';

// Symptom questions in order of importance
const symptomOrder: (keyof DiseaseSymptoms)[] = [
    'yellow_spots',
    'leaf_curl',
    'white_powder',
    'edge_drying',
    'stem_rot',
    'wilting',
    'dark_spots',
    'stunted_growth',
];

export function QuestionEngine() {
    const { t } = useTranslation();
    const {
        selectedPlant,
        analysisResult,
        symptomAnswers,
        addSymptomAnswer,
        setConfirmedDisease,
        setStep,
        setError
    } = useAppStore();

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [remainingDiseases, setRemainingDiseases] = useState(analysisResult?.predictions || []);

    const currentSymptom = symptomOrder[currentQuestionIndex];
    const totalQuestions = Math.min(symptomOrder.length, 5); // Max 5 questions
    const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

    const processAnswer = useCallback(async (answer: boolean) => {
        if (!selectedPlant || !currentSymptom) return;

        setIsProcessing(true);

        const newAnswer: SymptomAnswer = {
            symptom: currentSymptom,
            answer,
        };
        addSymptomAnswer(newAnswer);

        try {
            const response = await askQuestion({
                plantType: selectedPlant,
                diseaseCandidates: remainingDiseases,
                symptomAnswers: [...symptomAnswers, newAnswer],
            });

            if (response.confirmedDisease) {
                // Disease confirmed
                setConfirmedDisease(response.confirmedDisease);
                setStep('confirmation');
            } else if (response.isComplete || currentQuestionIndex >= totalQuestions - 1) {
                // No more questions or max reached - select most likely
                if (response.remainingCandidates.length > 0) {
                    const bestMatch = response.remainingCandidates.reduce((prev, current) =>
                        prev.confidence > current.confidence ? prev : current
                    );
                    setConfirmedDisease(bestMatch);
                    setStep('confirmation');
                } else if (analysisResult?.predictions[0]) {
                    setConfirmedDisease({
                        disease: analysisResult.predictions[0].disease,
                        diseaseId: analysisResult.predictions[0].disease.toLowerCase().replace(/\s+/g, '_'),
                        confidence: analysisResult.predictions[0].confidence,
                    });
                    setStep('confirmation');
                }
            } else {
                // Continue with next question
                setRemainingDiseases(response.remainingCandidates);
                setCurrentQuestionIndex(prev => prev + 1);
            }
        } catch (err) {
            console.error('Question error:', err);
            // On error, proceed with best guess
            if (remainingDiseases.length > 0) {
                setConfirmedDisease(remainingDiseases[0]);
                setStep('confirmation');
            } else {
                setError('Failed to process answer');
                setStep('results');
            }
        } finally {
            setIsProcessing(false);
        }
    }, [
        selectedPlant,
        currentSymptom,
        currentQuestionIndex,
        totalQuestions,
        remainingDiseases,
        symptomAnswers,
        analysisResult,
        addSymptomAnswer,
        setConfirmedDisease,
        setStep,
        setError
    ]);

    const handleYes = useCallback(() => processAnswer(true), [processAnswer]);
    const handleNo = useCallback(() => processAnswer(false), [processAnswer]);

    const handleBack = useCallback(() => {
        setStep('results');
    }, [setStep]);

    // Fallback if no symptom
    useEffect(() => {
        if (!currentSymptom && remainingDiseases.length > 0) {
            setConfirmedDisease(remainingDiseases[0]);
            setStep('confirmation');
        }
    }, [currentSymptom, remainingDiseases, setConfirmedDisease, setStep]);

    if (!currentSymptom) {
        return null;
    }

    return (
        <div className="w-full max-w-2xl mx-auto px-4">
            {/* Header */}
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                    {t('questions.title')}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    {t('questions.subtitle')}
                </p>
            </div>

            {/* Progress bar */}
            <div className="mb-8">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span>{t('questions.progress', { current: currentQuestionIndex + 1, total: totalQuestions })}</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Question card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 shadow-xl mb-6">
                {/* Symptom icon */}
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-lg">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>

                {/* Question text */}
                <p className="text-xl md:text-2xl font-medium text-center text-gray-800 dark:text-white mb-8">
                    {t(`questions.${currentSymptom}`)}
                </p>

                {/* Answer buttons */}
                <div className="flex gap-4">
                    <button
                        onClick={handleNo}
                        disabled={isProcessing}
                        className="flex-1 py-5 rounded-xl bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-200 font-bold text-xl transition-all hover:scale-102 hover:shadow-lg active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className="flex items-center justify-center gap-3">
                            <span className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </span>
                            {t('app.no')}
                        </span>
                    </button>

                    <button
                        onClick={handleYes}
                        disabled={isProcessing}
                        className="flex-1 py-5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-xl shadow-lg shadow-green-500/30 transition-all hover:scale-102 hover:shadow-xl hover:shadow-green-500/40 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className="flex items-center justify-center gap-3">
                            <span className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                </svg>
                            </span>
                            {t('app.yes')}
                        </span>
                    </button>
                </div>

                {/* Processing indicator */}
                {isProcessing && (
                    <div className="flex justify-center mt-6">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-green-500" />
                    </div>
                )}
            </div>

            {/* Remaining candidates hint */}
            <div className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">
                Analyzing {remainingDiseases.length} possible diseases...
            </div>

            {/* Back button */}
            <button
                onClick={handleBack}
                disabled={isProcessing}
                className="w-full py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium transition-all hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
            >
                <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    {t('app.back')}
                </span>
            </button>
        </div>
    );
}
