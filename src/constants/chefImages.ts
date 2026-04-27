import chefAnsungjae from '../assets/Ansungjae.png';
import chefHwangJeongin from '../assets/HwangJeongin.png';
import chefHyunseokChoi from '../assets/HyunseokChoi.png';
import chefKimSungil from '../assets/Kimsungil.png';
import chefKwonWoojoong from '../assets/kwonwoojoong.png';
import chefLeeEunji from '../assets/LeeEunji.png';
import chefLeeJun from '../assets/LeeJun.png';
import chefLimJeongsik from '../assets/LimJeongsik.png';
import chefSonJongwon from '../assets/SonJongwon.png';

const CHEF_IMAGE_BY_NAME: Record<string, string> = {
  안성재: chefAnsungjae,
  김성일: chefKimSungil,
  권우중: chefKwonWoojoong,
  손종원: chefSonJongwon,
  이은지: chefLeeEunji,
  이준: chefLeeJun,
  임정식: chefLimJeongsik,
  최현석: chefHyunseokChoi,
  황정인: chefHwangJeongin,
};

export function getChefImageByName(name: string) {
  return CHEF_IMAGE_BY_NAME[name.replace(/\s*셰프$/, '')] ?? null;
}
