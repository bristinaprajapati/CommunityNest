import React, { useState } from 'react';
import Sidebar from './Sidebar/sidebar'; // Import the Sidebar component
import Department from './Department/department'; // Import the Department component
import Dashboard from './Dashboard/dashboard'; // Import the Dashboard component
import './App.css';

const Main = () => {
  const [selectedCategory, setSelectedCategory] = useState('Departments');

  const renderContent = () => {
    switch (selectedCategory) {
      case 'Departments':
        return <Department onSelectDepartment={(dept) => setSelectedCategory(dept)} />;
      case 'Dashboard':
        return <Dashboard />;
      default:
        return <div>Other Content</div>;
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
