import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/config";
import { useNavigate } from "react-router-dom";
import "./Auth.css";
import { Link } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase/config";


const SignIn = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const { email, password } = formData;

    try {
  const res = await signInWithEmailAndPassword(auth, email, password);

  // ✅ Check if user doc exists — if not, create it
  const userRef = doc(db, "users", res.user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    await setDoc(userRef, {
      uid: res.user.uid,
      email: res.user.email,
      name: res.user.displayName || "Unnamed",
      createdAt: new Date(),
    });
    console.log("User document added to Firestore after sign in");
  }

  navigate("/dashboard");
} catch (err) {
  setError("Invalid email or password.");
}
  };

  return (
     <div className="auth-container">
      <h2>Sign In</h2>
      <form onSubmit={handleSubmit}  className="auth-form">
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
          <button type="submit">Log In</button>
        {error && <p className="auth-error">{error}</p>}
      </form>
       <div className="auth-toggle">
  New user?{" "}
  <span
    onClick={() => navigate("/")}
    
  >
    Sign Up first
  </span>
</div>
<p style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
  <Link to="/forgot-password">Forgot Password?</Link>
</p>

    </div>
  );
};

export default SignIn;
