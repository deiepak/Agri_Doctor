'use client';

import { I18nProvider } from '@/i18n';
import { MainApp } from '@/components';

export default function Home() {
  return (
    <I18nProvider defaultLanguage="en">
      <MainApp />
    </I18nProvider>
  );
}
