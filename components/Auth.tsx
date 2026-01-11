
import React, { useState } from 'react';
import { Clapperboard, Mail, Lock, User as UserIcon, ArrowRight, Languages } from 'lucide-react';
import { User, Language } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
  lang: Language;
  onToggleLang: () => void;
}

const AUTH_TRANSLATIONS = {
  en: {
    welcome: "Welcome Back",
    create: "Create Account",
    subtitle: "Professional AI Storyboard Engine",
    email: "Email Address",
    password: "Password",
    fullName: "Full Name",
    login: "Login",
    signUp: "Sign Up",
    noAccount: "Don't have an account?",
    hasAccount: "Already have an account?",
    switchLogin: "Log In",
    switchSignUp: "Create one",
  },
  ko: {
    welcome: "다시 오신 것을 환영합니다",
    create: "계정 생성",
    subtitle: "프로페셔널 AI 스토리보드 엔진",
    email: "이메일 주소",
    password: "비밀번호",
    fullName: "이름",
    login: "로그인",
    signUp: "회원가입",
    noAccount: "계정이 없으신가요?",
    hasAccount: "이미 계정이 있으신가요?",
    switchLogin: "로그인하기",
    switchSignUp: "계정 만들기",
  }
};

const Auth: React.FC<AuthProps> = ({ onLogin, lang, onToggleLang }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const t = AUTH_TRANSLATIONS[lang];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      const user: User = { email, name: name || email.split('@')[0] };
      // Simulate persistence
      localStorage.setItem('sb_user', JSON.stringify(user));
      onLogin(user);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FBFF] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[120px] opacity-50" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-[120px] opacity-50" />

      <div className="w-full max-w-md z-10">
        <div className="flex justify-center mb-8">
          <button 
            onClick={onToggleLang}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-[10px] font-black text-slate-600 hover:shadow-sm transition-all uppercase"
          >
            <Languages size={14} />
            {lang === 'en' ? '한국어' : 'English'}
          </button>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-blue-900/5 p-10">
          <div className="flex flex-col items-center mb-10">
            <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl mb-6">
              <Clapperboard size={32} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">
              {isLogin ? t.welcome : t.create}
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">{t.subtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t.fullName}</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" 
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t.email}</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t.password}</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" 
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all mt-6 active:scale-[0.98]"
            >
              {isLogin ? t.login : t.signUp}
              <ArrowRight size={18} />
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400 font-medium">
              {isLogin ? t.noAccount : t.hasAccount}{' '}
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-blue-600 font-bold hover:underline"
              >
                {isLogin ? t.switchSignUp : t.switchLogin}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
