'use client';

import { useTranslation } from '@/i18n';
import { useAppStore } from '@/lib/store';

export function AnalysisLoading() {
    const { t } = useTranslation();
    const { selectedPlant, croppedImage } = useAppStore();

    const plantEmojis: Record<string, string> = {
        tomato: '🍅',
        potato: '🥔',
        rice: '🌾',
        wheat: '🌾',
    };

    return (
        <div className="w-full max-w-2xl mx-auto px-4">
            <div className="text-center mb-8">
                <div className="relative inline-block mb-6">
                    {/* Animated rings */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-32 h-32 rounded-full border-4 border-green-500/30 animate-ping" />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 rounded-full border-4 border-green-500/50 animate-pulse" />
                    </div>

                    {/* Center image */}
                    <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-green-500 shadow-xl">
                        {croppedImage ? (
                            <img src={croppedImage} alt="Analyzing" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-green-100 flex items-center justify-center text-4xl">
                                {selectedPlant && plantEmojis[selectedPlant]}
                            </div>
                        )}
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                    {t('app.loading')}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    AI is analyzing your {selectedPlant && t(`plant.${selectedPlant}`)} leaf image
                </p>
            </div>

            {/* Progress steps */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl">
                <div className="space-y-4">
                    {[
                        { step: 1, text: 'Processing image...', done: true },
                        { step: 2, text: 'Analyzing leaf patterns...', done: false, active: true },
                        { step: 3, text: 'Identifying possible diseases...', done: false },
                    ].map((item) => (
                        <div key={item.step} className="flex items-center gap-4">
                            <div className={`
                w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                ${item.done
                                    ? 'bg-green-500 text-white'
                                    : item.active
                                        ? 'bg-green-500/20 text-green-500 animate-pulse'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                                }
              `}>
                                {item.done ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : item.active ? (
                                    <div className="w-4 h-4 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
                                ) : (
                                    <span className="text-sm font-medium">{item.step}</span>
                                )}
                            </div>
                            <span className={`
                text-sm font-medium
                ${item.done
                                    ? 'text-green-600 dark:text-green-400'
                                    : item.active
                                        ? 'text-gray-800 dark:text-white'
                                        : 'text-gray-400'
                                }
              `}>
                                {item.text}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Disclaimer */}
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                {t('app.internetRequired')}
            </p>
        </div>
    );
}
