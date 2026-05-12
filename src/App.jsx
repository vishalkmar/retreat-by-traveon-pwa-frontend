import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/auth/LoginPage.jsx';
import OtpPage from './pages/auth/OtpPage.jsx';
import OwnerLoginPage from './pages/auth/OwnerLoginPage.jsx';

import AuditorLayout from './layouts/AuditorLayout.jsx';
import AuditorDashboard from './pages/auditor/DashboardPage.jsx';
import AuditorProfile from './pages/auditor/ProfilePage.jsx';
import AuditorProperties from './pages/auditor/PropertiesListPage.jsx';
import AuditorObjections from './pages/auditor/ObjectionsPage.jsx';
import AuditorNewProperty from './pages/auditor/NewPropertyPage.jsx';
import AuditorGenerateId from './pages/auditor/GenerateIdPage.jsx';
import AuditorCapture from './pages/auditor/CapturePage.jsx';
import AuditorSectionEdit from './pages/auditor/SectionEditPage.jsx';
import AuditorPropertyDetail from './pages/auditor/PropertyDetailPage.jsx';

import OfficerLayout from './layouts/OfficerLayout.jsx';
import OfficerDashboard from './pages/officer/DashboardPage.jsx';
import OfficerProfile from './pages/officer/ProfilePage.jsx';
import OfficerReview from './pages/officer/PropertyReviewPage.jsx';

import OwnerLayout from './layouts/OwnerLayout.jsx';
import OwnerDashboard from './pages/owner/DashboardPage.jsx';
import OwnerProperty from './pages/owner/PropertyDetailPage.jsx';

const App = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/login/otp" element={<OtpPage />} />
    <Route path="/owner/login" element={<OwnerLoginPage />} />

    {/* Auditor */}
    <Route
      path="/auditor"
      element={
        <ProtectedRoute roles={['auditor']}>
          <AuditorLayout />
        </ProtectedRoute>
      }
    >
      <Route index element={<AuditorDashboard />} />
      <Route path="profile" element={<AuditorProfile />} />
      <Route path="properties" element={<AuditorProperties />} />
      <Route path="objections" element={<AuditorObjections />} />
      <Route path="properties/new" element={<AuditorNewProperty />} />
      <Route path="properties/:id" element={<AuditorPropertyDetail />} />
      <Route path="properties/:id/generate-id" element={<AuditorGenerateId />} />
      <Route path="properties/:id/capture" element={<AuditorCapture />} />
      <Route path="properties/:id/sections/:sectionKey" element={<AuditorSectionEdit />} />
    </Route>

    {/* Officer */}
    <Route
      path="/officer"
      element={
        <ProtectedRoute roles={['officer']}>
          <OfficerLayout />
        </ProtectedRoute>
      }
    >
      <Route index element={<OfficerDashboard />} />
      <Route path="follow-up" element={<OfficerDashboard />} />
      <Route path="approved" element={<OfficerDashboard />} />
      <Route path="rejected" element={<OfficerDashboard />} />
      <Route path="all" element={<OfficerDashboard />} />
      <Route path="profile" element={<OfficerProfile />} />
      <Route path="properties/:id" element={<OfficerReview />} />
    </Route>

    {/* Owner */}
    <Route
      path="/owner"
      element={
        <ProtectedRoute roles={['owner']}>
          <OwnerLayout />
        </ProtectedRoute>
      }
    >
      <Route index element={<OwnerDashboard />} />
      <Route path="properties/:code" element={<OwnerProperty />} />
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;
