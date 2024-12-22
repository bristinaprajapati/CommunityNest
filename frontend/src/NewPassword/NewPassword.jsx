import React, { useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import './NewPassword.css'; // Your CSS for styling the page

const NewPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email; // Email passed from ResetPassword
  const otp = location.state?.otp; // OTP passed from ResetPassword

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);

      // Send email, OTP, and new password to the backend
      const response = await axios.post('http://localhost:5001/api/auth/reset-password', {
        email,
        otp,
        newPassword,
      });

      if (response.data.success) {
        setMessage('Password reset successfully.');
        setTimeout(() => {
          navigate('/login'); // Redirect to login page after successful reset
        }, 2000);
      } else {
        setError(response.data.message || 'Failed to reset password.');
      }
    } catch (err) {
      setError('An error occurred while resetting the password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="NewPassword">
      <h2>Reset Your Password</h2>
      <form onSubmit={handleResetPassword}>
        <input
          type="password"
          placeholder="Enter New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>

      {error && <p className="Error">{error}</p>}
      {message && <p className="Success">{message}</p>}
    </div>
  );
};

export default NewPassword;
