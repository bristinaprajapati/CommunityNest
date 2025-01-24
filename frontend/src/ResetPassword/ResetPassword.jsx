// export default ResetPassword;
import React, { useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import './ResetPassword.css'; // Your CSS for styling the page

const ResetPassword = () => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email; // Email passed from ForgotPassword

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      setLoading(true);

      // Send OTP and email to the backend for verification
      const response = await axios.post('http://localhost:5001/api/auth/verify-otp', {
        email,
        otp,
      });

      if (response.data.success) {
        setMessage('OTP verified successfully.');
        setTimeout(() => {
          // Redirect to new password page with email and otp
          navigate('/new-password', { state: { email, otp } });
        }, 2000);
      } else {
        setError(response.data.message || 'Invalid OTP.');
      }
    } catch (err) {
      setError('An error occurred while verifying OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ResetPassword">
      <h2>Enter OTP</h2>
      <p>An OTP has been sent to your email: {email}</p>

      <form onSubmit={handleVerifyOtp}>
        <input
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Verifying...' : 'Verify OTP'}
        </button>
      </form>

      {error && <p className="Error">{error}</p>}
      {message && <p className="Success">{message}</p>}
    </div>
  );
};

export default ResetPassword;
