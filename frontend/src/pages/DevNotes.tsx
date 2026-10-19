import React from 'react';
import { ScreenLayout } from '../components/ScreenLayout';
import { useLanguage } from '../contexts/LanguageContext';
import { devNotes } from '../data/devNotes';

export function DevNotes() {
  const { t } = useLanguage();
  return (
    <ScreenLayout title={t('devNotes')} showBack>
      <div lang="en" className="space-y-4 px-4 pb-10">
        {devNotes.map((note) =>
        <section key={note.title} className="rounded-3xl bg-white p-5 shadow-card">
            <h2 className="text-base font-semibold text-ink">{note.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{note.body}</p>
            <pre className="no-scrollbar mt-3 overflow-x-auto rounded-2xl bg-[#13241A] p-3.5 font-mono text-[11px] leading-relaxed text-[#CFE6D6]">{note.code}</pre>
          </section>
        )}
      </div>
    </ScreenLayout>);

}