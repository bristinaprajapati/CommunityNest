import React, { useState } from "react";
import './index.css';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate 
} from "react-router-dom";
import "./App.css";
import Header from "./Header/Header.jsx";
import Main from "./Main.jsx";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Department from "./Department/department.jsx";
import ForgotPassword from "./ForgotPassword/ForgotPassword";
import ResetPassword from "./ResetPassword/ResetPassword";
import NewPassword from "./NewPassword/NewPassword.jsx";
import DocumentRepository from "./Department/DocumentRepository.jsx";
import EditorPage from "./Department/EditorPage";
import EventDetails from "./Events/EventDetails.jsx";
import Dashboard from "./Dashboard/dashboard.jsx";
import AdminUserMeetings from "./Meetings/meeting.jsx";
import AdminUserEvents from "./Events/event.jsx";
import Modal from "./Department/Modal.jsx";
import FileViewer from "./Department/FileViewer.jsx";
import ScheduleMeetingForm from "./Meetings/meeting.jsx";
import AdminDashboard from "./admin/AdminDashboard/AdminDashboard.jsx";
import AdminMain from "./admin/AdminMain.jsx";
import Members from "./admin/Admin_Members/Members.jsx";
import Departments from "./admin/Admin_Departments/Department.jsx";
import Events from "./admin/Admin_Events/Event.jsx";
import Meetings from "./admin/Admin_Meetings/Meeting.jsx";
import MembersPage from "./Member/member.jsx";
import { NotificationProvider } from './contexts/NotificationContext'; // Updated import path
import { AuthProvider } from './AuthContext';
import Chat from './Chat/chat';
import Feed from './feed/feed'; 


function App() {
  const [selectedCategory, setSelectedCategory] = useState("Departments");
  const location = useLocation();

  const hideHeaderRoutes = [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/new-password",
    "/google-signin",
  ];

  return (
    <AuthProvider>
    <NotificationProvider> {/* Wrap entire app with NotificationProvider */}
      <div className="App">
        {!hideHeaderRoutes.includes(location.pathname) && <Header />}
        <Routes>
            {/* redirect to login */}
            <Route path="/" element={<Navigate to="/login" replace />} />
          <Route
            path="/main"
            element={
              <Main
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
              />
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/main" element={<Main />} />
          <Route path="/department" element={<Department />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/new-password" element={<NewPassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route
            path="/department/:department/documents"
            element={<DocumentRepository />}
          />
          <Route
            path="/department/:department/documents/create"
            element={<EditorPage />}
          />
          <Route
            path="/department/:department/documents/edit/:id"
            element={<EditorPage />}
          />
          <Route
            path="/department/:department/documents/view/:id"
            element={<Modal />}
          />
          {/* chats */}
          <Route path="/chat/:chatId?" element={<Chat />} />
          <Route path="/feed" element={<Feed />} />
    

          <Route path="/view/:filename/:fileType" element={<FileViewer />} />
          <Route path="/members" element={<MembersPage />} />
          <Route path="/meeting" element={<ScheduleMeetingForm />} />
          <Route path="/event/:eventId" element={<EventDetails />} />
          <Route path="/admin-user-meetings" element={<AdminUserMeetings />} />
          <Route path="/admin-user-events" element={<AdminUserEvents />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/admin-main" element={<AdminMain />} />
          <Route path="/Members" element={<Members />} />
          <Route path="/departments" element={<Departments />} />
          <Route path="/events" element={<Events />} />
          <Route path="/meetings" element={<Meetings />} />
        </Routes>
      </div>
    </NotificationProvider>
    </AuthProvider>
  );
}

function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

export default AppWrapper;