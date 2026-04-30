import chefAnsungjae from '../assets/Ansungjae.png';
import chefHwangJeongin from '../assets/HwangJeongin.png';
import chefHyunseokChoi from '../assets/HyunseokChoi.png';
import chefJosephLidgerwood from '../assets/JosephLidgerwood.png';
import chefKangMingoo from '../assets/KangMingoo.png';
import chefKimDaeChun from '../assets/KimDaeChun.png';
import chefKimJinhyuk from '../assets/KimJinhyuk.png';
import chefKimSungil from '../assets/Kimsungil.png';
import chefKwonWoojoong from '../assets/kwonwoojoong.png';
import chefLeeEunji from '../assets/LeeEunji.png';
import chefLeeJun from '../assets/LeeJun.png';
import chefLimJeongsik from '../assets/LimJeongsik.png';
import chefOnjiumChefs from '../assets/OnjiumChefs.png';
import chefParkKyungjae from '../assets/ParkKyungjae.png';
import chefSonJongwon from '../assets/SonJongwon.png';

const CHEF_IMAGE_BY_NAME: Record<string, string> = {
  안성재: chefAnsungjae,
  강민구: chefKangMingoo,
  'Kang Mingoo': chefKangMingoo,
  김대천: chefKimDaeChun,
  'Kim Dae-chun': chefKimDaeChun,
  김진혁: chefKimJinhyuk,
  'Kim Jin-hyuk': chefKimJinhyuk,
  'Jin-hyuk Kim': chefKimJinhyuk,
  김성일: chefKimSungil,
  'Kim Sung-il': chefKimSungil,
  'Sung-Il Kim': chefKimSungil,
  권우중: chefKwonWoojoong,
  박경재: chefParkKyungjae,
  'Park Kyung-jae': chefParkKyungjae,
  손종원: chefSonJongwon,
  이은지: chefLeeEunji,
  이준: chefLeeJun,
  임정식: chefLimJeongsik,
  최현석: chefHyunseokChoi,
  황정인: chefHwangJeongin,
  '조셉 리저우드': chefJosephLidgerwood,
  'Joseph Lidgerwood': chefJosephLidgerwood,
  '조은희 / 박성배': chefOnjiumChefs,
  'Cho Eun-hee / Park Sung-bae': chefOnjiumChefs,
  'Eun-hee Cho and Sung-bae Park': chefOnjiumChefs,
};

export function getChefImageByName(name: string) {
  return CHEF_IMAGE_BY_NAME[name.replace(/\s*셰프$/, '')] ?? null;
}
