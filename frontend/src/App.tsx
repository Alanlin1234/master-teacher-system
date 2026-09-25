import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { AuthPage } from './pages/AuthPage';
import { TeacherLibraryPage } from './pages/TeacherLibraryPage';
import { TeacherChatPage } from './pages/TeacherChatPage';
import { TeacherComposePage } from './pages/TeacherComposePage';
import { TeacherStudioPage } from './pages/TeacherStudioPage';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [chatTeacherId, setChatTeacherId] = useState<string>('t1');
  const [composeTeacherId, setComposeTeacherId] = useState<string>('t1');
  const [activeSynthRecipe, setActiveSynthRecipe] = useState<any | null>(null);
  const [studioTopic, setStudioTopic] = useState<string>('导数切线与综合大题破局');
  const [studioScript, setStudioScript] = useState<string>('');

  // 跨页面导航中枢
  const handleStartChatFromLibrary = (teacherId: string) => {
    setChatTeacherId(teacherId);
    setActiveSynthRecipe(null);
    setActiveTab('chat');
  };

  const handleStartChatFromCompose = (recipe: any) => {
    setActiveSynthRecipe(recipe);
    setActiveTab('chat');
  };

  const handleAddToComposeFromLibrary = (teacherId: string) => {
    setComposeTeacherId(teacherId);
    setActiveTab('compose');
  };

  const handleOpenStudioFromCompose = (recipe: any) => {
    setActiveSynthRecipe(recipe);
    setStudioTopic(recipe.name ? `${recipe.name}精品公开课` : '名师精品微课');
    setActiveTab('studio');
  };

  const handleExportChatToStudio = (script: string, topic: string) => {
    setStudioScript(script);
    setStudioTopic(topic);
    setActiveTab('studio');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 现代导航栏 */}
      <Navbar activeTab={activeTab} onSelectTab={tab => setActiveTab(tab)} />

      {/* 核心页面路由渲染 */}
      <main style={{ flex: 1 }}>
        {activeTab === 'home' && (
          <HomePage
            onNavigate={(tab, params) => {
              if (params?.teacherId) setChatTeacherId(params.teacherId);
              if (params?.synthRecipe) setActiveSynthRecipe(params.synthRecipe);
              setActiveTab(tab);
            }}
          />
        )}

        {activeTab === 'auth' && (
          <AuthPage
            onSuccess={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'library' && (
          <TeacherLibraryPage
            onStartChat={handleStartChatFromLibrary}
            onAddToCompose={handleAddToComposeFromLibrary}
          />
        )}

        {activeTab === 'chat' && (
          <TeacherChatPage
            initialTeacherId={chatTeacherId}
            synthRecipe={activeSynthRecipe}
            onExportToStudio={handleExportChatToStudio}
          />
        )}

        {activeTab === 'compose' && (
          <TeacherComposePage
            initialTeacherId={composeTeacherId}
            onStartChat={handleStartChatFromCompose}
            onOpenStudio={handleOpenStudioFromCompose}
          />
        )}

        {activeTab === 'studio' && (
          <TeacherStudioPage
            initialTopic={studioTopic}
            initialScript={studioScript}
            synthRecipe={activeSynthRecipe}
          />
        )}
      </main>
    </div>
  );
};

export default App;
