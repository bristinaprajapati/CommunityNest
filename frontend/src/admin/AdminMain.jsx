import React, { useState } from 'react';
import Sidebar from './sidebar/AdminSidebar'; // Import the Sidebar component
import Dashboard from './AdminDashboard/AdminDashboard'; // Import the Dashboard component
// Import additional components as needed
// import Department from './Department/Department';
// import Members from './Members/Members';
// import Meetings from './Meetings/Meetings';
// import Events from './Events/Events';
// import './App.css';

const Main = () => {
  const [selectedCategory, setSelectedCategory] = useState('Dashboard');

  const renderContent = () => {
    switch (selectedCategory) {
      case 'Dashboard':
        return <Dashboard />;
      // Uncomment and use these cases when the components are ready
      // case 'Departments':
      //   return <Department />;
      // case 'Members':
      //   return <Members />;
      // case 'Meetings':
      //   return <Meetings />;
      // case 'Events':
      //   return <Events />;
      default:
        return <div>Select a valid category from the sidebar.</div>;
    }
  };

  return (
    <div className="Main-container">
      <Sidebar onCategorySelect={setSelectedCategory} />
      <div className="Main-content">{renderContent()}</div>
    </div>
  );
};

export default Main;
