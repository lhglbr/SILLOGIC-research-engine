import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AuthStrategy } from '../types';
import { SignIn } from '@clerk/clerk-react';
import ParticleBackground from './ParticleBackground';
import { Bot, Shield, Key, Cpu, Fingerprint, Settings, CheckCircle2, AlertCircle, UserPlus, LogIn, Briefcase, Sun, Moon, Globe, Languages } from 'lucide-react';

interface LoginScreenProps {
    isDarkMode: boolean;
    toggleTheme: () => void;
    lang: 'en' | 'zh';
    toggleLang: () => void;
}

const LOGIN_TEXT = {
    en: {
        title: "ProtoChat",
        subtitle: "SECURE RESEARCH TERMINAL",
        configTitle: "Auth Configuration",
        strategy: "Authentication Strategy",
        clerkKey: "Clerk Publishable Key",
        nextAuthUrl: "NextAuth Backend URL",
        nextAuthHelp: "Required to prevent connection errors.",
        saveConfig: "Save Configuration",
        modeLogin: "Login",
        modeRegister: "Register",
        org: "ORGANIZATION",
        orgPlaceholder: "Research Lab / University",
        name: "IDENTITY",
        namePlaceholder: "Researcher Name",
        email: "ACCESS KEY (EMAIL)",
        emailPlaceholder: "researcher@lab.org",
        btnCreate: "Create Account",
        btnLogin: "Initialize Session",
        btnSSO: "Sign in with SSO Provider",
        ssoConnecting: "Connecting...",
        ssoNewUser: "New users: Please register via your corporate identity provider.",
        missingKey: "Clerk Publishable Key missing or invalid.",
        missingUrl: "NextAuth Backend URL not configured or invalid.",
        configure: "Configure",
        systemOnline: "System Online",
        encrypted: "Encrypted",
        version: "v2.5.1"
    },
    zh: {
        title: "ProtoChat",
        subtitle: "安全科研终端",
        configTitle: "认证配置",
        strategy: "认证策略",
        clerkKey: "Clerk 公钥 (Publishable Key)",
        nextAuthUrl: "NextAuth 后端地址",
        nextAuthHelp: "防止连接错误所需配置。",
        saveConfig: "保存配置",
        modeLogin: "登录",
        modeRegister: "注册",
        org: "所属机构",
        orgPlaceholder: "实验室 / 大学",
        name: "身份标识",
        namePlaceholder: "研究员姓名",
        email: "访问密钥 (邮箱)",
        emailPlaceholder: "researcher@lab.org",
        btnCreate: "创建账户",
        btnLogin: "初始化会话",
        btnSSO: "使用 SSO 登录",
        ssoConnecting: "连接中...",
        ssoNewUser: "新用户请通过企业身份提供商注册。",
        missingKey: "缺少 Clerk 公钥或公钥无效。",
        missingUrl: "未配置 NextAuth 后端地址或地址无效。",
        configure: "去配置",
        systemOnline: "系统在线",
        encrypted: "已加密",
        version: "v2.5.1"
    }
};

export const LoginScreen: React.FC<LoginScreenProps> = ({ isDarkMode, toggleTheme, lang, toggleLang }) => {
  const { setStrategy, updateLocalUser, login, strategy, config, isLoading } = useAuth();
  const [mode, setMode] = useState<'login' | 'config'>('login');
  const [authTab, setAuthTab] = useState<'signin' | 'register'>('signin');
  
  // Local Form State
  const [localName, setLocalName] = useState('');
  const [localEmail, setLocalEmail] = useState('');
  const [localOrg, setLocalOrg] = useState(''); // Only for register visualization
  
  // Config Form State
  const [selectedStrategy, setSelectedStrategy] = useState<AuthStrategy>(strategy);
  const [clerkKey, setClerkKey] = useState(config.clerkKey || '');
  const [nextAuthUrl, setNextAuthUrl] = useState(config.nextAuthUrl || '');

  const t = LOGIN_TEXT[lang];

  const handleLocalLogin = (e: React.FormEvent) => {
      e.preventDefault();
      if(localName && localEmail) updateLocalUser(localName, localEmail);
  };

  const handleConfigSave = (e: React.FormEvent) => {
      e.preventDefault();
      setStrategy(selectedStrategy, { clerkKey, nextAuthUrl });
      setMode('login');
      // Reset tabs
      setAuthTab('signin');
  };

  return (
    <div className={`relative w-full h-screen flex items-center justify-center overflow-hidden transition-colors duration-500 ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
        {/* Background Layer */}
        <div className="absolute inset-0 opacity-50 pointer-events-none">
            <ParticleBackground isDarkMode={isDarkMode} />
        </div>

        {/* Global Controls - Fixed Left Center (Consistent with App.tsx) */}
        <div className="fixed left-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2">
            <button 
                onClick={toggleTheme}
                className="p-2 rounded-full glass-panel hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors shadow-lg flex items-center justify-center w-10 h-10"
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button 
                onClick={toggleLang}
                className="p-2 rounded-full glass-panel hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors shadow-lg flex items-center justify-center w-10 h-10 font-bold text-xs font-mono"
                title="Switch Language"
            >
                {lang === 'en' ? 'EN' : 'ZH'}
            </button>
        </div>

        <div className="relative z-10 w-full max-w-md p-8">
            {/* Logo Header */}
            <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 mb-4 shadow-lg shadow-blue-500/30">
                    <Bot size={32} className="text-white" />
                </div>
                <h1 className="text-3xl font-bold font-sans tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-200 dark:to-white">
                    {t.title}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-xs mt-2 font-mono tracking-widest">{t.subtitle}</p>
            </div>

            {/* Main Card */}
            <div className={`backdrop-blur-xl border rounded-2xl p-6 shadow-2xl relative overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-[#0c0c0e]/80 border-white/10' : 'bg-white/80 border-gray-200'}`}>
                {/* Mode Toggle Button (Config) */}
                <button 
                    onClick={() => setMode(mode === 'login' ? 'config' : 'login')}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                    <Settings size={16} />
                </button>

                {mode === 'config' ? (
                    <form onSubmit={handleConfigSave} className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                        <h2 className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-white"><Settings size={18}/> {t.configTitle}</h2>
                        
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">{t.strategy}</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[AuthStrategy.LOCAL, AuthStrategy.CLERK, AuthStrategy.NEXT_AUTH].map(s => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setSelectedStrategy(s)}
                                        className={`p-2 rounded border text-xs font-bold transition-all ${selectedStrategy === s ? 'bg-blue-600 border-blue-500 text-white' : 'bg-transparent border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'}`}
                                    >
                                        {s === AuthStrategy.LOCAL ? 'DEMO' : s === AuthStrategy.CLERK ? 'CLERK' : 'NEXT'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {selectedStrategy === AuthStrategy.CLERK && (
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500">{t.clerkKey}</label>
                                <input 
                                    type="text" 
                                    value={clerkKey}
                                    onChange={e => setClerkKey(e.target.value)}
                                    placeholder="pk_test_..."
                                    className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded p-2 text-sm focus:border-blue-500 outline-none font-mono text-gray-900 dark:text-white"
                                />
                            </div>
                        )}

                        {selectedStrategy === AuthStrategy.NEXT_AUTH && (
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500">{t.nextAuthUrl}</label>
                                <input 
                                    type="text" 
                                    value={nextAuthUrl}
                                    onChange={e => setNextAuthUrl(e.target.value)}
                                    placeholder="https://your-api.com"
                                    className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded p-2 text-sm focus:border-blue-500 outline-none font-mono text-gray-900 dark:text-white"
                                />
                                <p className="text-[10px] text-gray-500">{t.nextAuthHelp}</p>
                            </div>
                        )}

                        <div className="pt-2">
                            <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-bold text-white shadow-lg shadow-blue-500/20">
                                {t.saveConfig}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="animate-in fade-in zoom-in-95 duration-300">
                        {/* Strategy Indicator */}
                        <div className="flex justify-center mb-6">
                            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-[10px] font-mono text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                <Shield size={10} className="text-emerald-500" />
                                {strategy === AuthStrategy.LOCAL ? 'Local Demo' : strategy} Secure
                            </div>
                        </div>

                        {/* Local Login Tabs */}
                        {strategy === AuthStrategy.LOCAL && (
                            <div className="flex mb-6 border-b border-gray-200 dark:border-white/10">
                                <button 
                                    onClick={() => setAuthTab('signin')}
                                    className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wider transition-colors ${authTab === 'signin' ? 'text-blue-600 dark:text-white border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                                >
                                    {t.modeLogin}
                                </button>
                                <button 
                                    onClick={() => setAuthTab('register')}
                                    className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wider transition-colors ${authTab === 'register' ? 'text-blue-600 dark:text-white border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                                >
                                    {t.modeRegister}
                                </button>
                            </div>
                        )}

                        {/* Local Login Form */}
                        {strategy === AuthStrategy.LOCAL && (
                            <form onSubmit={handleLocalLogin} className="space-y-4">
                                {authTab === 'register' && (
                                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                        <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">{t.org}</label>
                                        <div className="relative group">
                                            <Briefcase className="absolute left-3 top-3 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                                            <input 
                                                type="text"
                                                value={localOrg}
                                                onChange={e => setLocalOrg(e.target.value)}
                                                placeholder={t.orgPlaceholder}
                                                className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl p-3 pl-10 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder-gray-400"
                                            />
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">{t.name}</label>
                                    <div className="relative group">
                                        <Fingerprint className="absolute left-3 top-3 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                                        <input 
                                            type="text"
                                            value={localName}
                                            onChange={e => setLocalName(e.target.value)}
                                            placeholder={t.namePlaceholder}
                                            className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl p-3 pl-10 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder-gray-400"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">{t.email}</label>
                                    <div className="relative group">
                                        <Key className="absolute left-3 top-3 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                                        <input 
                                            type="email"
                                            value={localEmail}
                                            onChange={e => setLocalEmail(e.target.value)}
                                            placeholder={t.emailPlaceholder}
                                            className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl p-3 pl-10 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder-gray-400"
                                            required
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-black font-bold rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 group mt-2 shadow-lg">
                                    {authTab === 'register' ? (
                                        <><span>{t.btnCreate}</span> <UserPlus size={16} className="group-hover:translate-x-1 transition-transform"/></>
                                    ) : (
                                        <><span>{t.btnLogin}</span> <LogIn size={16} className="group-hover:translate-x-1 transition-transform"/></>
                                    )}
                                </button>
                            </form>
                        )}

                        {/* Clerk Login */}
                        {strategy === AuthStrategy.CLERK && (
                            <div className="min-h-[300px] flex flex-col items-center justify-center">
                                {config.clerkKey && config.clerkKey.trim().startsWith('pk_') ? (
                                    <SignIn appearance={{
                                        elements: {
                                            rootBox: "w-full",
                                            card: "bg-transparent shadow-none border-0 w-full p-0",
                                            headerTitle: isDarkMode ? "text-white" : "text-gray-900",
                                            headerSubtitle: "text-gray-500",
                                            socialButtonsBlockButton: isDarkMode ? "bg-white/5 border-white/10 text-white hover:bg-white/10" : "bg-gray-50 border-gray-200 text-gray-900 hover:bg-gray-100",
                                            formFieldLabel: "text-gray-500",
                                            formFieldInput: isDarkMode ? "bg-black/50 border-white/10 text-white" : "bg-white border-gray-200 text-gray-900",
                                            footerActionLink: "text-blue-500 hover:text-blue-400"
                                        }
                                    }}/>
                                ) : (
                                    <div className="text-center space-y-3">
                                        <AlertCircle className="mx-auto text-yellow-500" size={32}/>
                                        <p className="text-sm text-gray-500">{t.missingKey}</p>
                                        <button onClick={() => setMode('config')} className="text-blue-500 text-xs hover:underline">{t.configure}</button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* NextAuth Login */}
                        {strategy === AuthStrategy.NEXT_AUTH && (
                            <div className="space-y-4">
                                {config.nextAuthUrl && config.nextAuthUrl.startsWith('http') ? (
                                    <>
                                        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/20 text-blue-800 dark:text-blue-200 text-xs">
                                            Connecting to Enterprise SSO at <span className="font-mono font-bold">{config.nextAuthUrl}</span>
                                        </div>
                                        <button 
                                            onClick={() => login()}
                                            disabled={isLoading}
                                            className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-black font-bold rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 shadow-lg"
                                        >
                                            {isLoading ? t.ssoConnecting : t.btnSSO}
                                        </button>
                                        <div className="text-center text-[10px] text-gray-500 mt-2">
                                            {t.ssoNewUser}
                                        </div>
                                    </>
                                ) : (
                                     <div className="text-center space-y-3">
                                        <AlertCircle className="mx-auto text-red-500" size={32}/>
                                        <p className="text-sm text-gray-500">{t.missingUrl}</p>
                                        <button onClick={() => setMode('config')} className="text-blue-500 text-xs hover:underline">{t.configure}</button>
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="mt-8 text-center">
                <div className="inline-flex items-center gap-4 text-[10px] text-gray-500 font-mono uppercase">
                    <span className="flex items-center gap-1"><Cpu size={10}/> {t.systemOnline}</span>
                    <span className="flex items-center gap-1"><Shield size={10}/> {t.encrypted}</span>
                    <span className="flex items-center gap-1"><CheckCircle2 size={10}/> {t.version}</span>
                </div>
            </div>
        </div>
    </div>
  );
};