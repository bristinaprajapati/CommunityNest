import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './login.css';
import ReCAPTCHA from 'react-google-recaptcha';

const SITE_KEY ='6LdS7qIqAAAAABLLeQHDUNylcYpE4rNn1bvdgS0i'

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // Error state to display feedback
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
  
    try {
      const response = await axios.post('http://localhost:5001/api/auth/login', {
        email,
        password,
      });
  
      console.log('Login successful:', response.data);
      // Save userId to localStorage
      localStorage.setItem("userId", response.data.userId);
  
      if (response.data.isAdmin) {
        navigate('/admin-main'); // Navigate to AdminDashboard.jsx for admin
      } else {
        navigate('/main'); // Navigate to the main page for regular users
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    }
  };
  
  // Handle Forgot Password logic
  const handleForgotPassword = () => {
    console.log('Forgot Password clicked');
    // Navigate to forgot password page
    navigate('/forgot-password');
  };

  // For ReCAPTCHA
  const onChange = value => { 
    console.log(value) // prints the token
  }

  return (
    <div className="Login">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
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
        {error && <p className="Error">{error}</p>} {/* Display error if present */}

        <div className="recaptcha">
          <ReCAPTCHA sitekey={SITE_KEY} onChange={onChange} />
        </div>

        {/* Forgot Password button */}
        <button
          type="button"
          className="Forgot-password"
          onClick={handleForgotPassword}
        >
          Forgot Password?
        </button>

        <button type="submit" className="Login-btn">
          Login
        </button>
      </form>

      <div className="Signup-link">
        <p>
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
