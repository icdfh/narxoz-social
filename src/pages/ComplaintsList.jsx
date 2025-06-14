// src/pages/ComplaintsList.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../utils/apiClient";

export default function ComplaintsList() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  useEffect(() => {
    apiClient
      .get("/complaints/all/")
      .then((res) => setComplaints(res.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading complaints…</p>;
  if (error)   return <p style={{color:"red"}}>Error: {error}</p>;

  return (
    <div>
      <h2>All Complaints</h2>
      <table className="complaints-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Type</th>
            <th>Object ID</th>
            <th>Author</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {complaints.map((c) => (
            <tr key={c.id}>
              <td>{c.id}</td>
              <td>{c.content_type}</td>
              <td>{c.object_id}</td>
              <td>{c.author}</td>
              <td>{c.status}</td>
              <td>{new Date(c.created_at).toLocaleString()}</td>
              <td>
                <Link to={`${c.id}`}>View</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
