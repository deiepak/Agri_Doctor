'use client';

import { useDeviceDetect } from '@/hooks/useDeviceDetect';
import { useTranslation } from '@/i18n';
import { useAppStore } from '@/lib/store';
import { LanguageSwitcher } from './LanguageSwitcher';
import { PlantSelector } from './PlantSelector';
import { ImageCapture } from './ImageCapture';
import { ImageUploader } from './ImageUploader';
import { ImageCropper } from './ImageCropper';
import { AnalysisLoading } from './AnalysisLoading';
import { AnalysisResult } from './AnalysisResult';
import { QuestionEngine } from './QuestionEngine';
import { DiseaseConfirmation } from './DiseaseConfirmation';
import { TreatmentDisplay } from './TreatmentDisplay';

export function MainApp() {
    const { t } = useTranslation();
    const { isMobile, isOnline } = useDeviceDetect();
    const { step, error, setError, resetFlow } = useAppStore();

    // Offline banner
    const OfflineBanner = () => (
        <div className="fixed top-0 left-0 right-0 bg-red-500 text-white text-center py-2 px-4 z-50 text-sm font-medium">
            <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
                </svg>
                {t('offline.title')}
            </span>
        </div>
    );

    // Error toast
    const ErrorToast = () => (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-red-500 text-white rounded-xl p-4 shadow-2xl z-50 animate-slide-up">
            <div className="flex items-start gap-3">
                <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                    <p className="font-medium">Error</p>
                    <p className="text-sm opacity-90">{error}</p>
                </div>
                <button
                    onClick={() => setError(null)}
                    className="text-white/80 hover:text-white"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );

    // Render current step
    const renderStep = () => {
        switch (step) {
            case 'plant':
                return <PlantSelector />;
            case 'capture':
                return isMobile ? <ImageCapture /> : <ImageUploader />;
            case 'crop':
                return <ImageCropper />;
            case 'analyzing':
                return <AnalysisLoading />;
            case 'results':
                return <AnalysisResult />;
            case 'questions':
                return <QuestionEngine />;
            case 'confirmation':
                return <DiseaseConfirmation />;
            case 'treatment':
                return <TreatmentDisplay />;
            default:
                return <PlantSelector />;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
            {/* Offline banner */}
            {!isOnline && <OfflineBanner />}

            {/* Header */}
            <header className={`sticky top-0 z-40 backdrop-blur-lg bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/50 dark:border-gray-700/50 ${!isOnline ? 'mt-10' : ''}`}>
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                    {/* Logo */}
                    <button
                        onClick={resetFlow}
                        className="flex items-center gap-2 group"
                    >
                        <span className="text-2xl group-hover:scale-110 transition-transform">🌱</span>
                        <span className="font-bold text-lg text-gray-800 dark:text-white hidden sm:inline">
                            {t('app.title')}
                        </span>
                    </button>

                    {/* Language switcher */}
                    <LanguageSwitcher />
                </div>
            </header>

            {/* Main content */}
            <main className="py-8 md:py-12">
                {renderStep()}
            </main>

            {/* Footer disclaimer */}
            <footer className="pb-8 px-4 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    {t('app.disclaimer')}
                </p>
            </footer>

            {/* Error toast */}
            {error && <ErrorToast />}

            {/* Custom animations */}
            <style jsx global>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        
        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }
        
        .active\\:scale-95:active {
          transform: scale(0.95);
        }
        
        .active\\:scale-98:active {
          transform: scale(0.98);
        }
        
        .border-3 {
          border-width: 3px;
        }
      `}</style>
        </div>
    );
}
