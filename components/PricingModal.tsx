import React, { useState } from 'react';
import { SubscriptionTier } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Check, X, Shield, Zap, Users, Star, Crown, ChevronRight, Loader2 } from 'lucide-react';

interface PricingModalProps {
    onClose: () => void;
    lang: 'en' | 'zh';
    currentTier: SubscriptionTier;
}

const PRICING_TEXT = {
    en: {
        title: "Upgrade your Research",
        subtitle: "Unlock reasoning models, unlimited knowledge base, and team collaboration.",
        monthly: "/month",
        current: "Current Plan",
        upgrade: "Upgrade",
        processing: "Processing...",
        plans: {
            [SubscriptionTier.FREE]: {
                name: "Researcher",
                price: "$0",
                desc: "Essential tools for individual exploration.",
                features: ["Access to Gemini 2.5 Flash", "Basic Knowledge Base (5 files)", "Standard Search Grounding", "Community Support"]
            },
            [SubscriptionTier.PRO]: {
                name: "Pro Scientist",
                price: "$29",
                desc: "Advanced reasoning for serious academic work.",
                features: ["Access to Gemini 3.0 Pro & o1", "Thinking Process Visualization", "Unlimited Knowledge Base", "Priority Execution", "DeepSeek R1 Math Engine"]
            },
            [SubscriptionTier.TEAM]: {
                name: "Lab Enterprise",
                price: "$99",
                desc: "Unified intelligence for research groups.",
                features: ["Everything in Pro", "Shared Team Context", "Admin Dashboard", "SSO / SAML Enforcement", "Dedicated GPU Clusters"]
            }
        }
    },
    zh: {
        title: "升级您的研究引擎",
        subtitle: "解锁推理模型、无限知识库和团队协作功能。",
        monthly: "/月",
        current: "当前方案",
        upgrade: "立即升级",
        processing: "处理中...",
        plans: {
            [SubscriptionTier.FREE]: {
                name: "研究员",
                price: "¥0",
                desc: "用于个人探索的基础工具。",
                features: ["使用 Gemini 2.5 Flash", "基础知识库 (5 个文件)", "标准搜索增强", "社区支持"]
            },
            [SubscriptionTier.PRO]: {
                name: "资深科学家",
                price: "¥199",
                desc: "用于严谨学术工作的深度推理。",
                features: ["使用 Gemini 3.0 Pro & o1", "思维链可视化 (CoT)", "无限知识库容量", "优先执行队列", "DeepSeek R1 数学引擎"]
            },
            [SubscriptionTier.TEAM]: {
                name: "实验室企业版",
                price: "¥699",
                desc: "研究小组的统一智能中心。",
                features: ["包含 Pro 版所有功能", "团队共享上下文", "管理员控制台", "SSO / SAML 强制登录", "专用 GPU 集群"]
            }
        }
    }
};

export const PricingModal: React.FC<PricingModalProps> = ({ onClose, lang, currentTier }) => {
    const { upgradeSubscription } = useAuth();
    const [loadingTier, setLoadingTier] = useState<SubscriptionTier | null>(null);
    const t = PRICING_TEXT[lang];

    const handleUpgrade = async (tier: SubscriptionTier) => {
        setLoadingTier(tier);
        await upgradeSubscription(tier);
        setLoadingTier(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-5xl bg-white dark:bg-[#0c0c0e] rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-white/10 animate-in fade-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
                
                {/* Header */}
                <div className="p-8 text-center border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5">
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                    <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400 mb-2">
                        {t.title}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">{t.subtitle}</p>
                </div>

                {/* Plans Grid */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {Object.values(SubscriptionTier).map((tier) => {
                            const plan = t.plans[tier];
                            const isCurrent = currentTier === tier;
                            const isPopular = tier === SubscriptionTier.PRO;
                            const isLoading = loadingTier === tier;

                            return (
                                <div 
                                    key={tier}
                                    className={`relative flex flex-col p-6 rounded-2xl border transition-all duration-300 ${isPopular 
                                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 shadow-xl shadow-blue-500/10 transform md:-translate-y-2' 
                                        : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-blue-300 dark:hover:border-blue-700'}`}
                                >
                                    {isPopular && (
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                                            Most Popular
                                        </div>
                                    )}

                                    <div className="mb-4">
                                        <div className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{plan.name}</div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                                            <span className="text-gray-500">{t.monthly}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 min-h-[40px]">{plan.desc}</p>
                                    </div>

                                    <div className="flex-1 space-y-3 mb-8">
                                        {plan.features.map((feat, i) => (
                                            <div key={i} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                                                <Check size={16} className={`shrink-0 mt-0.5 ${isPopular ? 'text-blue-500' : 'text-gray-400'}`} />
                                                <span className="leading-tight">{feat}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <button 
                                        disabled={isCurrent || isLoading}
                                        onClick={() => handleUpgrade(tier)}
                                        className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                                            isCurrent 
                                                ? 'bg-gray-100 dark:bg-white/10 text-gray-400 cursor-default' 
                                                : isPopular 
                                                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30' 
                                                    : 'bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black'
                                        }`}
                                    >
                                        {isLoading ? (
                                            <><Loader2 size={16} className="animate-spin" /> {t.processing}</>
                                        ) : isCurrent ? (
                                            <><Check size={16} /> {t.current}</>
                                        ) : (
                                            <>{tier === SubscriptionTier.FREE ? 'Downgrade' : t.upgrade}</>
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="p-4 text-center border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 text-xs text-gray-500">
                    <div className="flex justify-center gap-4 mb-2">
                        <span className="flex items-center gap-1"><Shield size={12}/> Secure Payment</span>
                        <span className="flex items-center gap-1"><Zap size={12}/> Instant Activation</span>
                    </div>
                    Prices are for demonstration purposes only. No actual charges will be applied.
                </div>
            </div>
        </div>
    );
};