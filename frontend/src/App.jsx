import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import './App.css';
import Header from './Header/Header.jsx';
import Main from './Main.jsx';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Department from './Department/department.jsx';
import ForgotPassword from './ForgotPassword/ForgotPassword';
import ResetPassword from './ResetPassword/ResetPassword';
import NewPassword from './NewPassword/NewPassword.jsx';
import Dashboard from './Dashboard/dashboard.jsx';
import DocumentRepository from './Department/DocumentRepository.jsx'; // Document Repository Page
import EditorPage from "./Department/EditorPage";
import AdminUserMeetings from './Meetings/meeting.jsx';
import AdminUserEvents from './Events/event.jsx'; 



import AdminDashboard from './admin/AdminDashboard/AdminDashboard.jsx';
import AdminMain from './admin/AdminMain.jsx';
import Members from './admin/Admin_Members/Members.jsx';
import Departments from './admin/Admin_Departments/Department.jsx';
import Events from './admin/Admin_Events/Event.jsx';
import Meetings from './admin/Admin_Meetings/Meeting.jsx';
//user



function App() {
  const [selectedCategory, setSelectedCategory] = useState('Departments');
  const location = useLocation();

    // Define routes where the Header should be hidden
    const hideHeaderRoutes = ['/login', '/signup', '/forgot-password', '/reset-password', '/new-password'];  // Add reset-password if needed


  return (
    <div className="App">
      {/* Render Header only if the current route is not in hideHeaderRoutes */}
      {!hideHeaderRoutes.includes(location.pathname) && <Header />}
      <Routes>
        <Route
          path="/"
          element={
            <Main selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} />
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
        <Route path="/documentrepository" element={<DocumentRepository />} />
        {/* <Route path="/department/:deptName/documents" element={<DocumentRepository />} /> */}
        <Route path="/department/:spaceName/documents" element={<DocumentRepository />} /> // Update the path to include spaceName
        {/* <Route path="/documents/edit/:id" component={EditorPage} /> */}

        <Route path="/documents/create" element={<EditorPage />} />
        <Route path="/documents/edit/:id" element={<EditorPage />} />

        {/* <Route path="/documents/edit/:id" element={<EditorPage />} /> */}





        <Route path ="/admin-user-meetings" element={<AdminUserMeetings />} />
        <Route path ="/admin-user-events" element={<AdminUserEvents />} />




        <Route path="/admin-dashboard" element={<AdminDashboard />} /> 
        <Route path="/admin-main" element={<AdminMain />} /> 
        <Route path="/Members" element={<Members />} />
        <Route path="/departments" element={<Departments />} />
        <Route path="/events" element={<Events />} />
        <Route path="/meetings" element={<Meetings />} />

        
      </Routes>
    </div>
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
