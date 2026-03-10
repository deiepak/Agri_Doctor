'use client';

import { useI18n, Language } from '@/i18n';

const languages: { code: Language; flag: string }[] = [
    { code: 'en', flag: '🇬🇧' },
    { code: 'hi', flag: '🇮🇳' },
    { code: 'ne', flag: '🇳🇵' },
];

export function LanguageSwitcher() {
    const { language, setLanguage, t } = useI18n();

    return (
        <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:inline">
                {t('language.select')}:
            </span>
            <div className="flex gap-1 bg-white/10 backdrop-blur-sm rounded-full p-1 border border-white/20">
                {languages.map(({ code, flag }) => (
                    <button
                        key={code}
                        onClick={() => setLanguage(code)}
                        className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
              transition-all duration-200 ease-out
              ${language === code
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-white/20'
                            }
            `}
                        aria-label={t(`language.${code}`)}
                    >
                        <span className="text-lg">{flag}</span>
                        <span className="hidden sm:inline">{t(`language.${code}`)}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
