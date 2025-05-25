import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Use effect to set email from location state when component mounts
  useEffect(() => {
    const emailFromLogin = location.state?.email;
    if (emailFromLogin) {
      setEmail(emailFromLogin);
      // Validate the email when component loads with a pre-filled email
      validateEmail(emailFromLogin);
    }
  }, [location.state]);

  // Function to validate if email exists
  const validateEmail = async (emailToValidate) => {
    if (!emailToValidate) return;
    
    setIsValidating(true);
    setError('');
    
    try {
      // Send a request to check if the email exists
      const response = await axios.post('http://localhost:5001/api/auth/forgot-password', {
        email: emailToValidate,
        checkOnly: true // Add this flag to tell the backend we're just checking
      });
      
      if (!response.data.exists) {
        setError('This email is not registered in our system.');
      }
    } catch (err) {
      setError('This email is not registered in our system.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5001/api/auth/forgot-password', {
        email,
      });

      if (response.data.success) {
        navigate('/reset-password', { state: { email } });
      } else {
        setError(response.data.message || 'Failed to send password reset link.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while trying to send the reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ForgotPassword">
      <h2>Forgot Your Password?</h2>
      <p>
        Enter your email address below, and we will send you a link to reset your password.
      </p>

      <form onSubmit={handleForgotPassword}>
        <div className="InputWrapper">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="EmailInput"
            readOnly={location.state?.email ? true : false}
          />
        </div>

        {isValidating ? (
          <p className="Info">Validating email...</p>
        ) : loading ? (
          <button type="button" disabled className="LoadingButton">
            Sending...
          </button>
        ) : (
          <button type="submit" className="ResetButton" disabled={!!error}>
            Send Reset Link
          </button>
        )}
      </form>

      {error && <p className="Error">{error}</p>}
      {message && <p className="Success">{message}</p>}

      <div className="BackToLogin">
        <p>
          Remember your password? <a href="/login">Go back to login</a>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;