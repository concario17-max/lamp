import { X } from 'lucide-react';

interface CompendiumModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CompendiumModal = ({ isOpen, onClose }: CompendiumModalProps) => {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm transition-opacity duration-300">
            <div className="relative flex max-h-[90vh] w-full max-w-[52rem] flex-col overflow-hidden rounded-[1.75rem] border border-gold-border/45 bg-[#FDFBF7] shadow-[0_32px_80px_-28px_rgba(0,0,0,0.5)] dark:bg-dark-surface">
                <div className="flex items-center justify-between border-b border-gold-border/20 px-5 py-4 sm:px-6 sm:py-5">
                    <h2 className="font-display text-[1.25rem] tracking-[0.08em] text-gold-primary sm:text-[1.5rem]">Compendium</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="-mr-1 rounded-full p-2 text-gold-primary transition-colors hover:bg-gold-surface dark:hover:bg-dark-bg"
                        aria-label="Close"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="custom-scrollbar flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
                    <div className="prose max-w-none break-keep font-noto-kr text-[15px] leading-relaxed text-[#5B7282] dark:prose-invert sm:text-base">
                        <p>
                            <strong className="text-[#1C2B36]">Bhagavad Gita</strong>는 흔들리는 전장에서 시작해, 행동과 지혜, 헌신과 해탈을 하나의 흐름으로 묶어주는 책이야.
                            이 앱은 한 구절씩 읽고, 발음과 번역, 주석과 오디오를 같이 보는 데 초점을 맞춘다.
                        </p>

                        <p>
                            왼쪽 패널은 현재 구절의 핵심 번역을 빠르게 보여주고, 오른쪽 패널은 장문 commentary와 학습만화 이미지를 이어 붙여서 전체 맥락을 잡게 돕는다.
                            각 장은 18장 전체 구조를 따라 이동하고, 오디오는 데이터에 들어 있는 원본 경로를 그대로 사용한다.
                        </p>

                        <div className="rounded-r-md border-l-4 border-gold-primary bg-[#F5EFE6] p-5 dark:bg-[#222]">
                            <h3 className="mb-2 font-bold text-[#1C2B36] dark:text-gold-light">읽는 방식</h3>
                            <p className="m-0">
                                먼저 산스크리트와 발음을 보고, 번역을 훑은 뒤, commentary를 펼쳐서 문맥을 확인해. 필요하면 학습만화로 넘어가서 장 전체의 흐름을 다시 붙잡으면 된다.
                            </p>
                        </div>

                        <h3 className="border-b border-gold-border/20 pb-2 text-lg font-bold text-gold-primary">장 구성</h3>
                        <ul className="list-disc space-y-3 pl-5 marker:text-gold-primary">
                            <li>
                                <strong className="text-[#1C2B36]">1장</strong>
                                <br />
                                전장의 혼란과 첫 질문이 시작점이다.
                            </li>
                            <li>
                                <strong className="text-[#1C2B36]">2장</strong>
                                <br />
                                지혜와 수행의 뼈대를 세운다.
                            </li>
                            <li>
                                <strong className="text-[#1C2B36]">3장 이후</strong>
                                <br />
                                행동, 헌신, 비전, 해탈이 순서대로 넓어진다.
                            </li>
                        </ul>

                        <h3 className="border-b border-gold-border/20 pb-2 text-lg font-bold text-gold-primary">사용 팁</h3>
                        <ul className="list-disc space-y-2 pl-5 marker:text-gold-primary">
                            <li>장과 절은 상단 선택기로 빠르게 이동할 수 있다.</li>
                            <li>오디오가 있으면 원본 URL을 그대로 재생한다.</li>
                            <li>commentary 패널은 데이터에 있는 긴 설명을 우선으로 보여준다.</li>
                            <li>학습만화는 가능한 장에만 보이고, 없는 장은 텍스트 설명으로 대체한다.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompendiumModal;
