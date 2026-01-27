import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import LoginPage from "./pages/Auth/LoginPage";
import RegisterPage from "./pages/Auth/RegisterPage";
import NotFoundPage from "./pages/NotFoundPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import DocumentListPage from "./pages/Documents/DocumentListPage";
import DocumentDetailPage from "./pages/Documents/DocumentDetailPage";
import FlashcardsListPage from "./pages/Flashcards/FlashcardsListPage";
import FlashcardPage from "./pages/Flashcards/FlashcardPage";
import QuizTakePage from "./pages/Quizzes/QuizTakePage";
import QuizResultPage from "./pages/Quizzes/QuizResultPage";
import ProfilePage from "./pages/Profile/ProfilePage";
import GeneratedFilesPage from "./pages/Admin/GeneratedFilesPage";

import { useAuth } from "./context/AuthContext";
import QuizListPage from "./pages/Quizzes/QuizListPage";
import AdminPage from "./pages/Admin/AdminPage";
import AdminRoutes from "./components/admin/AdminRoutes";
import LibraryPage from "./pages/Library/LibraryPage";

const App = () => {
  const { isAuthenticated, loading } = useAuth();

  return (
    <div
      className={`transition-opacity duration-1000 ${!loading ? "opacity-100" : "opacity-0"}`}
    >
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/documents" element={<DocumentListPage />} />
            <Route path="/documents/:id" element={<DocumentDetailPage />} />
            <Route path="/flashcards" element={<FlashcardsListPage />} />
            <Route path="/quizzes" element={<QuizListPage />} />
            <Route path="/flashcards/:setId" element={<FlashcardPage />} />
            <Route path="/quizzes/:quizId" element={<QuizTakePage />} />
            <Route
              path="/quizzes/:quizId/results"
              element={<QuizResultPage />}
            />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/library" element={<LibraryPage />} />

            {/* ADMIN ROUTES */}
            <Route path="/admin" element={<AdminRoutes />}>
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/admin/ai-files" element={<GeneratedFilesPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Router>
    </div>
  );
};

export default App;
