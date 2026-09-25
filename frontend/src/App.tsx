import React, { useRef, useState } from 'react';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { AuthPage } from './pages/AuthPage';
import { TeacherLibraryPage } from './pages/TeacherLibraryPage';
import { TeacherChatPage } from './pages/TeacherChatPage';
import { TeacherComposePage } from './pages/TeacherComposePage';
import { TeacherStudioPage } from './pages/TeacherStudioPage';
import { CollectPage } from './pages/CollectPage';
import { DiagnosePage } from './pages/DiagnosePage';
import { usePageEnter } from './lib/gsap';

const TEACHER_TABS = ['library', 'compose', 'chat'];

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [chatTeacherId, setChatTeacherId] = useState<string>('t1');
  const [composeTeacherId, setComposeTeacherId] = useState<string>('t1');
  const [activeSynthRecipe, setActiveSynthRecipe] = useState<any | null>(null);
  const [studioTopic, setStudioTopic] = useState<string>('导数切线与综合大题破局');
  const [studioScript, setStudioScript] = useState<string>('');
  const [weakKnowledge, setWeakKnowledge] = useState<string[]>([]);
  const pageRef = useRef<HTMLDivElement>(null);

  usePageEnter(pageRef, activeTab);

  const openTab = (tab: string, params?: { teacherId?: string; synthRecipe?: any; weakKnowledge?: string[] }) => {
    if (params?.teacherId) setChatTeacherId(params.teacherId);
    if (params?.synthRecipe) setActiveSynthRecipe(params.synthRecipe);
    if (params?.weakKnowledge) setWeakKnowledge(params.weakKnowledge);
    if (tab === 'teachers') {
      setActiveTab('library');
      return;
    }
    setActiveTab(tab);
  };

  const teacherSection = TEACHER_TABS.includes(activeTab);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar activeTab={activeTab} onSelectTab={(tab) => openTab(tab)} />
      <main style={{ flex: 1 }} role="main" aria-label="主要内容区域">
        <div ref={pageRef}>
          {activeTab === 'home' && <HomePage onNavigate={openTab} />}
          {activeTab === 'auth' && <AuthPage onSuccess={() => setActiveTab('home')} />}
          {activeTab === 'collect' && <CollectPage onDiagnose={() => setActiveTab('diagnose')} />}
          {activeTab === 'diagnose' && (
            <DiagnosePage onCompose={(weak) => openTab('compose', { weakKnowledge: weak })} />
          )}
          {teacherSection && (
            <div className="app-container" style={{ paddingTop: 28 }}>
              <div className="teacher-subnav" role="tablist" aria-label="名师">
                {([
                  ['library', '智库'],
                  ['compose', '合成'],
                  ['chat', '1对1'],
                ] as const).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    aria-current={activeTab === key ? 'page' : undefined}
                    onClick={() => setActiveTab(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {activeTab === 'library' && (
            <TeacherLibraryPage
              onStartChat={(teacherId) => {
                setChatTeacherId(teacherId);
                setActiveSynthRecipe(null);
                setActiveTab('chat');
              }}
              onAddToCompose={(teacherId) => {
                setComposeTeacherId(teacherId);
                setActiveTab('compose');
              }}
            />
          )}
          {activeTab === 'chat' && (
            <TeacherChatPage
              initialTeacherId={chatTeacherId}
              synthRecipe={activeSynthRecipe}
              onExportToStudio={(script, topic) => {
                setStudioScript(script);
                setStudioTopic(topic);
                setActiveTab('studio');
              }}
            />
          )}
          {activeTab === 'compose' && (
            <TeacherComposePage
              initialTeacherId={composeTeacherId}
              weakKnowledge={weakKnowledge}
              onStartChat={(recipe) => {
                setActiveSynthRecipe(recipe);
                setActiveTab('chat');
              }}
              onOpenStudio={(recipe) => {
                setActiveSynthRecipe(recipe);
                setStudioTopic(recipe.name ? `${recipe.name}精品公开课` : '名师精品微课');
                setActiveTab('studio');
              }}
            />
          )}
          {activeTab === 'studio' && (
            <TeacherStudioPage
              initialTopic={studioTopic}
              initialScript={studioScript}
              synthRecipe={activeSynthRecipe}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
