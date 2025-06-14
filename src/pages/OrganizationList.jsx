// src/pages/OrganizationList.jsx

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loadOrganizations } from "../store/organizationSlice";
import apiClient from "../utils/apiClient";

/* базовый адрес бэка = axios.baseURL без /api/ */
const BACKEND_URL = apiClient.defaults.baseURL.replace(/\/api\/?$/, "");

/** собирает абсолютный URL для медиа (аватарки) */
const buildUrl = (path) => {
  if (!path) return "/avatar.jpg";
  if (/^https?:\/\//.test(path)) return path;
  const clean = path.startsWith("/") ? path.slice(1) : path;
  return `${BACKEND_URL}${clean}`;
};

export default function OrganizationList() {
  const dispatch = useDispatch();
  const { list, loading, error } = useSelector((state) => state.organizations);

  useEffect(() => {
    dispatch(loadOrganizations());
  }, [dispatch]);

  if (loading) return <p>Загрузка...</p>;
  if (error)   return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Организации</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {list.map((org) => (
          <li
            key={org.id}
            style={{
              marginBottom: "10px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <img
              src={buildUrl(org.avatar_path || org.avatar_url)}
              alt={org.nickname}
              style={{
                width: 50,
                height: 50,
                borderRadius: "50%",
                marginRight: 10,
                objectFit: "cover",
              }}
            />
            <div>
              <strong>{org.full_name}</strong>
              <div style={{ fontSize: 14, color: "#555" }}>
                @{org.nickname}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
