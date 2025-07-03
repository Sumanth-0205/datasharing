// src/pages/SignUp.jsx
import { useState } from "react";
import { auth, db } from "../firebase/config";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./Auth.css";
import { sendEmailVerification } from "firebase/auth";



const SignUp = () => {
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password } = formData;
    setError("");

    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(res.user);
toast.info("Verification email sent!");
      await updateProfile(res.user, { displayName: name });

      // Save user data to Firestore
      await setDoc(doc(db, "users", res.user.uid), {
        uid: res.user.uid,
        name,
        email,
        createdAt: new Date()
      });

      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <h2>Sign Up</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <input
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          required
        /><br />
        <input
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          type="email"
          required
        /><br />
        <input
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          type="password"
          required
        /><br />
        <button type="submit">Create Account</button>
      </form>
      {error && <p  className="auth-error">{error}</p>}
      <div className="auth-toggle">
  Already have an account?{" "}
  <span
    onClick={() => navigate("/signin")}
   
  >
    Sign In
  </span>
</div>

    </div>
    
  );
};

export default SignUp;
