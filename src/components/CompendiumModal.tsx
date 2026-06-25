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
                            <strong className="text-[#1C2B36]">보리도등론(菩提道燈論)</strong>은 아티샤(Atiśa) 존자가 저술한 대승불교의 핵심 논서로, 삼사부(三士夫) 사상을 바탕으로 깨달음에 이르는 단계적 수행 체계를 밝혀줍니다. 이 앱은 보리도등론의 게송과 번역, 티벳어 원문 및 오디오를 편리하게 감상할 수 있도록 제작되었습니다.
                        </p>

                        <p>
                            현재 구절의 티벳어 원문과 한글 발음, 단어별 번역 및 한글/영어 완역본을 직관적으로 확인하고, 원어 오디오 독송 음원을 통해 경전을 깊이 음미해 볼 수 있습니다.
                        </p>

                        <div className="rounded-r-md border-l-4 border-gold-primary bg-[#F5EFE6] p-5 dark:bg-[#222]">
                            <h3 className="mb-2 font-bold text-[#1C2B36] dark:text-gold-light">읽는 방식</h3>
                            <p className="m-0">
                                상단의 장 및 게송 선택기를 통해 원하시는 구절로 이동하신 후, 티벳어 원문 독송과 발음을 낭독해 보고, 제공되는 단어 해설과 다양한 번역들을 비교하며 학습해 보세요.
                            </p>
                        </div>

                        <h3 className="border-b border-gold-border/20 pb-2 text-lg font-bold text-gold-primary">장 구성</h3>
                        <ul className="list-disc space-y-3 pl-5 marker:text-gold-primary">
                            <li>
                                <strong className="text-[#1C2B36]">1장: 귀경게 및 도입부</strong>
                                <br />
                                논서의 시작을 알리는 귀경게와 저술 동기 및 배경을 담고 있습니다.
                            </li>
                            <li>
                                <strong className="text-[#1C2B36]">2장: 게송 (1송 ~ 67송)</strong>
                                <br />
                                보리도등론의 핵심 게송(1송 ~ 67송)과 논서의 맺음말(결어)로 구성되어 있습니다. 하사·중사·상사의 세 사부(士夫)에 대한 명확한 특징과 수행 방법을 설합니다.
                            </li>
                        </ul>

                        <h3 className="border-b border-gold-border/20 pb-2 text-lg font-bold text-gold-primary">사용 팁</h3>
                        <ul className="list-disc space-y-2 pl-5 marker:text-gold-primary">
                            <li>장과 절은 상단 선택기로 빠르게 이동할 수 있습니다.</li>
                            <li>게송에 오디오 파일이 연동되어 있으면 플레이어에서 직접 청취 가능합니다.</li>
                            <li>영문 및 국문 번역을 나란히 비교하며 읽을 수 있습니다.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompendiumModal;
