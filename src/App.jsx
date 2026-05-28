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
import AuditorListingImages from './pages/auditor/ListingImagesPage.jsx';
import AuditorContracts from './pages/auditor/ContractsPage.jsx';
import AuditorPhase4 from './pages/auditor/Phase4Page.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';

import OfficerLayout from './layouts/OfficerLayout.jsx';
import OfficerDashboard from './pages/officer/DashboardPage.jsx';
import OfficerProfile from './pages/officer/ProfilePage.jsx';
import OfficerReview from './pages/officer/PropertyReviewPage.jsx';
import OfficerPhase4Review from './pages/officer/Phase4ReviewPage.jsx';
import OfficerContracts from './pages/officer/ContractsPage.jsx';

import OwnerLayout from './layouts/OwnerLayout.jsx';
import OwnerDashboard from './pages/owner/DashboardPage.jsx';
import OwnerProperty from './pages/owner/PropertyDetailPage.jsx';
import OwnerProperties from './pages/owner/PropertiesListPage.jsx';
import OwnerProfile from './pages/owner/ProfilePage.jsx';
import OwnerSelfNew from './pages/owner/NewSelfPropertyPage.jsx';
import OwnerSelfGenerateId from './pages/owner/SelfGenerateIdPage.jsx';
import OwnerSelfCapture from './pages/owner/SelfCapturePage.jsx';
import OwnerSelfSectionEdit from './pages/owner/SelfSectionEditPage.jsx';
import OwnerSelfPhase4 from './pages/owner/SelfPhase4Page.jsx';
import OwnerSelfDetail from './pages/owner/SelfPropertyDetailPage.jsx';
import OwnerObjections from './pages/owner/ObjectionsPage.jsx';
import OwnerReceivedContract from './pages/owner/ReceivedContractPage.jsx';
import OwnerUploadSigned from './pages/owner/UploadSignedPage.jsx';
import OwnerFinalPreview from './pages/owner/FinalPreviewPage.jsx';
import OwnerLinkedReceivedContract from './pages/owner/LinkedReceivedContractPage.jsx';
import OwnerLinkedUploadSigned from './pages/owner/LinkedUploadSignedPage.jsx';
import OwnerLinkedFinalPreview from './pages/owner/LinkedFinalPreviewPage.jsx';


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
      <Route path="properties/:id/phase4" element={<AuditorPhase4 />} />
      <Route path="listing-images" element={<AuditorListingImages />} />
      <Route path="contracts" element={<AuditorContracts />} />
      <Route path="notifications" element={<NotificationsPage />} />
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
      <Route path="phase4" element={<OfficerDashboard />} />
      <Route path="follow-up" element={<OfficerDashboard />} />
      <Route path="approved" element={<OfficerDashboard />} />
      <Route path="rejected" element={<OfficerDashboard />} />
      <Route path="all" element={<OfficerDashboard />} />
      <Route path="profile" element={<OfficerProfile />} />
      <Route path="notifications" element={<NotificationsPage />} />
      <Route path="contracts" element={<OfficerContracts />} />
      <Route path="properties/:id" element={<OfficerReview />} />
      <Route path="properties/:id/phase4" element={<OfficerPhase4Review />} />
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
      <Route path="properties" element={<OwnerProperties />} />
      <Route path="properties/:code" element={<OwnerProperty />} />
      <Route path="properties/:code/received-contract" element={<OwnerLinkedReceivedContract />} />
      <Route path="properties/:code/upload-signed" element={<OwnerLinkedUploadSigned />} />
      <Route path="properties/:code/final-preview" element={<OwnerLinkedFinalPreview />} />
      <Route path="profile" element={<OwnerProfile />} />
      <Route path="notifications" element={<NotificationsPage />} />
      <Route path="objections" element={<OwnerObjections />} />

      {/* Self-onboarding lifecycle */}
      <Route path="self/new" element={<OwnerSelfNew />} />
      <Route path="self/:id" element={<OwnerSelfDetail />} />
      <Route path="self/:id/generate-id" element={<OwnerSelfGenerateId />} />
      <Route path="self/:id/capture" element={<OwnerSelfCapture />} />
      <Route path="self/:id/sections/:sectionKey" element={<OwnerSelfSectionEdit />} />
      <Route path="self/:id/phase4" element={<OwnerSelfPhase4 />} />
      <Route path="self/:id/received-contract" element={<OwnerReceivedContract />} />
      <Route path="self/:id/upload-signed" element={<OwnerUploadSigned />} />
      <Route path="self/:id/final-preview" element={<OwnerFinalPreview />} />
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;
