import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "../firebase/config";
import { useNavigate } from "react-router-dom";

import { collection, getDocs } from "firebase/firestore";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const emailLower = email.trim().toLowerCase();
      const snapshot = await getDocs(collection(db, "users"));
      const exists = snapshot.docs.some(
        (doc) => doc.data().email?.toLowerCase() === emailLower
      );

      if (!exists) {
        toast.error("This email is not registered.");
        setLoading(false);
        return;
      }

      await sendPasswordResetEmail(auth, emailLower);
      toast.success("Reset link sent. Check your inbox.");
    } catch (err) {
      toast.error(err.message || "Failed to send reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "400px", margin: "2rem auto" }}>
      <h2 style={{ marginBottom: "1rem" }}>Forgot Password</h2>
      <form
        onSubmit={handleReset}
        style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
      >
        <input
          type="email"
          required
          placeholder="Enter your registered email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            padding: "0.75rem",
            borderRadius: "4px",
            border: "1px solid #ccc",
            fontSize: "1rem"
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            backgroundColor: "#007bff",
            color: "#fff",
            padding: "0.75rem",
            borderRadius: "4px",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "1rem"
          }}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>
      <ToastContainer position="top-center" autoClose={3000} />
      <p
  onClick={() => navigate("/signin")}
  style={{
    marginTop: "1rem",
    textAlign: "center",
    color: "#007bff",
    cursor: "pointer",
    textDecoration: "underline"
  }}
>
  Back to Sign In
</p>

    </div>

  );
};

export default ForgotPassword;
