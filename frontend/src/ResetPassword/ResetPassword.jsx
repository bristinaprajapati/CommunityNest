// import React, { useState } from 'react';
// import axios from 'axios';
// import { useLocation, useNavigate } from 'react-router-dom';

// const ResetPassword = () => {
//   const [otp, setOtp] = useState('');
//   const [newPassword, setNewPassword] = useState('');
//   const [error, setError] = useState('');
//   const [message, setMessage] = useState('');
//   const [otpSent, setOtpSent] = useState(false);  // Flag to check if OTP is sent
//   const [loading, setLoading] = useState(false);

//   const location = useLocation();
//   const navigate = useNavigate();  // Replace useHistory with useNavigate()

//   const handleResetPassword = async (e) => {
//     e.preventDefault();
//     setError('');
//     setMessage('');

//     try {
//       setLoading(true);

//       // Send OTP and new password to the backend for verification and update
//       const response = await axios.post('http://localhost:5001/api/auth/reset-password', {
//         otp,
//         newPassword,
//       });

//       if (response.data.success) {
//         setMessage('Password has been successfully reset.');
//         setTimeout(() => {
//           navigate('/login'); // Use navigate instead of history.push
//         }, 2000);
//       } else {
//         setError(response.data.message || 'Failed to reset password.');
//       }
//     } catch (err) {
//       setError('An error occurred while trying to reset the password.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSendOtp = async () => {
//     setError('');
//     setMessage('');

//     try {
//       // Send the email for OTP generation
//       const response = await axios.post('http://localhost:5001/api/auth/forgot-password', {
//         email: newPassword, // Assuming email is sent as part of the newPassword field
//       });

//       if (response.data.success) {
//         setOtpSent(true);  // OTP has been sent successfully
//         setMessage('OTP has been sent to your email.');
//       } else {
//         setError(response.data.message || 'Failed to send OTP.');
//       }
//     } catch (err) {
//       setError('An error occurred while trying to send OTP.');
//     }
//   };

//   return (
//     <div className="ResetPassword">
//       <h2>Reset Password</h2>

//       {!otpSent ? (
//         <div>
//           <input
//             type="email"
//             placeholder="Enter your email"
//             value={newPassword}
//             onChange={(e) => setNewPassword(e.target.value)}
//             required
//           />
//           <button onClick={handleSendOtp}>Send OTP</button>
//         </div>
//       ) : (
//         <form onSubmit={handleResetPassword}>
//           <input
//             type="text"
//             placeholder="Enter OTP"
//             value={otp}
//             onChange={(e) => setOtp(e.target.value)}
//             required
//           />
//           <input
//             type="password"
//             placeholder="Enter new password"
//             value={newPassword}
//             onChange={(e) => setNewPassword(e.target.value)}
//             required
//           />
//           <button type="submit" disabled={loading}>
//             {loading ? 'Processing...' : 'Reset Password'}
//           </button>
//         </form>
//       )}

//       {error && <p className="Error">{error}</p>}
//       {message && <p className="Success">{message}</p>}
//     </div>
//   );
// };



// // export default ResetPassword;
// import React, { useState } from 'react';
// import axios from 'axios';
// import { useLocation, useNavigate } from 'react-router-dom';

// const ResetPassword = () => {
//   const [otp, setOtp] = useState('');
//   const [newPassword, setNewPassword] = useState('');
//   const [error, setError] = useState('');
//   const [message, setMessage] = useState('');
//   const [loading, setLoading] = useState(false);

//   const location = useLocation();
//   const navigate = useNavigate();

//   // Extract email from location state
//   const email = location.state?.email;

//   const handleResetPassword = async (e) => {
//     e.preventDefault();
//     setError('');
//     setMessage('');

//     try {
//       setLoading(true);

//       // Send OTP, email, and new password to the backend
//       const response = await axios.post('http://localhost:5001/api/auth/reset-password', {
//         email,
//         otp,
//         newPassword,
//       });

//       if (response.data.success) {
//         setMessage('Password has been successfully reset.');
//         setTimeout(() => {
//           navigate('/login');
//         }, 2000); // Redirect after 2 seconds
//       } else {
//         setError(response.data.message || 'Failed to reset password.');
//       }
//     } catch (err) {
//       setError('An error occurred while trying to reset the password.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="ResetPassword">
//       <h2>Reset Password</h2>
//       <p>An OTP has been sent to your email: {email}</p>

//       <form onSubmit={handleResetPassword}>
//         <input
//           type="text"
//           placeholder="Enter OTP"
//           value={otp}
//           onChange={(e) => setOtp(e.target.value)}
//           required
//         />
//         <input
//           type="password"
//           placeholder="Enter new password"
//           value={newPassword}
//           onChange={(e) => setNewPassword(e.target.value)}
//           required
//         />
//         <button type="submit" disabled={loading}>
//           {loading ? 'Processing...' : 'Reset Password'}
//         </button>
//       </form>

//       {error && <p className="Error">{error}</p>}
//       {message && <p className="Success">{message}</p>}
//     </div>
//   );
// };

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
