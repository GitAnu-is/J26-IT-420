import { images } from './images';
import type { FeatureId } from './features';
import type { TranslationKey } from './translations/en';

export const onboardingSlides: {featureId: FeatureId;image: string;titleKey: TranslationKey;bodyKey: TranslationKey;}[] = [
{ featureId: 'crop', image: images.farm, titleKey: 'ob1Title', bodyKey: 'ob1Body' },
{ featureId: 'disease', image: images.bananaLeaf, titleKey: 'ob2Title', bodyKey: 'ob2Body' },
{ featureId: 'harvest', image: images.harvestFarmer, titleKey: 'ob3Title', bodyKey: 'ob3Body' },
{ featureId: 'transport', image: images.transport, titleKey: 'ob4Title', bodyKey: 'ob4Body' }];