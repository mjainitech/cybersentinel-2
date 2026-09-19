import { Routes, Route } from "react-router-dom";
import { LandingPage } from "@/pages/LandingPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage";
import { ResetPasswordPage } from "@/pages/ResetPasswordPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { WebsiteScannerPage } from "@/pages/WebsiteScannerPage";
import { ScanHistoryPage } from "@/pages/ScanHistoryPage";
import { ResumePrivacyScannerPage } from "@/pages/ResumePrivacyScannerPage";
import { EmailPhishingAnalyzerPage } from "@/pages/EmailPhishingAnalyzerPage";
import { PasswordSecurityCenterPage } from "@/pages/PasswordSecurityCenterPage";
import { DataBreachCheckerPage } from "@/pages/DataBreachCheckerPage";
import { SecurityCenterPage } from "@/pages/SecurityCenterPage";
import { LearningHubPage } from "@/pages/LearningHubPage";
import { LessonPage } from "@/pages/LessonPage";
import { ThreatIntelligencePage } from "@/pages/ThreatIntelligencePage";
import { ThreatDetailPage } from "@/pages/ThreatDetailPage";
import { AnalyticsPage } from "@/pages/AnalyticsPage";
import { AISecurityCoachPage } from "@/pages/AISecurityCoachPage";
import { ActionCenterPage } from "@/pages/ActionCenterPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

/**
 * Central route table. Every dashboard sub-route now renders a real
 * page — the last ComingSoonPage placeholder (Settings) was replaced
 * when notification preferences needed a real home.
 */
function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/dashboard/url-scanner" element={<WebsiteScannerPage />} />
      <Route path="/dashboard/history" element={<ScanHistoryPage />} />
      <Route path="/dashboard/email-scanner" element={<EmailPhishingAnalyzerPage />} />
      <Route path="/dashboard/resume-scanner" element={<ResumePrivacyScannerPage />} />
      <Route path="/dashboard/password-center" element={<PasswordSecurityCenterPage />} />
      <Route path="/dashboard/breach-checker" element={<DataBreachCheckerPage />} />
      <Route path="/dashboard/security-score" element={<SecurityCenterPage />} />
      <Route path="/dashboard/learning-hub" element={<LearningHubPage />} />
      <Route path="/dashboard/learning-hub/lessons/:id" element={<LessonPage />} />
      <Route path="/threat-intelligence" element={<ThreatIntelligencePage />} />
      <Route path="/threat-intelligence/:id" element={<ThreatDetailPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/ai-security-coach" element={<AISecurityCoachPage />} />
      <Route path="/action-center" element={<ActionCenterPage />} />
      <Route path="/dashboard/settings" element={<SettingsPage />} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
