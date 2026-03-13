import { useState } from 'react';
import {
  SettingsRegular, ChevronRightRegular, BluetoothRegular, Battery5Regular,
  ArrowSyncRegular, AlertRegular, QuestionCircleRegular, InfoRegular
} from '@fluentui/react-icons';
import { Award, MessageCircle, Calendar, Star } from 'lucide-react';
import React from 'react';

const wrapIcon = (IconComponent: React.ElementType) => {
  return ({ size, style, ...props }: any) => (
    <IconComponent {...props} style={{ fontSize: size, width: size, height: size, ...style }} />
  );
};

const Settings = wrapIcon(SettingsRegular);
const ChevronRight = wrapIcon(ChevronRightRegular);
const Bluetooth = wrapIcon(BluetoothRegular);
const Battery = wrapIcon(Battery5Regular);
const RefreshCw = wrapIcon(ArrowSyncRegular);
const Bell = wrapIcon(AlertRegular);
const HelpCircle = wrapIcon(QuestionCircleRegular);
const Info = wrapIcon(InfoRegular);
import TopAppBar from '../components/TopAppBar';
import SectionCard from '../components/SectionCard';
import { TASTE_COLORS, TASTE_TYPES, getTasteColor } from '../constants/tasteColors';

import chefHwangJeongin from '../assets/HwangJeongin.png';
import chefLeeEunji from '../assets/LeeEunji.png';
import chefLimJeongsik from '../assets/LimJeongsik.png';

// 나의 미각 수치 데이터
const myTaste = [
  { taste: '단맛', value: 85, maxValue: 100 },
  { taste: '신맛', value: 74, maxValue: 100 },
  { taste: '쓴맛', value: 40, maxValue: 100 },
  { taste: '짠맛', value: 60, maxValue: 100 },
  { taste: '감칠맛', value: 30, maxValue: 100 },
  { taste: '지방맛', value: 55, maxValue: 100 },
];

// 활동 통계
const stats = [
  { label: 'TCS 보정', value: '12회', icon: Award, color: '#FF9900' },
  { label: '피드백', value: '8건', icon: MessageCircle, color: '#B372B4' },
  { label: '이용 기간', value: '3개월', icon: Calendar, color: '#7299FF' },
  { label: '평균 만족도', value: '4.5', icon: Star, color: '#FBC02D' },
];

// 즐겨찾기 셰프
const favoriteChefs = [
  { name: '황정인 셰프', restaurant: '레스토랑 베누', image: chefHwangJeongin, matchRate: 75 },
  { name: '이은지 셰프', restaurant: '숍 리제', image: chefLeeEunji, matchRate: 72 },
  { name: '임정식 셰프', restaurant: '정식당', image: chefLimJeongsik, matchRate: 70 },
];

// 설정 메뉴
const settingsSections = [
  {
    title: '미각 관리',
    items: [
      { label: '미각 재측정', icon: RefreshCw, desc: '테이스틱으로 미각 민감도 다시 측정' },
      { label: '보정 알림 설정', icon: Bell, desc: '다이닝 전 미각 측정 알림' },
    ],
  },
  {
    title: '앱 정보',
    items: [
      { label: '도움말', icon: HelpCircle, desc: 'TCS 사용 가이드' },
      { label: '앱 정보', icon: Info, desc: 'TasteBuddy v1.0.0' },
    ],
  },
];

export default function ProfilePage() {
  return (
    <div className="flex flex-col w-full h-full bg-white">
      <TopAppBar />
      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        <div className="flex flex-col gap-8 p-5 animate-fadeIn">

          {/* 프로필 헤더 */}
          <div className="flex items-center gap-4">
            <div className="relative rounded-full size-[64px]">
              <div className="flex items-center justify-center rounded-full size-[64px] bg-[#FF9900]/20">
                <span className="font-bold text-[24px] text-[#0f0f0f]">JH</span>
              </div>
              <div className="absolute border border-[rgba(15,15,15,0.15)] inset-0 pointer-events-none rounded-full" />
            </div>
            <div className="flex flex-col gap-[2px]">
              <span className="font-bold text-[20px] text-[#0f0f0f]">신준호</span>
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-semibold px-2 py-[2px] rounded-[6px] border border-[#535353] text-[#535353]">
                  Super Taster+
                </span>
                <span className="text-[12px] text-[rgba(15,15,15,0.5)]">80 mM</span>
              </div>
            </div>
            <div className="ml-auto">
              <button className="p-2 rounded-full hover:bg-[#f3f3f3] transition-colors">
                <Settings size={20} className="text-[#3F3F3F]" />
              </button>
            </div>
          </div>

          {/* 테이스틱 기기 상태 */}
          <SectionCard>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="w-[40px] h-[40px] rounded-[12px] bg-[#0f0f0f] flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">TB</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-[14px] text-[#0f0f0f]">테이스틱</span>
                  <span className="text-[11px] text-[rgba(15,15,15,0.5)]">Teastick Pro</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Bluetooth size={14} className="text-[#3F3F3F]" />
                  <span className="text-[11px] text-[#3F3F3F] font-medium">연결됨</span>
                </div>
                <div className="flex items-center gap-1">
                  <Battery size={14} className="text-[#3F3F3F]" />
                  <span className="text-[11px] text-[#3F3F3F] font-medium">87%</span>
                </div>
              </div>
            </div>
            <div className="w-full h-px bg-[#e5e5e5]" />
            <div className="flex items-center justify-between w-full">
              <span className="text-[12px] text-[rgba(15,15,15,0.5)]">마지막 측정</span>
              <span className="text-[12px] text-[#0f0f0f] font-medium">2025.03.08 오후 3:20</span>
            </div>
          </SectionCard>

          {/* 나의 미각 수치 */}
          <div>
            <h3 className="font-bold text-[18px] text-[#0f0f0f] mb-3">나의 미각</h3>
            <SectionCard>
              <div className="flex flex-col gap-3 w-full">
                {myTaste.map((item, idx) => {
                  const color = getTasteColor(item.taste);
                  return (
                    <div key={idx} className="flex items-center gap-3 w-full">
                      <span className="text-[12px] font-medium text-[#0f0f0f] w-[42px]">{item.taste}</span>
                      <div className="flex-1 h-[8px] bg-[#e8e8e8] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700 animate-grow"
                          style={{
                            width: `${(item.value / item.maxValue) * 100}%`,
                            backgroundColor: color,
                            animationDelay: `${idx * 100}ms`,
                            animationFillMode: 'both',
                          }}
                        />
                      </div>
                      <span className="text-[12px] font-bold w-[28px] text-right" style={{ color }}>{item.value}</span>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          </div>

          {/* 활동 요약 */}
          <div>
            <h3 className="font-bold text-[18px] text-[#0f0f0f] mb-3">활동 요약</h3>
            <div className="grid grid-cols-2 gap-3">
              {stats.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <SectionCard key={idx}>
                    <div className="flex items-center gap-2 w-full">
                      <div
                        className="shrink-0 w-[40px] h-[40px] rounded-[10px] flex items-center justify-center"
                        style={{ backgroundColor: `${stat.color}20` }}
                      >
                        <Icon size={18} strokeWidth={1.5} style={{ color: stat.color }} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] text-[rgba(15,15,15,0.5)]">{stat.label}</span>
                        <span className="font-semibold text-[14px] text-[#0f0f0f]">{stat.value}</span>
                      </div>
                    </div>
                  </SectionCard>
                );
              })}
            </div>
          </div>

          {/* 즐겨찾기 셰프 */}
          <div>
            <h3 className="font-bold text-[18px] text-[#0f0f0f] mb-3">즐겨찾기 셰프</h3>
            <div className="flex flex-col gap-3">
              {favoriteChefs.map((chef, idx) => (
                <SectionCard key={idx}>
                  <div className="flex items-center gap-3 w-full">
                    <img
                      src={chef.image}
                      alt={chef.name}
                      className="w-[40px] h-[40px] rounded-[10px] object-cover"
                    />
                    <div className="flex flex-col flex-1">
                      <span className="font-semibold text-[14px] text-[#0f0f0f]">{chef.name}</span>
                      <span className="text-[11px] text-[rgba(15,15,15,0.5)]">{chef.restaurant}</span>
                    </div>
                    <span className="text-[12px] font-semibold text-[#0f0f0f]">{chef.matchRate}%</span>
                    <ChevronRight size={16} className="text-[#AFAFAF]" />
                  </div>
                </SectionCard>
              ))}
            </div>
          </div>

          {/* 설정 */}
          {settingsSections.map((section, sIdx) => (
            <div key={sIdx}>
              <h3 className="font-bold text-[18px] text-[#0f0f0f] mb-3">{section.title}</h3>
              <div className="flex flex-col gap-3">
                {section.items.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <SectionCard key={idx}>
                      <div className="flex items-center gap-3 w-full">
                        <Icon size={18} className="text-[#3F3F3F] shrink-0" />
                        <div className="flex flex-col flex-1">
                          <span className="font-semibold text-[14px] text-[#0f0f0f]">{item.label}</span>
                          <span className="text-[11px] text-[rgba(15,15,15,0.5)]">{item.desc}</span>
                        </div>
                        <ChevronRight size={16} className="text-[#AFAFAF]" />
                      </div>
                    </SectionCard>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="h-6" />
        </div>
      </div>
    </div>
  );
}
