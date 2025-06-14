import React from "react";
import { useNavigate } from "react-router-dom";

export default function OrganizationCard({ org }) {
  const navigate = useNavigate();
  if (!org.id) return null;

  return (
    <div
      className="organization-card"
      onClick={() => navigate(`/profile/${org.id}`)}
    >
      <img
        src={org.avatar_path}  // уже абсолютный URL
        alt={org.nickname}
        className="organization-avatar"
      />
      <div className="organization-info">
        <h4 className="organization-fullname">{org.full_name}</h4>
        <p className="organization-nickname">@{org.nickname}</p>
      </div>
    </div>
  );
}
