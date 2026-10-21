import React from "react";
import {
  HouseIcon,
  SproutIcon,
  ScanSearchIcon,
  CalendarClockIcon,
  LayoutGridIcon,
  TruckIcon,
  PackageIcon,
  HistoryIcon,
  BoxIcon
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { useNavigation } from "../contexts/NavigationContext";
import { useAuth } from "../contexts/AuthContext";
import { getNormalizedRole } from "../utils/user";
import { TranslationKey } from "../data/translations/en";
import { ScreenId, TabId } from "../types/navigation";

interface NavItem {
  tab: TabId;
  screen: ScreenId;
  icon: typeof BoxIcon;
  labelKey: TranslationKey;
}

export function BottomNav() {
  const { t } = useLanguage();
  const { tab, reset } = useNavigation();
  const { user } = useAuth();
  const role = getNormalizedRole(user?.role);

  let items: NavItem[] = [];

  if (role === 'TRANSPORT_OPERATOR') {
    items = [
      { tab: 'home', screen: 'home', icon: HouseIcon, labelKey: 'navHome' },
      { tab: 'transport', screen: 'transport-form', icon: TruckIcon, labelKey: 'transitRisk' },
      { tab: 'packaging', screen: 'packaging', icon: PackageIcon, labelKey: 'navPackaging' },
      { tab: 'history', screen: 'history', icon: HistoryIcon, labelKey: 'historyTitle' },
      { tab: 'more', screen: 'more', icon: LayoutGridIcon, labelKey: 'navMore' }
    ];
  } else if (role === 'AGRICULTURAL_OFFICER') {
    items = [
      { tab: 'home', screen: 'home', icon: HouseIcon, labelKey: 'navHome' },
      { tab: 'disease', screen: 'disease-capture', icon: ScanSearchIcon, labelKey: 'navDisease' },
      { tab: 'crop', screen: 'crop-form', icon: SproutIcon, labelKey: 'navCrop' },
      { tab: 'harvest', screen: 'harvest-form', icon: CalendarClockIcon, labelKey: 'navHarvest' },
      { tab: 'more', screen: 'more', icon: LayoutGridIcon, labelKey: 'navMore' }
    ];
  } else {
    items = [
      { tab: 'home', screen: 'home', icon: HouseIcon, labelKey: 'navHome' },
      { tab: 'crop', screen: 'crop-form', icon: SproutIcon, labelKey: 'navCrop' },
      { tab: 'disease', screen: 'disease-capture', icon: ScanSearchIcon, labelKey: 'navDisease' },
      { tab: 'harvest', screen: 'harvest-form', icon: CalendarClockIcon, labelKey: 'navHarvest' },
      { tab: 'more', screen: 'more', icon: LayoutGridIcon, labelKey: 'navMore' }
    ];
  }

  return (
    <nav aria-label="Main" className="grid grid-cols-5 border-t border-line bg-white px-1 pb-3 pt-2">
      {items.map(({ tab: id, screen, icon: Icon, labelKey }) => {
        const active = tab === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => reset(screen)}
            aria-current={active ? 'page' : undefined}
            className="flex flex-col items-center gap-1 px-0.5 focus-visible:outline-none"
          >
            <span
              className={`grid h-8 w-14 place-items-center rounded-full transition-colors duration-150 ease-out ${
                active ? 'bg-brand-tint text-brand' : 'text-muted'
              }`}
            >
              <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.3 : 1.9} aria-hidden />
            </span>
            <span
              className={`text-center text-[11px] leading-tight ${
                active ? 'font-semibold text-brand' : 'text-muted'
              }`}
            >
              {t(labelKey)}
            </span>
          </button>
        );
      })}
    </nav>
  );
}