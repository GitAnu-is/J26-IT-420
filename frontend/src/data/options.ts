import { SproutIcon, ClipboardCheckIcon, TruckIcon } from 'lucide-react';
import type { Option } from '../types/forms';

export const roleOptions: Option[] = [
{ value: 'farmer', labelKey: 'roleFarmer', descKey: 'roleFarmerDesc', icon: SproutIcon },
{ value: 'officer', labelKey: 'roleOfficer', descKey: 'roleOfficerDesc', icon: ClipboardCheckIcon },
{ value: 'transport', labelKey: 'roleTransport', descKey: 'roleTransportDesc', icon: TruckIcon }];


export const districtOptions: Option[] = [
{ value: 'kurunegala', labelKey: 'placeKurunegala' },
{ value: 'gampaha', labelKey: 'placeGampaha' },
{ value: 'matale', labelKey: 'placeMatale' },
{ value: 'kandy', labelKey: 'placeKandy' },
{ value: 'kegalle', labelKey: 'placeKegalle' },
{ value: 'monaragala', labelKey: 'placeMonaragala' },
{ value: 'anuradhapura', labelKey: 'placeAnuradhapura' },
{ value: 'dambulla', labelKey: 'placeDambulla' },
{ value: 'colombo', labelKey: 'placeColombo' }];


// AgriGuard web scope: banana, pineapple and black pepper only.
export const cropOptions: Option[] = [
{ value: 'banana', labelKey: 'cropBanana' },
{ value: 'pineapple', labelKey: 'cropPineapple' },
{ value: 'pepper', labelKey: 'cropPepper' }];


export const seasonOptions: Option[] = [
{ value: 'maha', labelKey: 'seasonMaha' },
{ value: 'yala', labelKey: 'seasonYala' }];


export const soilOptions: Option[] = [
{ value: 'loam', labelKey: 'soilLoam' },
{ value: 'clay', labelKey: 'soilClay' },
{ value: 'sandy', labelKey: 'soilSandy' },
{ value: 'laterite', labelKey: 'soilLaterite' }];


export const stageOptions: Option[] = [
{ value: 'flowering', labelKey: 'stageFlowering' },
{ value: 'fruiting', labelKey: 'stageFruiting' },
{ value: 'maturing', labelKey: 'stageMaturing' }];


export const conditionOptions: Option[] = [
{ value: 'good', labelKey: 'condGood' },
{ value: 'fair', labelKey: 'condFair' },
{ value: 'poor', labelKey: 'condPoor' }];


export const unitOptions: Option[] = [
{ value: 'kg', labelKey: 'unitKg' },
{ value: 'crates', labelKey: 'unitCrates' },
{ value: 'tonnes', labelKey: 'unitTonnes' }];


export const packagingOptions: Option[] = [
{ value: 'polysack', labelKey: 'packPolysack' },
{ value: 'crate', labelKey: 'packCrate' },
{ value: 'wooden', labelKey: 'packWooden' },
{ value: 'cardboard', labelKey: 'packCardboard' }];


export const methodOptions: Option[] = [
{ value: 'loose', labelKey: 'methodLoose' },
{ value: 'layered', labelKey: 'methodLayered' },
{ value: 'wrapped', labelKey: 'methodWrapped' }];


export const storageOptions: Option[] = [
{ value: 'open', labelKey: 'storeOpen' },
{ value: 'shade', labelKey: 'storeShade' },
{ value: 'cold', labelKey: 'storeCold' }];


export const vehicleOptions: Option[] = [
{ value: 'open-lorry', labelKey: 'vehOpenLorry' },
{ value: 'covered-lorry', labelKey: 'vehCovered' },
{ value: 'refrigerated', labelKey: 'vehCold' },
{ value: 'tractor', labelKey: 'vehTractor' }];


export const roadOptions: Option[] = [
{ value: 'good', labelKey: 'roadGood' },
{ value: 'mixed', labelKey: 'roadMixed' },
{ value: 'poor', labelKey: 'roadPoor' }];


export const handlingOptions: Option[] = [
{ value: 'careful', labelKey: 'handCareful' },
{ value: 'normal', labelKey: 'handNormal' },
{ value: 'rough', labelKey: 'handRough' }];