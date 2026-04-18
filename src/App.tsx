/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Page, Role } from './types';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { StudentManagement } from './components/StudentManagement';
import { TestManagement } from './components/TestManagement';
import { TestResults } from './components/TestResults';
import { CompanyAnalysis } from './components/CompanyAnalysis';
import { StudentDashboard } from './components/student/StudentDashboard';
import { StudentTests } from './components/student/StudentTests';
import { StudentProfile } from './components/student/StudentProfile';
import { StudentAnalytics } from './components/student/StudentAnalytics';
import { AuthPortal } from './components/auth/AuthPortal';

const GOOGLE_CLIENT_ID = "845986523822-3qmmfga8cnjnmmjer7hht12r60ijd764.apps.googleusercontent.com";

interface UserState {
  email: string;
  role: Role;
  name: string;
  dept: string;
}

export default function App() {
  const [user, setUser] = useState<UserState | null>(() => {
    const saved = localStorage.getItem('placementos_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  useEffect(() => {
    if (user) {
      localStorage.setItem('placementos_user', JSON.stringify(user));
      // Set initial page based on role
      if (user.role === 'student') {
        setCurrentPage('student-dashboard');
      } else {
        setCurrentPage('dashboard');
      }
    } else {
      localStorage.removeItem('placementos_user');
    }
  }, [user]);

  const handleLogin = (userData: UserState) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <AuthPortal onLogin={handleLogin} />
      </GoogleOAuthProvider>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'students': return <StudentManagement />;
      case 'tests': return <TestManagement />;
      case 'results': return <TestResults />;
      case 'company-analysis': return <CompanyAnalysis />;
      case 'student-dashboard': return <StudentDashboard user={user} onStartAssessments={() => setCurrentPage('student-tests')} />;
      case 'student-tests': return <StudentTests user={user} />;
      case 'student-profile': return <StudentProfile user={user} />;
      case 'student-analytics': return <StudentAnalytics user={user} />;
      default: return user.role === 'student' ? <StudentDashboard user={user} onStartAssessments={() => setCurrentPage('student-tests')} /> : <Dashboard />;
    }
  };

  return (
    <Layout 
      currentPage={currentPage} 
      setCurrentPage={setCurrentPage} 
      role={user.role}
      onLogout={handleLogout}
      userName={user.name}
    >
      {renderPage()}
    </Layout>
  );
}

