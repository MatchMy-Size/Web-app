import { useCallback, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { AppShell } from '@/components/app-shell';
import { ProtectedRoute, PublicOnlyRoute } from '@/components/route-guard';
import { StartupSplash } from '@/components/startup-splash';
import { AddPreferencePage } from '@/pages/add-preference-page';
import { ChangePasswordPage, ForgotPasswordPage } from '@/pages/change-password-page';
import { ExplorePage } from '@/pages/explore-page';
import { HomePage } from '@/pages/home-page';
import { LoginPage } from '@/pages/login-page';
import { MeasurementsPage } from '@/pages/measurements-page';
import { OtpPage } from '@/pages/otp-page';
import { ProfileDetailsPage } from '@/pages/profile-details-page';
import { ProfileEditPage } from '@/pages/profile-edit-page';
import { ProfilePage } from '@/pages/profile-page';
import { RegisterPage } from '@/pages/register-page';
import { SettingsPage } from '@/pages/settings-page';
import { LandingPage } from '@/pages/landing-page';

export default function App() {
  const [showStartupSplash, setShowStartupSplash] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.sessionStorage.getItem('mms-startup-splash-shown') !== '1';
  });

  const hideStartupSplash = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('mms-startup-splash-shown', '1');
    }
    setShowStartupSplash(false);
  }, []);

  return (
    <>
      {showStartupSplash && <StartupSplash onComplete={hideStartupSplash} />}

      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route element={<PublicOnlyRoute />}>
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/auth/otp" element={<OtpPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<AppShell />}>
            <Route index element={<Navigate to="home" replace />} />
            <Route path="home" element={<HomePage />} />
            <Route path="explore" element={<ExplorePage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="profile/details" element={<ProfileDetailsPage />} />
            <Route path="profile/edit" element={<ProfileEditPage />} />
            <Route path="measurements" element={<MeasurementsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="change-password" element={<ChangePasswordPage />} />
            <Route path="add-preference" element={<AddPreferencePage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
