// import React from 'react';
// import { BrowserRouter as Router, Route, Switch, Link } from 'react-router-dom';

// const Dashboard = () => {
//     return (
//         <div>
//             <h1>Dashboard</h1>
//             <section>
//                 <h2>Announcements</h2>
//                 <p>Here you can view announcements from the admin.</p>
//                 {/* Add logic to fetch and display announcements */}
//             </section>
//             <div className="cards">
//                 <div className="card">
//                     <h3>Departments</h3>
//                     <p>Count: {/* Add logic to fetch and display department count */}</p>
//                 </div>
//                 <div className="card">
//                     <h3>Upcoming Events</h3>
//                     <p>Count: {/* Add logic to fetch and display upcoming events count */}</p>
//                 </div>
//                 <div className="card">
//                     <h3>Upcoming Meetings</h3>
//                     <p>Count: {/* Add logic to fetch and display upcoming meetings count */}</p>
//                 </div>
//                 <div className="card">
//                     <h3>Total Members</h3>
//                     <p>Count: {/* Add logic to fetch and display total members count */}</p>
//                 </div>
//             </div>
//         </div>
//     );
// };

// const App = () => {
//     return (
//         <Router>
//             <div>
//                 <nav>
//                     <ul>
//                         <li>
//                             <Link to="/dashboard">Dashboard</Link>
//                         </li>
//                         {/* Add other navigation links here */}
//                     </ul>
//                 </nav>
//                 <Switch>
//                     <Route path="/dashboard" component={Dashboard} />
//                     {/* Add other routes here */}
//                 </Switch>
//             </div>
//         </Router>
//     );
// };

// export default App;

import React from 'react';
import './dashboard.css';

const Dashboard = () => {
  return (
    <div className="Dashboard">
      {/* Announcement Section */}
      <div className="Announcement-section">
        <h2>Announcements</h2>
        <div className="Announcement">
          <p>📢 New meeting scheduled for Friday at 3 PM in the conference room.</p>
          <p>📢 Don't forget to submit your monthly reports!</p>
        </div>
      </div>

      {/* Cards Section */}
      <div className="Cards-section">
        <div className="Card">
          <h3>Departments</h3>
          <p>5</p>
        </div>
        <div className="Card">
          <h3>Members</h3>
          <p>25</p>
        </div>
        <div className="Card">
          <h3>Upcoming Events</h3>
          <p>3</p>
        </div>
        <div className="Card">
          <h3>Meetings</h3>
          <p>2</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
