import React, { useState, useEffect } from "react";
import { useSessionStatus } from "../hooks/usePrices";

export default function TopBar({ title }) {
  const [time, setTime] = useState(new Date());
  const session = useSessionStatus();

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const istTime = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: true
  }).format(time);

  const gmtTime = new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    hour: "2-digit", minute: "2-digit",
    hour12: false
  }).format(time);

  return (
    <div className="topbar">
      <div className="topbar-left">
        <span className="topbar-title">{title}</span>
      </div>
      <div className="topbar-right">
        {/* Kill Zone Status */}
        <div className={`session-badge ${session.ist_active ? "active" : "inactive"}`}>
          <div className={`session-dot ${session.ist_active ? "active" : "inactive"}`} />
          {session.ist_active
            ? (session.ist_london_kz ? "LONDON KZ" : "NY KZ")
            : "NO KILL ZONE"}
        </div>

        {/* London Session */}
        <div className={`session-badge ${session.london_full?.active ? "active" : "inactive"}`}>
          <div className={`session-dot ${session.london_full?.active ? "active" : "inactive"}`} />
          LONDON
        </div>

        {/* NY Session */}
        <div className={`session-badge ${session.ny_full?.active ? "active" : "inactive"}`}>
          <div className={`session-dot ${session.ny_full?.active ? "active" : "inactive"}`} />
          NY
        </div>

        {/* Time display */}
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)", textAlign: "right" }}>
          <div style={{ color: "var(--text-primary)", fontWeight: 700 }}>{istTime} IST</div>
          <div>{gmtTime} GMT</div>
        </div>
      </div>
    </div>
  );
}
