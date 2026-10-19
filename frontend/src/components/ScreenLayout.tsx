import React from 'react';
import { ArrowLeftIcon } from 'lucide-react';
import { BottomNav } from './BottomNav';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigation } from '../contexts/NavigationContext';

interface ScreenLayoutProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  showNav?: boolean;
  scroll?: boolean;
  wide?: boolean;
  headerRight?: React.ReactNode;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export function ScreenLayout({
  title,
  subtitle,
  showBack,
  showNav = true,
  scroll = true,
  wide = false,
  headerRight,
  action,
  footer,
  children
}: ScreenLayoutProps) {
  const { t } = useLanguage();
  const { back } = useNavigation();
  const width = wide ? 'max-w-6xl' : 'max-w-3xl';
  return (
    <div className="flex h-full flex-col bg-canvas">
      {title && (
        <header className={`mx-auto flex w-full ${width} items-start justify-between gap-4 px-4 pb-3 pt-3 lg:px-8 lg:pt-8`}>
          {showBack && (
            <button
              type="button"
              onClick={back}
              aria-label={t('back')}
              className="-ml-1 grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink hover:bg-white"
            >
              <ArrowLeftIcon className="h-6 w-6" aria-hidden />
            </button>
          )}
          <div className="min-w-0 flex-1 py-1">
            <h1 className="text-xl font-bold leading-snug text-ink lg:text-2xl">{title}</h1>
            {subtitle && <p className="mt-0.5 text-xs leading-snug text-muted lg:text-sm">{subtitle}</p>}
          </div>
          {(action || headerRight) && (
            <div className="shrink-0 pt-0.5">
              {action || headerRight}
            </div>
          )}
        </header>
      )}

      <div className={`min-h-0 flex-1 ${scroll ? 'no-scrollbar overflow-y-auto' : ''}`}>
        <div className={`mx-auto w-full ${width} lg:px-4 ${scroll ? 'lg:pt-2' : 'h-full'}`}>{children}</div>
      </div>
      {footer &&
      <div className="border-t border-line bg-white">
          <div className={`mx-auto w-full ${width} px-4 py-3 lg:px-8`}>{footer}</div>
        </div>
      }
      {showNav &&
      <div className="lg:hidden">
          <BottomNav />
        </div>
      }
    </div>);

}