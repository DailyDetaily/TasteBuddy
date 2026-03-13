import { useState, useEffect } from 'react';
import { ChevronLeft, MoreHorizontal, Check } from 'lucide-react';
import { Drawer } from 'vaul';
import { motion, AnimatePresence } from 'framer-motion';
import powerOnImage from '../assets/Power On Instructions.png';
import tastickImage from '../assets/Tastick.png';
import tastickConnectImage from '../assets/Tastick Connect.png';
import tbFeedbackVideo from '../assets/video/TB Feedback.mp4';

interface TeastickConnectScreenProps {
    onConnect: () => void;
    onSkip: () => void;
}

type DrawerStep = 'power' | 'connecting' | 'connected';

export default function TeastickConnectScreen({ onConnect, onSkip }: TeastickConnectScreenProps) {
    const [mainStep, setMainStep] = useState(1);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [drawerStep, setDrawerStep] = useState<DrawerStep>('power');
    // Drawer connection sequence simulation
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isDrawerOpen && drawerStep === 'connecting') {
            const randomTime = Math.floor(Math.random() * (8000 - 2000 + 1)) + 2000;
            timer = setTimeout(() => {
                setDrawerStep('connected');
            }, randomTime);
        }
        return () => clearTimeout(timer);
    }, [isDrawerOpen, drawerStep]);

    const handleStartConnection = () => {
        setIsDrawerOpen(true);
        setDrawerStep('power');
    };

    const handleDrawerNext = () => {
        if (drawerStep === 'power') {
            setDrawerStep('connecting');
        } else if (drawerStep === 'connected') {
            setIsDrawerOpen(false);
            // After successful connection, move main step to 2
            setTimeout(() => setMainStep(2), 300);
        }
    };

    const steps = [
        { id: 1, title: '미각 측정 기기 연결', desc: '셰프가 고객님의 입맛을 이해하기 위해 보내드린\n테이스틱을 연결합니다.' },
        { id: 2, title: '미각 측정 및 분석', desc: '고객님의 미각 반응을 기록하며, 셰프에게 전달될 데이터를 조율하고 있습니다.' },
        { id: 3, title: '미각 피드백 및 캘리브레이션', desc: '' },
    ];

    return (
        <div className="flex flex-col w-full h-full bg-white relative font-sans">
            {/* Header */}
            <header className="flex items-center justify-between px-4 h-14 bg-white z-10">
                <button onClick={onSkip} className="p-2 -ml-2 text-black active:opacity-70 transition-opacity">
                    <ChevronLeft strokeWidth={1.5} size={28} />
                </button>
                <button className="p-2 -mr-2 text-black active:opacity-70 transition-opacity">
                    <MoreHorizontal strokeWidth={1.5} size={24} />
                </button>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto px-5 pb-24">
                <div className="mt-6 mb-12 text-center">
                    <h1 className="text-[24px] font-bold leading-tight mb-3 tracking-tight">
                        지금부터 고객님의 미각을<br />정밀하게 측정합니다.
                    </h1>
                    <p className="text-[#666666] text-[14px]">
                        매뉴얼에 따라 측정을 진행해주세요.
                    </p>
                </div>

                {/* Steps List */}
                <div className="flex flex-col gap-3">
                    {steps.map((step) => {
                        const isCompleted = mainStep > step.id;
                        const isActive = mainStep === step.id;

                        let bgColor = 'bg-[#F5F5F5]';
                        if (isActive) bgColor = 'bg-[#F6F6F6] border border-[#E5E5E5]';
                        else if (isCompleted) bgColor = 'bg-[#F5F5F5] opacity-80';

                        return (
                            <div key={step.id} className={`w-full rounded-[20px] p-3 ${bgColor} transition-all duration-300`}>
                                <div className="flex items-start gap-3">
                                    <div className={`w-[24px] h-[24px] rounded-[8px] flex items-center justify-center shrink-0 ${isCompleted || isActive ? 'bg-black text-white' : 'bg-[#AEAEAE] text-white'}`}>
                                        {isCompleted ? <Check size={14} strokeWidth={3} /> : <span className="text-[13px] font-bold">{step.id}</span>}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className={`text-[14px] font-bold tracking-tight ${(isActive) ? 'text-black' : 'text-[#555]'}`}>
                                            {step.title}
                                        </h3>
                                        {isActive && step.desc && (
                                            <p className="text-[12px] text-[#777] mt-1.5 leading-relaxed whitespace-pre-wrap">
                                                {step.desc}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>

            {/* Bottom Sticky Action */}
            <div className="absolute bottom-0 left-0 right-0 w-full px-5 flex flex-col items-center justify-end pb-10 min-h-[140px] z-20 bg-gradient-to-t from-white via-white to-transparent">
                <button
                    onClick={mainStep === 1 ? handleStartConnection : onConnect}
                    className="w-full h-[52px] rounded-[10px] bg-[#0f0f0f] text-white font-medium text-[14px] flex items-center justify-center transition-transform active:scale-[0.98]"
                >
                    {mainStep === 1 ? '연결하기' : '계속하기'}
                </button>
            </div>

            {/* Connection Drawer */}
            <Drawer.Root open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <Drawer.Portal>
                    <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
                    <Drawer.Content className="fixed bottom-0 left-0 right-0 max-w-[1440px] mx-auto bg-white flex flex-col rounded-t-[24px] z-50 h-[85vh] outline-none">
                        {/* Drawer Handle */}
                        <div className="w-full flex justify-center pt-3 pb-2">
                            <div className="w-10 h-1.5 bg-[#E5E5E5] rounded-full" />
                        </div>

                        {/* Drawer Header */}
                        <div className="flex items-center justify-between px-4 pb-4">
                            <button onClick={() => setIsDrawerOpen(false)} className="p-2 text-black">
                                <span className="text-[20px] font-light">✕</span>
                            </button>
                            <button className="p-2 text-black">
                                <MoreHorizontal strokeWidth={1.5} size={24} />
                            </button>
                        </div>

                        {/* Drawer Content Area */}
                        <div className="flex-1 flex flex-col relative overflow-hidden">
                            <AnimatePresence mode="wait">
                                {drawerStep === 'power' && (
                                    <motion.div
                                        key="power"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0, x: -50 }}
                                        transition={{ duration: 0.3 }}
                                        className="absolute inset-0 flex flex-col items-center px-5 pt-10"
                                    >
                                        <h2 className="text-[22px] font-bold text-black mb-2">테이스틱의 전원을 켭니다</h2>
                                        <p className="text-[#666] text-[14px]">밑면의 버튼을 2초간 길게 누르세요.</p>
                                        <div className="flex-1 w-full bg-white rounded-[24px] mt-10 mb-6 flex items-center justify-center relative overflow-hidden">
                                            <img src={powerOnImage} alt="Power On Instructions" className="w-[85%] h-[85%] object-contain" />
                                        </div>
                                    </motion.div>
                                )}

                                {drawerStep === 'connecting' && (
                                    <motion.div
                                        key="connecting"
                                        initial={{ opacity: 0, x: 50 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -50 }}
                                        transition={{ duration: 0.3 }}
                                        className="absolute inset-0 flex flex-col items-center px-5 pt-10"
                                    >
                                        <h2 className="text-[22px] font-bold text-black mb-2">기기를 연결중입니다</h2>
                                        <p className="text-[#666] text-[14px]">연결이 완료되면 녹색 점등이 반짝입니다.</p>

                                        <div className="flex-1 w-full bg-white rounded-[24px] mt-10 mb-6 flex items-center justify-center relative overflow-hidden">
                                            <video
                                                src={tbFeedbackVideo}
                                                autoPlay
                                                loop
                                                muted
                                                playsInline
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                    </motion.div>
                                )}

                                {drawerStep === 'connected' && (
                                    <motion.div
                                        key="connected"
                                        initial={{ opacity: 0, x: 50 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -50 }}
                                        transition={{ duration: 0.3 }}
                                        className="absolute inset-0 flex flex-col items-center px-5 pt-10"
                                    >
                                        <h2 className="text-[22px] font-bold text-black mb-2">테이스틱 연결 완료</h2>
                                        <p className="text-[#666] text-[14px]">테이스틱을 통해 미각 분석을 시작해보세요.</p>

                                        <div className="flex-1 w-full bg-white rounded-[24px] mt-10 mb-6 flex items-center justify-center relative overflow-hidden">
                                            <img src={tastickConnectImage} alt="Teastick device connected" className="w-[85%] h-[85%] object-contain" />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Drawer Bottom Button */}
                        <div className="w-full px-5 flex flex-col items-center justify-end pb-10 pt-4">
                            <button
                                onClick={drawerStep === 'connecting' ? undefined : handleDrawerNext}
                                disabled={drawerStep === 'connecting'}
                                className={`w-full h-[52px] rounded-[10px] font-medium text-[14px] flex items-center justify-center transition-transform active:scale-[0.98] ${drawerStep === 'connecting'
                                        ? 'bg-[#F2F2F2] text-[#AEAEAE] cursor-none shadow-none'
                                        : 'bg-[#0f0f0f] text-white shadow-lg shadow-black/10'
                                    }`}
                            >
                                {drawerStep === 'power' ? '연결하기' : (drawerStep === 'connecting' ? '연결 중...' : '계속하기')}
                            </button>
                        </div>
                    </Drawer.Content>
                </Drawer.Portal>
            </Drawer.Root>
        </div>
    );
}
