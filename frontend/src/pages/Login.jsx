import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './login.css';
import ReCAPTCHA from 'react-google-recaptcha';
import { AuthContext } from '../AuthContext';
import { FiEye, FiEyeOff } from 'react-icons/fi'; // Import eye icons

const SITE_KEY = '6LdS7qIqAAAAABLLeQHDUNylcYpE4rNn1bvdgS0i';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // New state for password visibility
  const navigate = useNavigate();
  const { setShouldCheckGoogleAuth } = useContext(AuthContext);
  const [recaptchaToken, setRecaptchaToken] = useState('');

  const onChange = (value) => {
    setRecaptchaToken(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!recaptchaToken) {
      setError('Please complete the CAPTCHA.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:5001/api/auth/login', {
        email,
        password,
        recaptchaToken,
      });

      console.log('Login successful:', response.data);

      // Store token and user data in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userId', response.data.userId); 
      localStorage.setItem('username', response.data.username);
      localStorage.setItem('email', response.data.email);
      localStorage.setItem("status", response.data.status);
      localStorage.setItem("profileImage", response.data.profileImage || ""); // Store empty string if no image

      // Fetch user data after login
      await fetchUserData(response.data.token);

      // Notify AuthContext that login was successful
      setShouldCheckGoogleAuth(true);

      // Navigate to appropriate dashboard
      if (response.data.isAdmin) {
        navigate('/admin-main');
      } else {
        navigate('/main');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user data after login
  const fetchUserData = async (token) => {
    if (!token) {
      console.log('No token found');
      return;
    }

    try {
      const response = await axios.get('http://localhost:5001/api/auth/data', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('User data:', response.data);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  };

  // Handle Forgot Password logic
  const handleForgotPassword = () => {
    console.log('Forgot Password clicked');
    navigate('/forgot-password', { state: { email } });
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

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
        <div className="password-input-container">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            required
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FiEyeOff /> : <FiEye />}
          </button>
        </div>
        {error && <p className="Error">{error}</p>}

        <div className="recaptcha">
          <ReCAPTCHA sitekey={SITE_KEY} onChange={onChange} />
        </div>

        <button
          type="button"
          className="Forgot-password"
          onClick={handleForgotPassword}
        >
          Forgot Password?
        </button>

        <button type="submit" className="Login-btn" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
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