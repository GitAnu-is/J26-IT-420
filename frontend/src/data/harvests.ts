import { images } from './images';
import type { TranslationKey } from './translations/en';

export const upcomingHarvests: {id: string;cropKey: TranslationKey;field: string;daysLeft: number;progress: number;image: string;}[] = [
{ id: 'u1', cropKey: 'cropBanana', field: 'A', daysLeft: 10, progress: 0.78, image: images.bananas },
{ id: 'u2', cropKey: 'cropPineapple', field: 'B', daysLeft: 24, progress: 0.55, image: images.pineapples },
{ id: 'u3', cropKey: 'cropPepper', field: 'C', daysLeft: 31, progress: 0.4, image: images.pepper }];