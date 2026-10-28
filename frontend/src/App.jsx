import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";

// Pages
import LandingPage from "./pages/LandingPage";
import AnalysisPage from "./pages/AnalysisPage";
import HistoryPage from "./pages/HistoryPage";
import ComparisonPage from "./pages/ComparisonPage";
import RoutinePage from "./pages/RoutinePage";
import QuestionnairePage from "./pages/QuestionnairePage";
import HowItWorksPage from "./pages/HowItWorksPage";
import AboutPage from "./pages/AboutPage";
import AuthPage from "./pages/AuthPage";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
          <Navbar />
          <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/analyze" element={<AnalysisPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/compare" element={<ComparisonPage />} />
              <Route path="/routine" element={<RoutinePage />} />
              <Route path="/questionnaire" element={<QuestionnairePage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="/methodology" element={<HowItWorksPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
