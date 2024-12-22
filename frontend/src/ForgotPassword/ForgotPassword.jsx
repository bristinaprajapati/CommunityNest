// import React, { useState } from 'react';
// import axios from 'axios';
// import './ForgotPassword.css';  // Your CSS for styling the page

// const ForgotPassword = () => {
//   const [email, setEmail] = useState('');
//   const [error, setError] = useState('');
//   const [message, setMessage] = useState('');
//   const [loading, setLoading] = useState(false);

//   const handleForgotPassword = async (e) => {
//     e.preventDefault();
//     setError('');
//     setMessage('');
//     setLoading(true); // Set loading state when starting the request

//     try {
//         const response = await axios.post('http://localhost:5001/api/auth/forgot-password', {
//             email,
//           });
          

//       if (response.data.success) {
//         setMessage('A password reset link has been sent to your email.');
//       } else {
//         setError(response.data.message || 'Failed to send password reset link.');
//       }
//     } catch (err) {
//       setError('An error occurred while trying to send the reset link.');
//     } finally {
//       setLoading(false); // Reset loading state once the request finishes
//     }
//   };

//   return (
//     <div className="ForgotPassword">
//       <h2>Forgot Your Password?</h2>
//       <p>
//         Enter your email address below, and we will send you a link to reset your password.
//       </p>

//       <form onSubmit={handleForgotPassword}>
//         <div className="InputWrapper">
//           <input
//             type="email"
//             placeholder="Enter your email"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             required
//             className="EmailInput"
//           />
//         </div>

//         {loading ? (
//           <button type="button" disabled className="LoadingButton">
//             Sending...
//           </button>
//         ) : (
//           <button type="submit" className="ResetButton">
//             Send Reset Link
//           </button>
//         )}
//       </form>

//       {error && <p className="Error">{error}</p>}
//       {message && <p className="Success">{message}</p>}

//       <div className="BackToLogin">
//         <p>
//           Remember your password? <a href="/login">Go back to login</a>
//         </p>
//       </div>
//     </div>
//   );
// };

// export default ForgotPassword;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import axios from 'axios';
import './ForgotPassword.css'; // Your CSS for styling the page

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate(); // Initialize navigate hook

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true); // Set loading state when starting the request

    try {
      const response = await axios.post('http://localhost:5001/api/auth/forgot-password', {
        email,
      });

      if (response.data.success) {
        // Redirect to OTP entry page with email as state
        navigate('/reset-password', { state: { email } });
      } else {
        setError(response.data.message || 'Failed to send password reset link.');
      }
    } catch (err) {
      setError('An error occurred while trying to send the reset link.');
    } finally {
      setLoading(false); // Reset loading state once the request finishes
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
          />
        </div>

        {loading ? (
          <button type="button" disabled className="LoadingButton">
            Sending...
          </button>
        ) : (
          <button type="submit" className="ResetButton">
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
