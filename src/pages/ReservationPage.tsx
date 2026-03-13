import { useState } from 'react';
import {
  ChevronRightRegular, LocationRegular, ClockRegular, FoodRegular,
  HeartPulseRegular, CheckmarkCircleRegular, CircleRegular, ErrorCircleRegular
} from '@fluentui/react-icons';
import React from 'react';

const wrapIcon = (IconComponent: React.ElementType) => {
  return ({ size, style, ...props }: any) => (
    <IconComponent {...props} style={{ fontSize: size, width: size, height: size, ...style }} />
  );
};

const ChevronRight = wrapIcon(ChevronRightRegular);
const MapPin = wrapIcon(LocationRegular);
const Clock = wrapIcon(ClockRegular);
const Utensils = wrapIcon(FoodRegular);
const Activity = wrapIcon(HeartPulseRegular);
const CheckCircle2 = wrapIcon(CheckmarkCircleRegular);
const Circle = wrapIcon(CircleRegular);
const AlertCircle = wrapIcon(ErrorCircleRegular);
import TopAppBar from '../components/TopAppBar';
import SectionCard from '../components/SectionCard';
import { TASTE_COLORS, getTasteColor } from '../constants/tasteColors';

import chefHwangJeongin from '../assets/HwangJeongin.png';
import chefLeeEunji from '../assets/LeeEunji.png';
import chefLimJeongsik from '../assets/LimJeongsik.png';

type ReservationStatus = 'upcoming' | 'preparing' | 'ready' | 'completed';

interface Reservation {
  id: number;
  restaurant: string;
  chef: string;
  chefImage: string;
  date: string;
  time: string;
  guests: number;
  status: ReservationStatus;
  course: string;
  matchRate: number;
  tcsStatus: string;
  adjustments: { taste: string; change: string }[];
  timeline: { step: string; done: boolean; current?: boolean }[];
}

const reservations: Reservation[] = [
  {
    id: 1,
    restaurant: '레스토랑 베누',
    chef: '황정인',
    chefImage: chefHwangJeongin,
    date: '2025.03.15',
    time: '저녁 7:00',
    guests: 2,
    status: 'preparing',
    course: '시그니처 디너 코스',
    matchRate: 75,
    tcsStatus: '셰프가 보정 전략을 준비 중입니다',
    adjustments: [
      { taste: '감칠맛', change: '+12%' },
      { taste: '짠맛', change: '-8%' },
    ],
    timeline: [
      { step: '예약 확정', done: true },
      { step: '미각 데이터 전달', done: true },
      { step: '셰프 TCS 준비', done: false, current: true },
      { step: '사전 미각 측정', done: false },
      { step: '다이닝 당일', done: false },
    ],
  },
  {
    id: 2,
    restaurant: '숍 리제 (Lysée)',
    chef: '이은지',
    chefImage: chefLeeEunji,
    date: '2025.03.22',
    time: '저녁 6:30',
    guests: 2,
    status: 'upcoming',
    course: '봄 시즌 테이스팅 코스',
    matchRate: 72,
    tcsStatus: '예약이 확정되었습니다',
    adjustments: [
      { taste: '단맛', change: '+15%' },
      { taste: '신맛', change: '+5%' },
    ],
    timeline: [
      { step: '예약 확정', done: true },
      { step: '미각 데이터 전달', done: false, current: true },
      { step: '셰프 TCS 준비', done: false },
      { step: '사전 미각 측정', done: false },
      { step: '다이닝 당일', done: false },
    ],
  },
  {
    id: 3,
    restaurant: '정식당',
    chef: '임정식',
    chefImage: chefLimJeongsik,
    date: '2025.02.28',
    time: '저녁 7:30',
    guests: 4,
    status: 'completed',
    course: '한식 모던 코스',
    matchRate: 70,
    tcsStatus: '다이닝이 완료되었습니다',
    adjustments: [
      { taste: '감칠맛', change: '+10%' },
      { taste: '지방맛', change: '+7%' },
    ],
    timeline: [
      { step: '예약 확정', done: true },
      { step: '미각 데이터 전달', done: true },
      { step: '셰프 TCS 준비', done: true },
      { step: '사전 미각 측정', done: true },
      { step: '다이닝 완료', done: true },
    ],
  },
];

const statusConfig: Record<ReservationStatus, { label: string; color: string; bg: string }> = {
  upcoming: { label: '예약 확정', color: '#3F3F3F', bg: '#F3F3F3' },
  preparing: { label: 'TCS 준비 중', color: '#0f0f0f', bg: '#E8E8E8' },
  ready: { label: '준비 완료', color: '#3F3F3F', bg: '#F3F3F3' },
  completed: { label: '완료', color: '#AFAFAF', bg: '#F3F3F3' },
};

function ReservationCard({ reservation, onSelect }: { reservation: Reservation; onSelect: () => void }) {
  const status = statusConfig[reservation.status];

  return (
    <SectionCard onClick={onSelect}>
      {/* 상태 배지 + 레스토랑 */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-bold px-2 py-[3px] rounded-full"
            style={{ color: status.color, backgroundColor: status.bg }}
          >
            {status.label}
          </span>
          <span className="font-bold text-[15px] text-[#0f0f0f]">{reservation.restaurant}</span>
        </div>
        <ChevronRight size={16} className="text-[#AFAFAF]" />
      </div>

      {/* 셰프 정보 */}
      <div className="flex items-center gap-3 w-full">
        <img
          src={reservation.chefImage}
          alt={reservation.chef}
          className="w-[40px] h-[40px] rounded-[8px] object-cover"
        />
        <div className="flex flex-col">
          <span className="font-semibold text-[13px] text-[#0f0f0f]">{reservation.chef} 셰프</span>
          <span className="text-[11px] text-[rgba(15,15,15,0.5)]">매칭률 {reservation.matchRate}%</span>
        </div>
      </div>

      {/* 예약 정보 */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 w-full">
        <div className="flex items-center gap-1">
          <Clock size={12} className="text-[rgba(15,15,15,0.4)]" />
          <span className="text-[11px] text-[rgba(15,15,15,0.6)]">{reservation.date} {reservation.time}</span>
        </div>
        <div className="flex items-center gap-1">
          <Utensils size={12} className="text-[rgba(15,15,15,0.4)]" />
          <span className="text-[11px] text-[rgba(15,15,15,0.6)]">{reservation.course}</span>
        </div>
      </div>

      {/* TCS 상태 */}
      <div className="flex items-center gap-2 w-full bg-white rounded-[12px] px-3 py-2">
        <Activity size={14} style={{ color: status.color }} />
        <span className="text-[12px] text-[#0f0f0f]">{reservation.tcsStatus}</span>
      </div>

      {/* 예상 보정 태그 */}
      <div className="flex gap-2 flex-wrap">
        {reservation.adjustments.map((adj, idx) => (
          <span
            key={idx}
            className="px-2 py-1 rounded-full bg-white text-[10px] font-medium flex items-center gap-1"
          >
            <span className="text-[#0f0f0f]">{adj.taste}</span>
            <span style={{ color: getTasteColor(adj.taste) }} className="font-semibold">{adj.change}</span>
          </span>
        ))}
      </div>
    </SectionCard>
  );
}

function ReservationDetail({ reservation, onBack }: { reservation: Reservation; onBack: () => void }) {
  const status = statusConfig[reservation.status];

  return (
    <div className="flex flex-col w-full h-full bg-white animate-slideIn">
      <TopAppBar title={reservation.restaurant} showBack onBack={onBack} />
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="flex flex-col gap-[24px] p-[20px]">
          {/* 셰프 + 상태 */}
          <div className="flex items-center gap-4">
            <img
              src={reservation.chefImage}
              alt={reservation.chef}
              className="w-[56px] h-[56px] rounded-[14px] object-cover"
            />
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[18px]">{reservation.chef} 셰프</span>
                <span
                  className="text-[10px] font-bold px-2 py-[2px] rounded-full"
                  style={{ color: status.color, backgroundColor: status.bg }}
                >
                  {status.label}
                </span>
              </div>
              <span className="text-[13px] text-[rgba(15,15,15,0.5)]">
                {reservation.course} · {reservation.guests}명
              </span>
            </div>
          </div>

          {/* 예약 정보 카드 */}
          <SectionCard>
            <div className="flex flex-col gap-3 w-full">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-[#3F3F3F]" />
                <span className="text-[14px] font-medium">{reservation.date} {reservation.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-[#3F3F3F]" />
                <span className="text-[14px] font-medium">{reservation.restaurant}</span>
              </div>
              <div className="flex items-center gap-2">
                <Utensils size={16} className="text-[#3F3F3F]" />
                <span className="text-[14px] font-medium">{reservation.course}</span>
              </div>
            </div>
          </SectionCard>

          {/* 다이닝 타임라인 */}
          <div>
            <h3 className="font-bold text-[18px] text-[#0f0f0f] mb-4">다이닝 타임라인</h3>
            <div className="flex flex-col gap-0">
              {reservation.timeline.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    {step.done ? (
                      <CheckCircle2 size={20} className="text-[#0f0f0f] shrink-0" />
                    ) : step.current ? (
                      <div className="relative">
                        <Circle size={20} className="text-[#3F3F3F] shrink-0" />
                        <div className="absolute inset-[4px] rounded-full bg-[#3F3F3F] animate-pulse-soft" />
                      </div>
                    ) : (
                      <Circle size={20} className="text-[#e0e0e0] shrink-0" />
                    )}
                    {idx < reservation.timeline.length - 1 && (
                      <div className={`w-[2px] h-[28px] ${step.done ? 'bg-[#0f0f0f]' : 'bg-[#e0e0e0]'}`} />
                    )}
                  </div>
                  <div className="pb-6">
                    <span className={`text-[14px] ${step.current ? 'font-bold text-[#0f0f0f]' : step.done ? 'font-medium text-[#0f0f0f]' : 'font-medium text-[#AFAFAF]'}`}>
                      {step.step}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 예상 미각 보정 */}
          <div>
            <h3 className="font-bold text-[18px] text-[#0f0f0f] mb-3">예상 미각 보정</h3>
            <SectionCard>
              <p className="text-[13px] text-[rgba(15,15,15,0.6)] leading-relaxed w-full">
                고객님의 미각 프로필을 기반으로 셰프가 다음과 같이 보정할 예정입니다.
              </p>
              <div className="flex flex-col gap-3 w-full mt-1">
                {reservation.adjustments.map((adj, idx) => {
                  const color = getTasteColor(adj.taste);
                  const value = parseInt(adj.change);
                  const absValue = Math.abs(value);
                  return (
                    <div key={idx} className="flex items-center gap-3 w-full">
                      <div className="w-[6px] h-[32px] rounded-full" style={{ backgroundColor: color }} />
                      <span className="font-medium text-[14px] text-[#0f0f0f] w-[50px]">{adj.taste}</span>
                      <div className="flex-1 h-[8px] bg-[#e8e8e8] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full animate-grow"
                          style={{
                            width: `${absValue * 5}%`,
                            backgroundColor: color,
                            animationDelay: `${idx * 200}ms`,
                            animationFillMode: 'both',
                          }}
                        />
                      </div>
                      <span className="font-bold text-[13px] w-[40px] text-right" style={{ color }}>{adj.change}</span>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          </div>

          {/* 미각 컨디션 알림 */}
          {reservation.status !== 'completed' && (
            <div className="bg-[#F3F3F3] rounded-[20px] p-[12px] flex items-start gap-3">
              <AlertCircle size={18} className="text-[#3F3F3F] shrink-0 mt-[2px]" />
              <div className="flex flex-col gap-1">
                <span className="font-bold text-[13px] text-[#0f0f0f]">사전 미각 측정 권장</span>
                <span className="text-[12px] text-[rgba(15,15,15,0.6)]">
                  다이닝 전 최신 미각 데이터로 업데이트하면 더 정밀한 보정이 가능합니다.
                </span>
                <button className="mt-2 bg-[#0f0f0f] text-white text-[12px] font-semibold px-4 py-2 rounded-[10px] self-start hover:bg-[#333] transition-colors active:scale-[0.97]">
                  테이스틱으로 측정하기
                </button>
              </div>
            </div>
          )}

          <div className="h-6" />
        </div>
      </div>
    </div>
  );
}

export default function ReservationPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selectedReservation = reservations.find(r => r.id === selectedId);

  if (selectedReservation) {
    return <ReservationDetail reservation={selectedReservation} onBack={() => setSelectedId(null)} />;
  }

  const upcoming = reservations.filter(r => r.status !== 'completed');
  const completed = reservations.filter(r => r.status === 'completed');

  return (
    <div className="flex flex-col w-full h-full bg-white">
      <TopAppBar />
      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        <div className="flex flex-col gap-8 p-5 animate-fadeIn">
          <h1 className="font-bold text-[24px] text-[#0f0f0f] tracking-[-0.24px]">다이닝 예약</h1>

          {/* 다가오는 예약 */}
          {upcoming.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="font-semibold text-[14px] text-[rgba(15,15,15,0.5)]">다가오는 다이닝</h3>
              {upcoming.map((r) => (
                <ReservationCard key={r.id} reservation={r} onSelect={() => setSelectedId(r.id)} />
              ))}
            </div>
          )}

          {/* 지난 예약 */}
          {completed.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="font-semibold text-[14px] text-[rgba(15,15,15,0.5)]">지난 다이닝</h3>
              {completed.map((r) => (
                <ReservationCard key={r.id} reservation={r} onSelect={() => setSelectedId(r.id)} />
              ))}
            </div>
          )}

          <div className="h-6" />
        </div>
      </div>
    </div>
  );
}
