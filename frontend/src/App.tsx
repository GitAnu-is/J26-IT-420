import React, { useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { PrototypeProvider } from './contexts/PrototypeContext';
import { AuthProvider } from './contexts/AuthContext';
import { LocaleRoot } from './components/LocaleRoot';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RootRedirect } from './components/RootRedirect';
import { PublicLayout } from './components/PublicLayout';
import { WebShell } from './components/WebShell';
import { Splash } from './pages/Splash';
import { LanguageSelect } from './pages/LanguageSelect';
import { Onboarding } from './pages/Onboarding';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Home } from './pages/Home';
import { Farms } from './pages/Farms';
import { FarmForm } from './pages/FarmForm';
import { FarmDetail } from './pages/FarmDetail';
import { Records } from './pages/Records';
import { RecordForm } from './pages/RecordForm';
import { CropForm } from './pages/CropForm';
import { CropResults } from './pages/CropResults';
import { DiseaseCapture } from './pages/DiseaseCapture';
import { DiseaseResults } from './pages/DiseaseResults';
import { HarvestForm } from './pages/HarvestForm';
import { HarvestResults } from './pages/HarvestResults';
import { TransportForm } from './pages/TransportForm';
import { TransportResults } from './pages/TransportResults';
import { SmartPackaging } from './pages/SmartPackaging';
import { History } from './pages/History';
import { Notifications } from './pages/Notifications';
import { More } from './pages/More';
import { Settings } from './pages/Settings';
import { DevNotes } from './pages/DevNotes';
import { NotFound } from './pages/NotFound';
import { screenPaths as p } from './data/routes';
import { configureApi } from './utils/apiClient';
import { seedDemoSession } from './utils/demoSession';
import { useScreenInit } from './useScreenInit';

type AppLanguage = 'en' | 'si' | 'ta';
type ResultPreview = 'sample' | 'loading' | 'error' | 'offline' | 'empty';

interface AppProps {
  initialLanguage?: AppLanguage;
  resultPreview?: ResultPreview;
  useMockApi?: boolean;
}

export function App({
  initialLanguage = 'en',
  resultPreview = 'sample',
  useMockApi = false
}: AppProps) {
  const isMock = import.meta.env.VITE_ENABLE_MOCK_API === 'true' || useMockApi;
  const screenInit = useScreenInit();

  configureApi({
    useMock: isMock,
    failure: resultPreview === 'error' ? 'error' : resultPreview === 'offline' ? 'offline' : 'none'
  });

  useState(() => {
    // Only seed demo session when explicitly in mock/demo mode
    if (screenInit?.signedIn && isMock) {
      seedDemoSession();
    }
    return null;
  });

  return (
    <BrowserRouter>
      <LanguageProvider initialLocale={initialLanguage}>
        <PrototypeProvider resultMode={resultPreview}>
          <AuthProvider>
            <LocaleRoot>
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<RootRedirect />} />
                  <Route element={<PublicLayout />}>
                    <Route path={p.splash} element={<Splash />} />
                    <Route path={p.language} element={<LanguageSelect />} />
                    <Route path={p.onboarding} element={<Onboarding />} />
                    <Route path={p.login} element={<Login />} />
                    <Route path={p.register} element={<Register />} />
                  </Route>
                  <Route
                    element={
                      <ProtectedRoute>
                        <WebShell />
                      </ProtectedRoute>
                    }
                  >
                    <Route path={p.home} element={<Home />} />
                    <Route path={p.farms} element={<Farms />} />
                    <Route path={p['farm-form']} element={<FarmForm />} />
                    <Route path={p['farm-detail']} element={<FarmDetail />} />
                    <Route path={p.records} element={<Records />} />
                    <Route path={p['record-form']} element={<RecordForm />} />
                    <Route path={p['crop-form']} element={<CropForm />} />
                    <Route path={p['crop-results']} element={<CropResults />} />
                    <Route path={p['disease-capture']} element={<DiseaseCapture />} />
                    <Route path={p['disease-results']} element={<DiseaseResults />} />
                    <Route path={p['harvest-form']} element={<HarvestForm />} />
                    <Route path={p['harvest-results']} element={<HarvestResults />} />
                    <Route path={p['transport-form']} element={<TransportForm />} />
                    <Route path={p['transport-results']} element={<TransportResults />} />
                    <Route path={p.packaging} element={<SmartPackaging />} />
                    <Route path={p.history} element={<History />} />
                    <Route path={p.notifications} element={<Notifications />} />
                    <Route path={p.more} element={<More />} />
                    <Route path={p.settings} element={<Settings />} />
                    <Route path={p['dev-notes']} element={<DevNotes />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </ErrorBoundary>
            </LocaleRoot>
          </AuthProvider>
        </PrototypeProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}