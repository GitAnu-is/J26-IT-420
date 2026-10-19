import React, { useState } from 'react';
import { BellRingIcon, ChevronRightIcon } from 'lucide-react';
import { ScreenLayout } from '../components/ScreenLayout';
import { Button } from '../components/Button';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigation } from '../contexts/NavigationContext';
import { notifications } from '../data/notifications';
import type { AlertSeverity } from '../data/notifications';

const severityStyle: Record<AlertSeverity, {icon: string;pill: string;key: 'sevUrgent' | 'sevWarning' | 'sevInfo';}> = {
  urgent: { icon: 'bg-danger-tint text-danger', pill: 'bg-danger text-white', key: 'sevUrgent' },
  warning: { icon: 'bg-warn-tint text-warn-ink', pill: 'bg-warn text-ink', key: 'sevWarning' },
  info: { icon: 'bg-info-tint text-info', pill: 'bg-info-tint text-info', key: 'sevInfo' }
};

export function Notifications() {
  const { t, formatNumber } = useLanguage();
  const { go } = useNavigation();
  const [permission, setPermission] = useState<'ask' | 'granted' | 'dismissed'>('ask');
  const [read, setRead] = useState<string[]>(['n5']);

  const open = (id: string, screen: (typeof notifications)[number]['screen']) => {
    setRead((r) => r.includes(id) ? r : [...r, id]);
    go(screen);
  };

  return (
    <ScreenLayout
      title={t('notifTitle')}
      showBack
      headerRight={
      <button type="button" onClick={() => setRead(notifications.map((n) => n.id))} className="mt-1.5 shrink-0 rounded-lg px-2 py-1.5 text-sm font-semibold text-brand hover:bg-white">
          {t('markAllRead')}
        </button>
      }>
      
      <div className="px-4 pb-8">
        {permission === 'ask' &&
        <section className="mb-5 rounded-3xl bg-white p-5 shadow-card">
            <div className="flex items-start gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-tint text-brand">
                <BellRingIcon className="h-6 w-6" aria-hidden />
              </span>
              <div>
                <h2 className="text-[17px] font-semibold leading-snug text-ink">{t('allowTitle')}</h2>
                <p className="mt-1 text-sm leading-snug text-muted">{t('allowBody')}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <Button variant="secondary" onClick={() => setPermission('dismissed')} className="min-h-12 flex-1">
                {t('notNow')}
              </Button>
              <Button onClick={() => setPermission('granted')} className="min-h-12 flex-1">
                {t('allow')}
              </Button>
            </div>
          </section>
        }

        <ul className="space-y-3">
          {notifications.map((n) => {
            const s = severityStyle[n.severity];
            const Icon = n.icon;
            const unread = !read.includes(n.id);
            return (
              <li key={n.id}>
                <button type="button" onClick={() => open(n.id, n.screen)} className="flex w-full items-start gap-3 rounded-3xl bg-white p-4 text-left shadow-card">
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${s.icon}`}>
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold leading-tight ${s.pill}`}>{t(s.key)}</span>
                      <span className="text-xs text-muted">{t(n.ago.key, { n: formatNumber(n.ago.n) })}</span>
                      {unread && <span className="ml-auto h-2.5 w-2.5 shrink-0 rounded-full bg-brand" aria-label="Unread" />}
                    </span>
                    <span className={`mt-1.5 block text-[15px] leading-snug text-ink ${unread ? 'font-semibold' : 'font-medium'}`}>{t(n.titleKey)}</span>
                    <span className="mt-0.5 block text-sm leading-snug text-muted">{t(n.bodyKey)}</span>
                    <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand">
                      {t('seeDetails')}
                      <ChevronRightIcon className="h-4 w-4" aria-hidden />
                    </span>
                  </span>
                </button>
              </li>);

          })}
        </ul>
      </div>
    </ScreenLayout>);

}