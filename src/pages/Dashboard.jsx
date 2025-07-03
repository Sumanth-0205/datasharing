import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/config";

import { signOut, onAuthStateChanged, sendEmailVerification } from "firebase/auth";
import {
    collection,
    addDoc,
    onSnapshot,
    query,
    deleteDoc,
    doc,
    getDocs,
    setDoc,
    serverTimestamp,
    orderBy,
    updateDoc
} from "firebase/firestore";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Dashboard.css";
// ... [imports remain unchanged]

const Dashboard = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ text: "", name: "", email: "", age: "" });
    const [editData, setEditData] = useState({ text: "", name: "", email: "", age: "" });
    const [items, setItems] = useState([]);
    const [darkMode, setDarkMode] = useState(false);
    const [user, setUser] = useState(null);
    const [search, setSearch] = useState("");
    const [showPreview, setShowPreview] = useState(false);
    const [editId, setEditId] = useState(null);


    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
            if (!u) return navigate("/signin");
            setUser(u);

            const q = query(collection(db, "users", u.uid, "items"), orderBy("createdAt", "asc"));
            const unsubscribeFirestore = onSnapshot(q, (snapshot) => {
                const data = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setItems(data);
            });

             return () => unsubscribeItems();
    });

    return () => unsubscribeAuth();
  }, [navigate]);

            // const requestRef = collection(db, "users", u.uid, "friendRequests");
            // const unsubscribeRequests = onSnapshot(requestRef, (snapshot) => {
            //     const reqs = snapshot.docs.map((doc) => ({
            //         id: doc.id,
            //         ...doc.data()
            //     }));
            //     setFriendRequests(reqs);
            // });

            // const friendsRef = collection(db, "users", u.uid, "friends");
            // const unsubscribeFriends = onSnapshot(friendsRef, (snapshot) => {
            //     const data = snapshot.docs.map(doc => ({
            //         id: doc.id,
            //         ...doc.data()
            //     }));
            //     setFriends(data);
            // });


        //     return () => {
        //         unsubscribeFirestore();
        //         unsubscribeRequests();
        //         unsubscribeFriends();
        //     };
        // });




    //     return () => unsubscribeAuth();
    // }, [navigate]);


    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) return;
        const { text, name, email, age } = formData;
        if (!name.trim() || !email.trim() || !age.trim()) {
            toast.error("Please fill in all required fields.");
            return;
        }




        try {
            await addDoc(collection(db, "users", user.uid, "items"), {
                text,
                name,
                email,
                age,
                createdAt: new Date()
            });
            toast.success("Item added!");
            setFormData({ text: "", name: "", email: "", age: "" });
        } catch {
            toast.error("Failed to add item.");
        }
    };

    // const handleSendRequest = async (e) => {
    //     e.preventDefault();
    //     setSending(true);
    //     try {
    //         const targetSnapshot = await getDocs(collection(db, "users"));
    //         const match = targetSnapshot.docs.find(
    //             (d) => d.data().email?.toLowerCase() === friendEmail.trim().toLowerCase()
    //         );
    //         if (!match) {
    //             toast.error("User not found.");
    //             setSending(false);
    //             return;
    //         }

            // const targetUID = match.id;

            // if (targetUID === user.uid) {
            //     toast.info("You cannot add yourself.");
            //     setSending(false);
            //     return;
            // }

            // const requestRef = doc(db, "users", targetUID, "friendRequests", user.uid);
            // await setDoc(requestRef, {
            //     from: user.uid,
            //     email: user.email,
            //     status: "pending",
            //     timestamp: serverTimestamp()
            // });

    //         toast.success("Friend request sent!");
    //         setFriendEmail("");
    //     } catch (err) {
    //         toast.error("Error sending request.");
    //     } finally {
    //         setSending(false);
    //     }
    // };

    // const acceptRequest = async (req) => {
    //     try {
    //         const myRef = doc(db, "users", user.uid, "friends", req.from);
    //         const theirRef = doc(db, "users", req.from, "friends", user.uid);

    //         await setDoc(myRef, {
    //             email: req.email,
    //             addedAt: serverTimestamp()
    //         });

    //         await setDoc(theirRef, {
    //             email: user.email,
    //             addedAt: serverTimestamp()
    //         });

    //         await deleteDoc(doc(db, "users", user.uid, "friendRequests", req.id));
    //         toast.success("Friend added!");
    //     } catch (err) {
    //         toast.error("Failed to accept.");
    //     }
    // };

    // const rejectRequest = async (req) => {
    //     try {
    //         await deleteDoc(doc(db, "users", user.uid, "friendRequests", req.id));
    //         toast.info("Request rejected.");
    //     } catch {
    //         toast.error("Failed to reject.");
    //     }
    // };

    // const fetchFriendData = async (friendUID) => {
    //     const q = query(collection(db, "users", friendUID, "items"), orderBy("createdAt", "asc"));
    //     const snapshot = await getDocs(q);
    //     const data = snapshot.docs.map(doc => ({
    //         id: doc.id,
    //         ...doc.data()
    //     }));
    //     setFriendItems(data);
    //     toast.success("Fetched friend’s data");
    // };



    const handleDelete = async (id) => {
        await deleteDoc(doc(db, "users", user.uid, "items", id));
        toast.info("Item deleted");
    };

    const handleLogout = async () => {
        await signOut(auth);
        toast("Signed out");
        navigate("/signin");
    };

    const startEdit = (item) => {
        setEditId(item.id);
        setEditData({
            text: item.text || "",
            name: item.name || "",
            email: item.email || "",
            age: item.age || ""
        });
    };

    const cancelEdit = () => {
        setEditId(null);
        setEditData({ text: "", name: "", email: "", age: "" });
    };

    const saveEdit = async (id) => {
        const ref = doc(db, "users", user.uid, "items", id);
        await updateDoc(ref, { ...editData });
        setEditId(null);
        setEditData({ text: "", name: "", email: "", age: "" });
        toast.success("Item updated");
    };

    const clearAll = async () => {
        if (!window.confirm("Delete ALL items?")) return;
        const promises = items.map((i) =>
            deleteDoc(doc(db, "users", user.uid, "items", i.id))
        );
        await Promise.all(promises);
        toast("All cleared");
    };

    const exportToCSV = () => {
        const headers = ["Description", "Name", "Email", "Age", "Created At"];
        const rows = items.map((i) => [
            i.text || "",
            i.name || "",
            i.email || "",
            i.age || "",
            new Date(i.createdAt?.seconds * 1000).toLocaleString()
        ]);

        // CSV
        const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "dashboard-data.csv";
        link.click();

        // HTML table for preview in new tab
        const tableHTML = `
      <html>
        <head><title>Exported Dashboard Data</title>
        <style>
          body { font-family: sans-serif; padding: 2rem; }
          table { border-collapse: collapse; width: 100%; }
          th, td { padding: 8px 12px; border: 1px solid #ccc; text-align: left; }
          thead { background-color: #f2f2f2; }
        </style>
        </head>
        <body>
          <h2>Exported Dashboard Data</h2>
          <table>
            <thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead>
            <tbody>
              ${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>`).join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;
        const newTab = window.open();
        if (newTab) {
            newTab.document.write(tableHTML);
            newTab.document.close();
        }
    };

    const filteredItems = items.filter((i) =>
        i.text?.toLowerCase().includes(search.toLowerCase())
    );


    const tdStyle = {
        padding: "8px",
        border: "1px solid #ccc",
        textAlign: "left",
        fontSize: "0.9rem"
    };

    const exportFriendCSV = (items) => {
        const headers = ["Desc", "Name", "Email", "Age", "Created"];
        const rows = items.map((i) => [
            i.text || "",
            i.name || "",
            i.email || "",
            i.age || "",
            new Date(i.createdAt?.seconds * 1000).toLocaleString()
        ]);
        const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "friend-data.csv";
        link.click();
    };

    return (
        <div className={`dashboard ${darkMode ? "dark" : ""}`}>
              <button onClick={() => navigate("/friends")}>👥 Friends</button>

            <button onClick={() => setDarkMode(!darkMode)} className="theme-toggle">
                {darkMode ? "🌞 Light Mode" : "🌙 Dark Mode"}
            </button>
            <h2>Welcome to your Dashboard</h2>
          



           
 {/* ⚠️ Email Verification */}
            {user && !user.emailVerified && (
                <div style={{
                    background: "#fff3cd",
                    color: "#856404",
                    padding: "1rem",
                    borderRadius: "6px",
                    marginBottom: "1rem",
                    border: "1px solid #ffeeba"
                }}>
                    <strong>⚠️ Please verify your email address.</strong> A link was sent to <em>{user.email}</em>.
                    <button
                        onClick={async () => {
                            await sendEmailVerification(user);
                            toast.success("Verification email sent again!");
                        }}
                        style={{
                            marginLeft: "1rem",
                            background: "none",
                            border: "none",
                            color: "#007bff",
                            textDecoration: "underline",
                            cursor: "pointer"
                        }}
                    >
                        Resend link
                    </button>
                </div>
            )}




            {user && (
                <div style={{ fontSize: "0.9rem", marginBottom: "1rem" }}>
                    <div><strong>Email:</strong> {user.email}</div>
                    <div><strong>Signed in at:</strong> {new Date(user.metadata.lastSignInTime).toLocaleString()}</div>
                    <div><strong>Total items:</strong> {items.length}</div>
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", justifyContent: "center" }}>
                <input name="text" value={formData.text} onChange={handleChange} placeholder="Description (optional)" />
                <input name="name" value={formData.name} onChange={handleChange} placeholder="Name" required />
                <input name="email" value={formData.email} onChange={handleChange} placeholder="Email" required type="email" />
                <input name="age" value={formData.age} onChange={handleChange} placeholder="Age" required type="number" />
                <button type="submit">Add</button>
            </form>

            <input
                type="text"
                placeholder="Search items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ marginTop: "1rem", padding: "0.5rem", width: "100%", borderRadius: "6px", border: "1px solid #ccc" }}
            />

            <ul className="item-list">
                {filteredItems.map((item) => (
                    <li key={item.id} style={{
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        padding: "1rem",
                        marginBottom: "1rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.75rem"
                    }}>
                        {editId === item.id ? (
                            <>
                                <input name="text" value={editData.text} onChange={(e) => setEditData(prev => ({ ...prev, text: e.target.value }))} />
                                <input name="name" value={editData.name} onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))} />
                                <input name="email" value={editData.email} onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))} />
                                <input name="age" value={editData.age} onChange={(e) => setEditData(prev => ({ ...prev, age: e.target.value }))} />
                                <button onClick={() => saveEdit(item.id)}>Save</button>
                                <button onClick={cancelEdit}>Cancel</button>
                            </>
                        ) : (
                            <>
                                <div>
                                    <span>
                                        {item.text?.trim() ? item.text : <em style={{ color: "#888" }}>No description</em>}
                                        <br />




                                        <small style={{ fontSize: "0.75rem", color: "#aaa" }}>
                                            added {item.createdAt?.seconds ? timeAgo(item.createdAt.seconds * 1000) : ""}
                                        </small>
                                    </span>
                                </div>

                                <div style={{
                                    display: "grid",
                                    gridTemplateColumns: "100px 1fr",
                                    gap: "6px 12px",
                                    lineHeight: "1.6",
                                    padding: "0.75rem 1rem",
                                    borderRadius: "6px"
                                }}>
                                    <div><strong>Name:</strong></div>
                                    <div>{item.name || "—"}</div>
                                    <div><strong>Email:</strong></div>
                                    <div>{item.email || "—"}</div>
                                    <div><strong>Age:</strong></div>
                                    <div>{item.age || "—"}</div>
                                </div>

                                <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
                                    <button className="delete-btn" onClick={() => handleDelete(item.id)}>DELETE</button>
                                    <button onClick={() => startEdit(item)}>EDIT</button>
                                </div>
                            </>
                        )}
                    </li>
                ))}
            </ul>

            {/* 📋 Preview Table */}
            {showPreview && filteredItems.length > 0 && (
                <div style={{ marginTop: "2rem" }}>
                    <h3 style={{ textAlign: "center" }}>📋 Preview Table</h3>
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr>
                                    <th style={tdStyle}>Description</th>
                                    <th style={tdStyle}>Name</th>
                                    <th style={tdStyle}>Email</th>
                                    <th style={tdStyle}>Age</th>
                                    <th style={tdStyle}>Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.map((item) => (
                                    <tr key={item.id}>
                                        <td style={tdStyle}>{item.text || "—"}</td>
                                        <td style={tdStyle}>{item.name || "—"}</td>
                                        <td style={tdStyle}>{item.email || "—"}</td>
                                        <td style={tdStyle}>{item.age || "—"}</td>
                                        <td style={tdStyle}>
                                            {item.createdAt?.seconds
                                                ? new Date(item.createdAt.seconds * 1000).toLocaleString()
                                                : ""}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}



            <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
                    <button onClick={clearAll}>🧹 Clear All</button>
                    <button onClick={exportToCSV}>📤 Export CSV</button>
                    <button onClick={() => setShowPreview(prev => !prev)}>
                        {showPreview ? "Hide Preview" : "📋 Preview Table"}
                    </button>
                </div>
                <button className="logout-btn" onClick={handleLogout}>Sign Out</button>
            </div>


            <ToastContainer position="top-center" autoClose={2000} />
        </div>
    );
};

// 🕓 Relative time formatter
function timeAgo(timestamp) {
    const now = Date.now();
    const diff = Math.floor((now - timestamp) / 1000);
    if (diff < 60) return `${diff} sec ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hrs ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} day(s) ago`;
    return new Date(timestamp).toLocaleDateString();
}

export default Dashboard;
