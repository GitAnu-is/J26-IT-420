import React, { useState } from 'react';
import { CheckIcon, ChevronRightIcon, LogOutIcon, MailIcon, UserRoundPenIcon, KeyRoundIcon } from 'lucide-react';
import { ScreenLayout } from '../components/ScreenLayout';
import { Field } from '../components/Field';
import { SelectInput } from '../components/SelectInput';
import { ChoiceChips } from '../components/ChoiceChips';
import { Toggle } from '../components/Toggle';
import { useLanguage } from '../contexts/LanguageContext';
import type { Locale } from '../contexts/LanguageContext';
import { useNavigation } from '../contexts/NavigationContext';
import { useAuth } from '../contexts/AuthContext';
import { initials, roleKey } from '../utils/user';
import { languages } from '../data/languages';
import { cropOptions, districtOptions } from '../data/options';

export function Settings() {
  const { t, locale, setLocale } = useLanguage();
  const { reset } = useNavigation();
  const { user, logout } = useAuth();
  const [district, setDistrict] = useState('kurunegala');
  const [crops, setCrops] = useState<string[]>(['banana', 'pineapple', 'pepper']);
  const [alerts, setAlerts] = useState({ weather: true, harvest: true, disease: true, transport: true });

  const toggleCrop = (v: string) => setCrops((c) => c.includes(v) ? c.filter((x) => x !== v) : [...c, v]);

  return (
    <ScreenLayout title={t('settingsTitle')} showBack>
      <div className="space-y-6 px-4 pb-10">
        <section className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-card">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-brand text-xl font-semibold text-white" aria-hidden>
            {initials(user?.name)}
          </span>
          <div className="min-w-0">
            <p className="text-lg font-semibold leading-snug text-ink">{user?.name}</p>
            <p className="text-sm text-muted">{t(roleKey(user?.role))}</p>
            <p className="mt-0.5 flex items-center gap-1 text-sm text-muted">
              <MailIcon className="h-3.5 w-3.5" aria-hidden />
              {user?.email}
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-[17px] font-semibold leading-snug text-ink">{t('language')}</h2>
          <p className="mb-3 text-sm text-muted">{t('languageNote')}</p>
          <div role="radiogroup" aria-label={t('language')} className="grid grid-cols-3 gap-2.5">
            {languages.map((lang) => {
              const selected = locale === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  lang={lang.code}
                  onClick={() => setLocale(lang.code as Locale)}
                  className={`relative flex min-h-[76px] flex-col items-center justify-center rounded-2xl border-2 px-2 py-3 transition-[border-color,background-color] duration-150 ease-out ${
                  selected ? 'border-brand bg-brand-soft' : 'border-line bg-white'}`
                  }>
                  
                  {selected && <CheckIcon className="absolute right-2 top-2 h-4 w-4 text-brand" aria-hidden />}
                  <span className="text-lg font-semibold leading-snug text-ink">{lang.native}</span>
                  <span className="text-xs text-muted" lang="en">
                    {lang.english}
                  </span>
                </button>);

            })}
          </div>
        </section>

        <section>
          <Field label={t('preferredLocation')} htmlFor="pref-district">
            <SelectInput id="pref-district" value={district} onChange={setDistrict} options={districtOptions} />
          </Field>
          <Field label={t('cropPrefs')}>
            <ChoiceChips name={t('cropPrefs')} options={cropOptions} value={crops} onChange={toggleCrop} multiple />
          </Field>
        </section>

        <section>
          <h2 className="mb-3 text-[17px] font-semibold leading-snug text-ink">{t('notifSettings')}</h2>
          <div className="divide-y divide-line overflow-hidden rounded-3xl bg-white shadow-card">
            <Toggle label={t('notifWeather')} checked={alerts.weather} onChange={(v) => setAlerts((a) => ({ ...a, weather: v }))} />
            <Toggle label={t('notifHarvest')} checked={alerts.harvest} onChange={(v) => setAlerts((a) => ({ ...a, harvest: v }))} />
            <Toggle label={t('notifDisease')} checked={alerts.disease} onChange={(v) => setAlerts((a) => ({ ...a, disease: v }))} />
            <Toggle label={t('notifTransport')} checked={alerts.transport} onChange={(v) => setAlerts((a) => ({ ...a, transport: v }))} />
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-[17px] font-semibold leading-snug text-ink">{t('account')}</h2>
          <div className="divide-y divide-line overflow-hidden rounded-3xl bg-white shadow-card">
            {[
            { icon: UserRoundPenIcon, label: t('editProfile') },
            { icon: KeyRoundIcon, label: t('changePassword') }].
            map(({ icon: Icon, label }) =>
            <button key={label} type="button" className="flex min-h-14 w-full items-center gap-3 px-4 text-left hover:bg-canvas">
                <Icon className="h-5 w-5 text-brand" aria-hidden />
                <span className="flex-1 text-[15px] font-medium text-ink">{label}</span>
                <ChevronRightIcon className="h-5 w-5 text-muted" aria-hidden />
              </button>
            )}
            <button type="button" onClick={() => {logout();reset('login');}} className="flex min-h-14 w-full items-center gap-3 px-4 text-left text-danger hover:bg-canvas">
              <LogOutIcon className="h-5 w-5" aria-hidden />
              <span className="flex-1 text-[15px] font-semibold">{t('logout')}</span>
            </button>
          </div>
        </section>
      </div>
    </ScreenLayout>);

}