// import React, { useState } from 'react';
// import { Link } from 'react-router-dom';
// import './signup.css';
// import axios from 'axios';

// const Signup = () => {
//   const [username, setUsername] = useState('');
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (password !== confirmPassword) {
//       setError('Passwords do not match');
//       return;
//     }

//     setError('');
//     setSuccess('');

//     try {
//       const response = await axios.post('http://localhost:5001/api/auth/signup', {
//         username,
//         email,
//         password,
//       });

//       setSuccess('Signup successful! You can now log in.');
//       console.log(response.data);

//        // Redirect to Login page
//        setTimeout(() => {
//         navigate('/login');
//       }, 2000); // Delay for user feedback
      
//     } catch (err) {
//       setError(err.response?.data?.message || 'An error occurred. Please try again.');
//     }
//   };

//   return (
//     <div className="Signup">
//       <h2>Sign Up</h2>
//       <form onSubmit={handleSubmit}>
//         <input
//           type="text"
//           value={username}
//           onChange={(e) => setUsername(e.target.value)}
//           placeholder="Enter username"
//           required
//         />
//         <input
//           type="email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           placeholder="Enter email"
//           required
//         />
//         <input
//           type="password"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           placeholder="Enter password"
//           required
//         />
//         <input
//           type="password"
//           value={confirmPassword}
//           onChange={(e) => setConfirmPassword(e.target.value)}
//           placeholder="Confirm password"
//           required
//         />
//         {error && <p className="Error">{error}</p>}
//         {success && <p className="Success">{success}</p>}
//         <button type="submit">Sign Up</button>
//       </form>
//       <div className="Login-link">
//         <p>Already have an account? <Link to="/login">Login</Link></p>
//       </div>
//     </div>
//   );
// };

// export default Signup;

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Include useNavigate
import './signup.css';
import axios from 'axios';

const Signup = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate(); // Define navigate here

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError('');
    setSuccess('');

    try {
      const response = await axios.post('http://localhost:5001/api/auth/signup', {
        username,
        email,
        password,
      });

      setSuccess('Signup successful! Redirecting to login...');
      console.log(response.data);

      // Redirect to Login page
      setTimeout(() => {
        navigate('/login');
      }, 2000); // Delay for user feedback
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    }
  };

  return (
    <div className="Signup">
      <h2>Sign Up</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter username"
          required
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          required
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm password"
          required
        />
        {error && <p className="Error">{error}</p>}
        {success && <p className="Success">{success}</p>}
        <button type="submit">Sign Up</button>
      </form>
      <div className="Login-link">
        <p>Already have an account? <Link to="/login">Login</Link></p>
      </div>
    </div>
  );
};

export default Signup;

