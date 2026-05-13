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
import { resolvePublicMediaPath } from '../lib/mediaAssets';

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

const CHEF_MEDIA_PATH_BY_NAME: Record<string, string> = {
  안성재: 'chefs/ahn-sung-jae.png',
  강민구: 'chefs/kang-mingoo.png',
  'Kang Mingoo': 'chefs/kang-mingoo.png',
  김대천: 'chefs/kim-dae-chun.png',
  'Kim Dae-chun': 'chefs/kim-dae-chun.png',
  김진혁: 'chefs/kim-jin-hyuk.png',
  'Kim Jin-hyuk': 'chefs/kim-jin-hyuk.png',
  'Jin-hyuk Kim': 'chefs/kim-jin-hyuk.png',
  김성일: 'chefs/kim-sung-il.png',
  'Kim Sung-il': 'chefs/kim-sung-il.png',
  'Sung-Il Kim': 'chefs/kim-sung-il.png',
  권우중: 'chefs/kwon-woo-joong.png',
  박경재: 'chefs/park-kyung-jae.png',
  'Park Kyung-jae': 'chefs/park-kyung-jae.png',
  손종원: 'chefs/son-jong-won.png',
  이은지: 'chefs/lee-eun-ji.png',
  이준: 'chefs/lee-jun.png',
  임정식: 'chefs/yim-jung-sik.png',
  최현석: 'chefs/choi-hyun-seok.png',
  황정인: 'chefs/hwang-jeong-in.png',
  '조셉 리저우드': 'chefs/joseph-lidgerwood.png',
  'Joseph Lidgerwood': 'chefs/joseph-lidgerwood.png',
  '조은희 / 박성배': 'chefs/cho-eun-hee-park-sung-bae.png',
  'Cho Eun-hee / Park Sung-bae': 'chefs/cho-eun-hee-park-sung-bae.png',
  'Eun-hee Cho and Sung-bae Park': 'chefs/cho-eun-hee-park-sung-bae.png',
};

export function getChefImageByName(name: string) {
  const normalizedName = name.replace(/\s*셰프$/, '');
  const mediaPath = CHEF_MEDIA_PATH_BY_NAME[normalizedName];

  return (mediaPath ? resolvePublicMediaPath(mediaPath) : null) ??
    CHEF_IMAGE_BY_NAME[normalizedName] ??
    null;
}
