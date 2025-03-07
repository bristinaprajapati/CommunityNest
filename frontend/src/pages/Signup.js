import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./signup.css";
import axios from "axios";

const Signup = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("member"); // Default selection is 'member'
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await axios.post("http://localhost:5001/api/auth/signup", {
        username,
        email,
        password,
        status, // Send the selected status to the backend
      });

      setSuccess("Signup successful! Redirecting to login...");
      console.log(response.data);

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred. Please try again.");
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

        {/* Dropdown for selecting status */}
        <select value={status} onChange={(e) => setStatus(e.target.value)} required>
          <option value="member">Member</option>
          <option value="community">Community Admin</option>
        </select>

        {error && <p className="Error">{error}</p>}
        {success && <p className="Success">{success}</p>}
        <button type="submit">Sign Up</button>
      </form>
      <div className="Login-link">
        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
