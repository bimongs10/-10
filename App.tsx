
import React, { useState, useRef, useEffect } from 'react';
import { 
  Clapperboard, 
  Sparkles, 
  Play, 
  Download, 
  Plus, 
  Layout, 
  Info,
  Layers,
  Settings2,
  Languages,
  Maximize,
  Upload,
  X,
  Image as ImageIcon,
  Square,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { Character, Scene, StylePreset, STYLE_PRESETS, AspectRatio, Language, User } from './types';
import CharacterCard from './components/CharacterCard';
import StatusMonitor from './components/StatusMonitor';
import SceneGallery from './components/SceneGallery';
import Auth from './components/Auth';
import { parseScript, downloadAsZip, fileToBase64 } from './utils/fileUtils';
import { optimizePrompt, generateSceneImage } from './services/geminiService';

const TRANSLATIONS = {
  en: {
    title: "Storyboard Studio",
    pro: "Pro",
    subtitle: "Ensemble Production Engine",
    exportZip: "EXPORT ZIP",
    startProduction: "START PRODUCTION",
    stopProduction: "STOP",
    running: "RUNNING...",
    masterScript: "Master Script",
    scriptBadge: "KOREAN / ENGLISH OK",
    scriptPlaceholder: "1. Scene description...\n2. Next scene...",
    scriptInfo: "Use numbering (e.g., 1., 2.) to separate frames. Gemini will automatically translate and enrich your descriptions.",
    visualDirection: "Visual Direction",
    artStyle: "Artistic Style",
    aspectRatio: "Aspect Ratio",
    atmosphere: "Atmosphere & Lighting",
    atmospherePlaceholder: "e.g. Neon-noir, sunrise, cinematic bokeh",
    styleRefLabel: "Style Reference Image",
    styleRefDesc: "Optional reference for lighting/mood",
    charEnsemble: "Character Ensemble (Consistency Lock)",
    newSlot: "NEW SLOT",
    storyboardOutput: "Storyboard Output",
    framesGenerated: "FRAMES GENERATED",
    workspaceEmpty: "Workspace is empty",
    workspaceEmptyDesc: "Your storyboard frames will appear here once production starts.",
    stoppedLog: "⚠️ Production stopped by user.",
    logout: "Logout"
  },
  ko: {
    title: "스토리보드 스튜디오",
    pro: "프로",
    subtitle: "앙상블 프로덕션 엔진",
    exportZip: "ZIP 내보내기",
    startProduction: "제작 시작",
    stopProduction: "중지",
    running: "제작 중...",
    masterScript: "마스터 스크립트",
    scriptBadge: "한글 / 영어 가능",
    scriptPlaceholder: "1. 장면 묘사...\n2. 다음 장면...",
    scriptInfo: "번호(예: 1., 2.)를 사용하여 프레임을 구분하세요. Gemini가 자동으로 설명을 번역하고 보강합니다.",
    visualDirection: "시각 연출 설정",
    artStyle: "예술적 스타일",
    aspectRatio: "화면 비율",
    atmosphere: "분위기 & 조명",
    atmospherePlaceholder: "예: 네온 누아르, 일출, 시네마틱 보케",
    styleRefLabel: "스타일 레퍼런스 이미지",
    styleRefDesc: "조명이나 분위기를 위한 선택적 참고 이미지",
    charEnsemble: "등장인물 설정 (일관성 유지)",
    newSlot: "새 슬롯",
    storyboardOutput: "스토리보드 결과물",
    framesGenerated: "프레임 생성됨",
    workspaceEmpty: "작업 공간이 비어 있습니다",
    workspaceEmptyDesc: "제작을 시작하면 스토리보드 프레임이 여기에 나타납니다.",
    stoppedLog: "⚠️ 사용자에 의해 제작이 중지되었습니다.",
    logout: "로그아웃"
  }
};

const ASPECT_RATIOS: AspectRatio[] = ['16:9', '4:3', '1:1', '9:16'];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [lang, setLang] = useState<Language>('ko');
  const [script, setScript] = useState('');
  const [stylePreset, setStylePreset] = useState<StylePreset>('Photorealistic');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [customStyle, setCustomStyle] = useState('');
  const [styleRef, setStyleRef] = useState<{ data: string, mimeType: string } | null>(null);
  const [characters, setCharacters] = useState<Character[]>([
    { id: '1', name: '' }
  ]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [zoomUrl, setZoomUrl] = useState<string | null>(null);
  
  const stopRequestedRef = useRef(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('sb_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('sb_user');
    setUser(null);
  };

  const t = TRANSLATIONS[lang];

  const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

  const toggleLanguage = () => setLang(prev => prev === 'en' ? 'ko' : 'en');

  const handleStyleRefUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const { data, mimeType } = await fileToBase64(file);
      setStyleRef({ data, mimeType });
    }
  };

  const handleAddCharacter = () => {
    if (characters.length < 8) {
      setCharacters([...characters, { id: Math.random().toString(36).substr(2, 9), name: '' }]);
    }
  };

  const handleRemoveCharacter = (id: string) => {
    setCharacters(characters.filter(c => c.id !== id));
  };

  const handleUpdateCharacter = (id: string, updates: Partial<Character>) => {
    setCharacters(characters.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const generateSingleScene = async (sceneIndex: number, currentScenes: Scene[]) => {
    const scene = currentScenes[sceneIndex];
    const updatingScenes = [...currentScenes];
    updatingScenes[sceneIndex] = { ...scene, status: 'generating' };
    setScenes(updatingScenes);

    try {
      addLog(`[Scene ${scene.number}] ${lang === 'ko' ? '프롬프트 최적화 중...' : 'Optimization started...'}`);
      const optimizedPrompt = await optimizePrompt(
        scene.description,
        stylePreset,
        customStyle,
        characters
      );
      
      addLog(`[Scene ${scene.number}] ${lang === 'ko' ? '이미지 렌더링 중...' : 'Rendering image...'}`);
      const imageUrl = await generateSceneImage(optimizedPrompt, characters, aspectRatio, styleRef || undefined);

      if (imageUrl) {
        updatingScenes[sceneIndex] = { 
          ...updatingScenes[sceneIndex], 
          status: 'completed', 
          imageUrl, 
          prompt: optimizedPrompt 
        };
        addLog(`[Scene ${scene.number}] ${lang === 'ko' ? '성공' : 'Success'}.`);
      } else {
        throw new Error('No image returned');
      }
    } catch (error) {
      console.error(error);
      updatingScenes[sceneIndex] = { ...updatingScenes[sceneIndex], status: 'error' };
      addLog(`[Scene ${scene.number}] FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    setScenes([...updatingScenes]);
  };

  const handleRegenerateScene = async (id: string) => {
    const index = scenes.findIndex(s => s.id === id);
    if (index !== -1) {
      setIsProcessing(true);
      await generateSingleScene(index, scenes);
      setIsProcessing(false);
    }
  };

  const stopProduction = () => {
    stopRequestedRef.current = true;
  };

  const startProduction = async () => {
    if (!script.trim()) return alert(lang === 'ko' ? '스크립트를 입력해주세요.' : 'Script is empty.');

    const parsed = parseScript(script);
    if (parsed.length === 0) return alert(lang === 'ko' ? '장면을 찾을 수 없습니다. "1. 내용" 형식을 사용하세요.' : 'No scenes found. Use "1. Text" format.');

    setScenes(parsed);
    setIsProcessing(true);
    stopRequestedRef.current = false;
    setLogs([]);
    addLog(`🎬 ${lang === 'ko' ? '제작 시작' : 'Production initialized'}: ${parsed.length} scenes.`);

    const currentScenes = [...parsed];
    for (let i = 0; i < currentScenes.length; i++) {
      if (stopRequestedRef.current) {
        addLog(t.stoppedLog);
        break;
      }
      await generateSingleScene(i, currentScenes);
      currentScenes[i] = (await new Promise(resolve => {
        setScenes(prev => {
          resolve(prev[i]);
          return prev;
        });
      })) as Scene;
    }

    setIsProcessing(false);
    addLog(`✅ ${lang === 'ko' ? '프로세스 종료' : 'Process ended'}.`);
  };

  if (!user) {
    return <Auth onLogin={setUser} lang={lang} onToggleLang={toggleLanguage} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FBFF]">
      {/* Zoom Modal */}
      {zoomUrl && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setZoomUrl(null)}
        >
          <button className="absolute top-6 right-6 text-white hover:text-blue-400 transition-colors">
            <X size={32} />
          </button>
          <img 
            src={zoomUrl} 
            alt="Zoomed storyboard" 
            className="max-w-full max-h-full rounded-lg shadow-2xl object-contain"
          />
        </div>
      )}

      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-xl shadow-slate-200">
            <Clapperboard size={22} />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">
              {t.title} <span className="text-blue-600">{t.pro}</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t.subtitle}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-full mr-2">
            <UserIcon size={14} className="text-blue-500" />
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight">{user.name}</span>
          </div>

          <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-[10px] font-black text-slate-600 hover:bg-slate-50 transition-all uppercase"
          >
            <Languages size={14} />
            {lang === 'en' ? 'KO' : 'EN'}
          </button>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-red-100 text-[10px] font-black text-red-500 hover:bg-red-50 transition-all uppercase"
          >
            <LogOut size={14} />
            {t.logout}
          </button>

          <button
            onClick={() => downloadAsZip(scenes)}
            disabled={isProcessing || !scenes.some(s => s.status === 'completed')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all uppercase"
          >
            <Download size={16} />
            {t.exportZip}
          </button>
          
          <div className="flex items-center gap-2">
            {!isProcessing ? (
              <button
                onClick={startProduction}
                className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all hover:-translate-y-0.5 uppercase"
              >
                <Play size={16} />
                {t.startProduction}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-100 text-slate-500 text-xs font-black uppercase">
                  <Sparkles className="animate-spin" size={16} />
                  {t.running}
                </div>
                <button
                  onClick={stopProduction}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-600 text-xs font-black hover:bg-red-100 transition-all uppercase border border-red-100"
                >
                  <Square size={14} fill="currentColor" />
                  {t.stopProduction}
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-[1700px] mx-auto w-full p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Production Controls */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900">
                <Layout size={20} className="text-blue-500" />
                <h2 className="text-sm font-black uppercase tracking-widest">{t.masterScript}</h2>
              </div>
              <div className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-1 rounded-md">
                {t.scriptBadge}
              </div>
            </div>
            
            <textarea
              className="w-full h-[350px] p-5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-sm font-medium leading-relaxed resize-none"
              placeholder={t.scriptPlaceholder}
              value={script}
              onChange={(e) => setScript(e.target.value)}
            />

            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
              <Info className="text-amber-500 shrink-0" size={18} />
              <p className="text-[11px] text-amber-700 font-medium leading-normal">
                {t.scriptInfo}
              </p>
            </div>
          </section>

          <section className="h-[300px]">
            <StatusMonitor logs={logs} />
          </section>
        </div>

        {/* Global Configuration & Results */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-8">
            <div className="flex items-center gap-2 text-slate-900">
              <Settings2 size={20} className="text-blue-500" />
              <h2 className="text-sm font-black uppercase tracking-widest">{t.visualDirection}</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t.artStyle}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {STYLE_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setStylePreset(preset)}
                        className={`px-4 py-3 rounded-xl text-[10px] font-black transition-all border-2 ${
                          stylePreset === preset 
                            ? 'bg-blue-50 border-blue-500 text-blue-700' 
                            : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t.aspectRatio}</label>
                  <div className="flex gap-2">
                    {ASPECT_RATIOS.map((ratio) => (
                      <button
                        key={ratio}
                        onClick={() => setAspectRatio(ratio)}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all border-2 flex items-center justify-center gap-2 ${
                          aspectRatio === ratio 
                            ? 'bg-blue-50 border-blue-500 text-blue-700' 
                            : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        <Maximize size={12} className={ratio === '9:16' ? 'rotate-90' : ''} />
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t.atmosphere}</label>
                <div className="flex flex-col gap-4">
                  <textarea 
                    placeholder={t.atmospherePlaceholder}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none h-[100px]"
                    value={customStyle}
                    onChange={(e) => setCustomStyle(e.target.value)}
                  />
                  
                  {/* Style Reference Image Uploader */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.styleRefLabel}</label>
                    <div className="relative group">
                      {styleRef ? (
                        <div className="relative h-20 w-full rounded-xl overflow-hidden border border-slate-200">
                          <img src={styleRef.data} alt="Style Ref" className="w-full h-full object-cover" />
                          <button 
                            onClick={() => setStyleRef(null)}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full shadow-lg"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <label className="h-20 w-full border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center gap-3 text-slate-400 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                          <ImageIcon size={20} />
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold">{t.styleRefLabel}</span>
                            <span className="text-[8px] uppercase">{t.styleRefDesc}</span>
                          </div>
                          <input type="file" className="hidden" accept="image/*" onChange={handleStyleRefUpload} />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Layers size={18} className="text-blue-500" />
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t.charEnsemble}</label>
                </div>
                {characters.length < 8 && (
                  <button 
                    onClick={handleAddCharacter}
                    className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors"
                  >
                    <Plus size={14} /> {t.newSlot}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {characters.map((char) => (
                  <CharacterCard 
                    key={char.id}
                    character={char}
                    onUpdate={handleUpdateCharacter}
                    onRemove={handleRemoveCharacter}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* Storyboard View */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900">
                <Clapperboard size={20} className="text-blue-500" />
                <h2 className="text-sm font-black uppercase tracking-widest">{t.storyboardOutput}</h2>
              </div>
              {scenes.length > 0 && (
                <span className="text-[10px] font-bold text-slate-400 uppercase">{scenes.length} {t.framesGenerated}</span>
              )}
            </div>

            {scenes.length > 0 ? (
              <SceneGallery 
                scenes={scenes} 
                onRegenerate={handleRegenerateScene} 
                onZoom={setZoomUrl}
                isProcessing={isProcessing}
              />
            ) : (
              <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 py-24 flex flex-col items-center justify-center text-slate-400 gap-4">
                <div className="bg-slate-50 p-6 rounded-full">
                  <Layout size={40} className="opacity-20" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-500">{t.workspaceEmpty}</p>
                  <p className="text-xs">{t.workspaceEmptyDesc}</p>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-100 py-8 px-8 text-center mt-12">
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">
          &copy; 2025 AI Ensemble Studio &bull; Precision Visualization Engine
        </p>
      </footer>
    </div>
  );
};

export default App;
