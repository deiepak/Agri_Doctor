'use client';

import { useTranslation } from '@/i18n';
import { useAppStore, PlantType } from '@/lib/store';

const plants: { type: PlantType; emoji: string; color: string }[] = [
    { type: 'tomato', emoji: '🍅', color: 'from-red-500 to-red-600' },
    { type: 'potato', emoji: '🥔', color: 'from-amber-600 to-yellow-700' },
    { type: 'rice', emoji: '🌾', color: 'from-green-500 to-emerald-600' },
    { type: 'wheat', emoji: '🌾', color: 'from-amber-400 to-orange-500' },
];

export function PlantSelector() {
    const { t } = useTranslation();
    const { selectedPlant, setSelectedPlant, setStep } = useAppStore();

    const handleSelect = (plant: PlantType) => {
        setSelectedPlant(plant);
    };

    const handleContinue = () => {
        if (selectedPlant) {
            setStep('capture');
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto px-4">
            <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-2">
                    {t('plant.title')}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    {t('plant.subtitle')}
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4 md:gap-6 mb-8">
                {plants.map(({ type, emoji, color }) => (
                    <button
                        key={type}
                        onClick={() => handleSelect(type)}
                        className={`
              relative group flex flex-col items-center justify-center
              p-6 md:p-8 rounded-2xl
              transition-all duration-300 ease-out
              ${selectedPlant === type
                                ? `bg-gradient-to-br ${color} text-white shadow-2xl scale-105`
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 shadow-lg hover:shadow-xl hover:scale-102'
                            }
              border-2 ${selectedPlant === type ? 'border-white/30' : 'border-transparent'}
            `}
                    >
                        {/* Selection indicator */}
                        {selectedPlant === type && (
                            <div className="absolute top-3 right-3 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        )}

                        {/* Plant emoji */}
                        <span className="text-5xl md:text-6xl mb-3 group-hover:scale-110 transition-transform duration-300">
                            {emoji}
                        </span>

                        {/* Plant name */}
                        <span className="text-lg md:text-xl font-semibold">
                            {t(`plant.${type}`)}
                        </span>

                        {/* Hover effect overlay */}
                        <div className={`
              absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100
              transition-opacity duration-300
              ${selectedPlant !== type ? `bg-gradient-to-br ${color}` : ''}
              pointer-events-none
            `} style={{ opacity: selectedPlant !== type ? 0.1 : 0 }} />
                    </button>
                ))}
            </div>

            {/* Continue button */}
            <div className="flex flex-col items-center gap-3">
                {!selectedPlant && (
                    <p className="text-amber-600 dark:text-amber-400 text-sm flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        {t('plant.required')}
                    </p>
                )}

                <button
                    onClick={handleContinue}
                    disabled={!selectedPlant}
                    className={`
            w-full md:w-auto px-8 py-4 rounded-xl
            font-semibold text-lg
            transition-all duration-300 ease-out
            ${selectedPlant
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 hover:scale-105 active:scale-95'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                        }
          `}
                >
                    <span className="flex items-center justify-center gap-2">
                        {t('app.next')}
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </span>
                </button>
            </div>
        </div>
    );
}
