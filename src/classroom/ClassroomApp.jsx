import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import ClassDetail from './components/ClassDetail';
import AssignmentDetail from './components/AssignmentDetail';
import CreateClass from './components/CreateClass';
import JoinClass from './components/JoinClass';
import CreateAssignment from './components/CreateAssignment';
import TakeAssignment from './components/TakeAssignment';
import GradingView from './components/GradingView';
import StudentList from './components/StudentList';
import ClassroomLogin from './components/ClassroomLogin';
import ClassroomNavbar from './components/ClassroomNavbar';
import AuthRequired from './components/AuthRequired';
import { AuthProvider } from './hooks/useAuth.jsx';
import { ClassroomProvider } from './hooks/useClassroom.jsx';
import { ToastProvider } from './hooks/useToast.jsx';
import './styles/ClassroomApp.css';

const ClassroomApp = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <ClassroomProvider>
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
            <Routes>
              {/* Public routes - no navbar */}
              <Route path="/login" element={<ClassroomLogin />} />
              
              {/* All other routes - with navbar */}
              <Route path="/*" element={
                <>
                  <ClassroomNavbar />
                  <main className="pt-20">
                    <Routes>
                      {/* Protected routes */}
                      <Route path="/" element={
                        <AuthRequired>
                          <Dashboard />
                        </AuthRequired>
                      } />
                      
                      <Route path="/create" element={
                        <AuthRequired>
                          <CreateClass />
                        </AuthRequired>
                      } />
                      
                      <Route path="/join" element={
                        <AuthRequired>
                          <JoinClass />
                        </AuthRequired>
                      } />
                      
                      <Route path="/:classId" element={
                        <AuthRequired>
                          <ClassDetail />
                        </AuthRequired>
                      } />
                      
                      <Route path="/:classId/assignments/create" element={
                        <AuthRequired>
                          <CreateAssignment />
                        </AuthRequired>
                      } />
                      
                      <Route path="/:classId/assignments/:assignmentId" element={
                        <AuthRequired>
                          <AssignmentDetail />
                        </AuthRequired>
                      } />
                      
                      <Route path="/:classId/assignments/:assignmentId/take" element={
                        <AuthRequired>
                          <TakeAssignment />
                        </AuthRequired>
                      } />
                      
                      <Route path="/:classId/assignments/:assignmentId/grade" element={
                        <AuthRequired>
                          <GradingView />
                        </AuthRequired>
                      } />
                      
                      <Route path="/:classId/students" element={
                        <AuthRequired>
                          <StudentList />
                        </AuthRequired>
                      } />
                    </Routes>
                  </main>
                </>
              } />
            </Routes>
          </div>
        </ClassroomProvider>
      </AuthProvider>
    </ToastProvider>
  );
};

export default ClassroomApp;