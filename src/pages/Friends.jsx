
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/config";
import {
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import {
  collection,
  query,
  onSnapshot,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  orderBy,
  serverTimestamp
} from "firebase/firestore";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Friends = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [friendEmail, setFriendEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friendItems, setFriendItems] = useState([]);
const [incomingShares, setIncomingShares] = useState([]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      if (!u) return navigate("/signin");
      setUser(u);
      const incomingRef = collection(db, "users", u.uid, "friends");

onSnapshot(incomingRef, (snap) => {
  const shares = snap.docs
    .filter(doc => doc.data().shared && !friends.find(f => f.id === doc.id))
    .map(doc => ({ id: doc.id, ...doc.data() }));
  setIncomingShares(shares);
});


      const friendsRef = collection(db, "users", u.uid, "friends");
      const unsubscribeFriends = onSnapshot(friendsRef, (snap) => {
        setFriends(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      const requestsRef = collection(db, "users", u.uid, "friendRequests");
      const unsubscribeRequests = onSnapshot(requestsRef, (snap) => {
        setFriendRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      return () => {
        unsubscribeFriends();
        unsubscribeRequests();
      };
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  const handleSendRequest = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const snapshot = await getDocs(collection(db, "users"));
      const match = snapshot.docs.find(
        (d) => d.data().email?.toLowerCase() === friendEmail.trim().toLowerCase()
      );

      if (!match) {
        toast.error("User not found.");
        return;
      }

      const targetUID = match.id;
      if (targetUID === user.uid) {
        toast.info("You cannot add yourself.");
        return;
      }

      const ref = doc(db, "users", targetUID, "friendRequests", user.uid);
      await setDoc(ref, {
        from: user.uid,
        email: user.email,
        timestamp: serverTimestamp()
      });

      toast.success("Friend request sent.");
      setFriendEmail("");
    } catch {
      toast.error("Error sending request.");
    } finally {
      setSending(false);
    }
  };

  const acceptRequest = async (req) => {
    try {
      const myRef = doc(db, "users", user.uid, "friends", req.from);
      const theirRef = doc(db, "users", req.from, "friends", user.uid);

      await setDoc(myRef, {
        email: req.email,
        addedAt: serverTimestamp(),
        shared: false
      });

      await setDoc(theirRef, {
        email: user.email,
        addedAt: serverTimestamp(),
        shared: false
      });

      await deleteDoc(doc(db, "users", user.uid, "friendRequests", req.id));
      toast.success("Friend added!");
    } catch {
      toast.error("Failed to accept.");
    }
  };

  const rejectRequest = async (req) => {
    try {
      await deleteDoc(doc(db, "users", user.uid, "friendRequests", req.id));
      toast.info("Request rejected.");
    } catch {
      toast.error("Failed to reject.");
    }
  };

 const fetchFriendData = async (friendUID) => {
  try {
    const theySharedRef = doc(db, "users", friendUID, "friends", user.uid);
    const theySnap = await getDoc(theySharedRef);

    if (!theySnap.exists() || !theySnap.data().shared) {
      toast.error("This friend hasn’t shared their data with you.");
      return;
    }

    const q = query(collection(db, "users", friendUID, "items"), orderBy("createdAt", "asc"));
    const snap = await getDocs(q);
    const items = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setFriendItems(items);
    toast.success("Friend data loaded");
  } catch {
    toast.error("Failed to load data");
  }
};


  const toggleSharing = async (friendUID, newStatus) => {
    try {
      const yourRef = doc(db, "users", user.uid, "friends", friendUID);
      await updateDoc(yourRef, { shared: newStatus });

    //   const theirRef = doc(db, "users", friendUID, "friends", user.uid);
    //   await setDoc(theirRef, { shared: newStatus }, { merge: true });

      toast.success(`Sharing ${newStatus ? "enabled" : "disabled"}`);
    } catch {
      toast.error("Failed to update sharing status.");
    }
  };

  const exportFriendCSV = (items) => {
    const headers = ["Description", "Name", "Email", "Age", "Created"];
    const rows = items.map(i => [
      i.text || "",
      i.name || "",
      i.email || "",
      i.age || "",
      new Date(i.createdAt?.seconds * 1000).toLocaleString()
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "friend-data.csv";
    link.click();
  };

  const tdStyle = {
    padding: "8px",
    border: "1px solid #ccc",
    textAlign: "left",
    fontSize: "0.9rem"
  };

  const handleLogout = async () => {
    await signOut(auth);
    toast("Signed out");
    navigate("/signin");
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "850px", margin: "auto" }}>
      <button onClick={() => navigate("/dashboard")}>🏠 Back to Dashboard</button>
      <h2>👥 Friends Center</h2>

      {/* ➕ Add Friend */}
      <form onSubmit={handleSendRequest} style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
        <input
          type="email"
          placeholder="Enter user's email"
          value={friendEmail}
          onChange={(e) => setFriendEmail(e.target.value)}
          required
        />
        <button type="submit" disabled={sending}>
          {sending ? "Sending..." : "Send Request"}
        </button>
      </form>

      {/* 📨 Friend Requests */}
      <div style={{ marginBottom: "2rem" }}>
        <h3>Friend Requests {friendRequests.length > 0 && `(${friendRequests.length})`}</h3>
        {friendRequests.length === 0 && <p>No pending requests.</p>}
        {friendRequests.map((req) => (
          <div key={req.id} style={{ marginBottom: "0.75rem" }}>
            <strong>{req.email}</strong> wants to connect.
            <div style={{ marginTop: "0.5rem" }}>
              <button onClick={() => acceptRequest(req)} style={{ marginRight: "0.5rem" }}>Accept</button>
              <button onClick={() => rejectRequest(req)}>Reject</button>
            </div>
          </div>
        ))}
      </div>

      {/* 👥 Friend List */}
      {incomingShares.length > 0 && (
  <div style={{ marginTop: "2rem" }}>
    <h3>📥 Incoming Shares</h3>
    <ul>
      {incomingShares.map((s) => (
        <li key={s.id} style={{ marginBottom: "0.75rem" }}>
          View <strong> {s.email}</strong> data if they shared data with you.
          <button onClick={() => fetchFriendData(s.id)} style={{ marginLeft: "1rem" }}>
            🔍 View
          </button>
        </li>
      ))}
    </ul>
  </div>
)}

      <div style={{ marginBottom: "2rem" }}>
        <h3>Friends {friends.length > 0 && `(${friends.length})`}</h3>
        {friends.length === 0 ? (
          <p>You have no friends yet.</p>
        ) : (
          <ul>
            {friends.map((f) => (
              <li key={f.id} style={{ marginBottom: "0.75rem" }}>
                <strong>{f.email}</strong>
                {f.shared ? (
                  <button onClick={() => fetchFriendData(f.id)} style={{ marginLeft: "1rem" }}>
                   
             
             
             
             
             
             
             📄 View & Export
                  </button>
                ) : (
                  <span style={{ color: "#888", marginLeft: "1rem" }}>🔒 Not Shared</span>
                )}
              <label style={{ marginLeft: "1rem", display: "inline-flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
  <input
    type="checkbox"
    checked={f.shared}
    onChange={() => toggleSharing(f.id, !f.shared)}
    style={{
      appearance: "none",
      width: "40px",
      height: "20px",
      backgroundColor: f.shared ? "#4caf50" : "#ccc",
      borderRadius: "20px",
      position: "relative",
      outline: "none",
      transition: "background-color 0.3s",
      cursor: "pointer"
    }}
  />
  <span
    style={{
      position: "absolute",
      top: "2px",
      left: f.shared ? "22px" : "2px",
      width: "16px",
      height: "16px",
      backgroundColor: "#fff",
      borderRadius: "50%",
      transition: "left 0.3s"
    }}
  />
  <span>{f.shared ? "Sharing On" : "Sharing Off"}</span>
</label>

              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 📊 Preview Friend's Shared Data */}
      {friendItems.length > 0 && (
        <div>
          <h3>Preview of Friend's Data</h3>
        <div style={{ marginBottom: "1rem" }}>
      <button onClick={() => exportFriendCSV(friendItems)}>📤 Export CSV</button>
      <button onClick={() => setFriendItems([])} style={{ marginLeft: "1rem" }}>🙈 Hide Preview</button>
    </div>
          <div style={{ overflowX: "auto", marginTop: "1rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={tdStyle}>Desc</th>
                  <th style={tdStyle}>Name</th>
                  <th style={tdStyle}>Email</th>
                  <th style={tdStyle}>Age</th>
                  <th style={tdStyle}>Created</th>
                </tr>
              </thead>
              <tbody>
                {friendItems.map((i) => (
                  <tr key={i.id}>
                    <td style={tdStyle}>{i.text || "—"}</td>
                    <td style={tdStyle}>{i.name || "—"}</td>
                    <td style={tdStyle}>{i.email || "—"}</td>
                    <td style={tdStyle}>{i.age || "—"}</td>
                    <td style={tdStyle}>
                      {i.createdAt?.seconds
                        ? new Date(i.createdAt.seconds * 1000).toLocaleString()
                        : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 🔒 Sign Out */}
      <div style={{ marginTop: "2rem", textAlign: "center" }}>
        <button className="logout-btn" onClick={handleLogout}>Sign Out</button>
      </div>

      <ToastContainer position="top-center" autoClose={2000} />
    </div>
  );
};

export default Friends;
