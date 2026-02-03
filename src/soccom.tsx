import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import "./Choir.css";
import "./soccom.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Link, useNavigate } from "react-router-dom";

type LineupRow = {
  id: number;
  name?: string | null;
  position?: string | null;
  email?: string | null;
  profile?: string | null;
  scheduled_at?: string | null;
  status?: string | null;
  date?: string | null;
  time?: string | null;
  // Some DBs return uppercase column names depending on how the table was created.
  NAME?: string | null;
  POSITION?: string | null;
  EMAIL?: string | null;
  PROFILE?: string | null;
  DATE?: string | null;
  TIME?: string | null;
  SCHEDULED_AT?: string | null;
  // support uppercase status if returned that way
  STATUS?: string | null;
};

const Soccom: React.FC = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<LineupRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [userName, setUserName] = useState<string | null>(null);
  const [profileUrl, setProfileUrl] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [nowString, setNowString] = useState<string>(
    new Date().toISOString().split("T")[1].split(".")[0],
  );
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [_searchQuery, _setSearchQuery] = useState<string>("");

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    try {
      localStorage.removeItem("soccom-user-name");
      localStorage.removeItem("soccom-choir-group");
      localStorage.removeItem("soccom-profile-url");
      localStorage.removeItem("soccom-user-role");
      localStorage.removeItem("soccom-saved-email");
      localStorage.removeItem("soccom-saved-password");
    } catch {
      // ignore
    }
    navigate("/");
  };

  // Announcements
  interface Announcement {
    id: number;
    title: string;
    content: string;
    created_by: string;
    created_at: string;
    media_urls?: string | null;
  }
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  const fetchUpcoming = async () => {
    try {
      // Get lineups from 30 days ago to future (not just future)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // prefer lineups that have either scheduled_at or date within the range
      const dateStr = thirtyDaysAgo.toISOString().split("T")[0]; // YYYY-MM-DD
      const orFilter = `scheduled_at.gte.${thirtyDaysAgo.toISOString()},date.gte.${dateStr}`;
      const res = await supabase
        .from("LINEUP")
        .select("id,NAME,POSITION,EMAIL,PROFILE,date,time,scheduled_at,status")
        .or(orFilter)
        .order("scheduled_at", { ascending: true })
        .limit(200);

      if (res.error) {
        // eslint-disable-next-line no-console
        console.warn("fetchUpcoming error", res.error);
        setRows([]);
        return;
      }

      setRows((res as any).data || []);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(e);
      setRows([]);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const res = await supabase
        .from("lineupinfo")
        // include serve date/time when available so cards can show serve info
        // NOTE: `lineupinfo` does not have `scheduled_at` in this schema
        .select("id,name,position,created_at,date,time")
        .order("created_at", { ascending: false })
        .limit(50);
      if (res.error) {
        // eslint-disable-next-line no-console
        console.warn("fetchSubmissions error", res.error);
        setSubmissions([]);
        return;
      }

      // Enrich submissions with profile data from LINEUP table
      const submissionsData = (res as any).data || [];
      const enrichedSubmissions = await Promise.all(
        submissionsData.map(async (submission: any) => {
          try {
            // Try to find matching user in LINEUP table by name
            const lineupRes = await supabase
              .from("LINEUP")
              .select("PROFILE")
              .eq("NAME", submission.name)
              .maybeSingle();

            if (lineupRes.data) {
              return {
                ...submission,
                profile: lineupRes.data.PROFILE,
              };
            }
          } catch (e) {
            // ignore errors and return submission as-is
          }
          return submission;
        }),
      );

      setSubmissions(enrichedSubmissions);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(e);
      setSubmissions([]);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      setAnnouncementsLoading(true);
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) {
        console.warn("Error fetching announcements:", error);
      } else {
        setAnnouncements(data || []);
      }
    } catch (e) {
      console.error("Error loading announcements:", e);
    } finally {
      setAnnouncementsLoading(false);
    }
  };

  const approveNext = async () => {
    try {
      const now = new Date().toISOString();
      const res = await supabase
        .from("LINEUP")
        .select("id,status,scheduled_at")
        .gte("scheduled_at", now)
        .order("scheduled_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (res.error) {
        // eslint-disable-next-line no-console
        console.warn("approveNext fetch error", res.error);
        return;
      }

      const next = (res as any).data;
      if (!next) {
        // eslint-disable-next-line no-console
        console.log("No upcoming lineups found");
        return;
      }

      const status = next.status
        ? String(next.status).toLowerCase().trim()
        : "";
      if (status === "pending") {
        const upd = await supabase
          .from("LINEUP")
          .update({ status: "Approved", approved_at: new Date().toISOString() })
          .eq("id", next.id);
        if (upd.error) {
          // eslint-disable-next-line no-console
          console.warn("Failed to approve next lineup", upd.error);
        } else {
          // eslint-disable-next-line no-console
          console.log(`Approved upcoming lineup id=${next.id}`);
        }
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("approveNext error", e);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      await fetchUpcoming();
      await approveNext();
      await fetchSubmissions();
      await fetchAnnouncements();
      if (mounted) {
        await fetchUpcoming();
        await fetchSubmissions();
        setLoading(false);
      }
    })();

    // Load simple user info from localStorage for header avatar/name
    try {
      const name = localStorage.getItem("soccom-user-name");
      const p = localStorage.getItem("soccom-profile-url");
      if (name) setUserName(name);
      if (p) setProfileUrl(p);
    } catch (e) {
      // ignore
    }

    return () => {
      mounted = false;
    };
  }, []);

  // (uploaded files feature removed)

  // live clock
  useEffect(() => {
    const t = setInterval(
      () => setNowString(new Date().toISOString().split("T")[1].split(".")[0]),
      1000,
    );
    return () => clearInterval(t);
  }, []);

  // Filter rows by selected date
  const filteredRows = selectedDate
    ? rows.filter((r) => {
        // prefer explicit `date` column if present, otherwise use scheduled_at
        const raw = (r as any).date ?? (r as any).scheduled_at ?? null;
        if (!raw) return false;

        const d = new Date(raw);
        if (isNaN(d.getTime())) return false;
        const scheduledDateStr = `${d.getFullYear()}-${String(
          d.getMonth() + 1,
        ).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

        // Debug logging for first item
        if (rows.indexOf(r) === 0) {
          console.log("Filter Debug:", {
            selectedDate,
            scheduledDateStr,
            originalDate: raw,
            matches: scheduledDateStr === selectedDate,
          });
        }

        return scheduledDateStr === selectedDate;
      })
    : rows;

  // Sort by date (earliest first)
  const sortedRows = [...filteredRows].sort((a, b) => {
    const rawA = (a as any).date ?? (a as any).scheduled_at ?? null;
    const rawB = (b as any).date ?? (b as any).scheduled_at ?? null;
    const dateA = rawA ? new Date(rawA).getTime() : 0;
    const dateB = rawB ? new Date(rawB).getTime() : 0;
    return dateA - dateB;
  });

  const getServeDateForRow = (r: any) => {
    if (!r) return null;
    // prefer explicit `date` column if present, otherwise scheduled_at
    const raw = r.date ?? r.DATE ?? r.scheduled_at ?? r.SCHEDULED_AT ?? null;
    if (!raw) return null;
    try {
      // parse YYYY-MM-DD or YYYY-MM-DD HH:MM:SS or ISO without forcing UTC
      if (typeof raw === "string") {
        const m = String(raw).match(
          /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/,
        );
        if (m) {
          const y = Number(m[1]);
          const mo = String(Number(m[2])).padStart(2, "0");
          const day = String(Number(m[3])).padStart(2, "0");
          return `${y}-${mo}-${day}`;
        }
      }
      const d = new Date(raw);
      if (!isNaN(d.getTime())) {
        const y = d.getFullYear();
        const mo = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${mo}-${day}`;
      }
      return String(raw);
    } catch (e) {
      return String(raw);
    }
  };

  const getMassTimeForRow = (r: any) => {
    if (!r) return null;
    const t = r.time ?? r.TIME ?? null;
    if (t) {
      // format time strings like HH:MM:SS to ISO format
      if (typeof t === "string") {
        const m = t.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
        if (m) {
          const hh = String(Number(m[1])).padStart(2, "0");
          const mm = String(Number(m[2])).padStart(2, "0");
          const ss = m[3] ? String(Number(m[3])).padStart(2, "0") : "00";
          return `${hh}:${mm}:${ss}`;
        }
      }
      return String(t);
    }
    // fallback: if scheduled_at exists, derive time portion
    const raw = r.scheduled_at ?? r.SCHEDULED_AT ?? null;
    if (!raw) return null;
    try {
      // try parsing scheduled_at with local constructor when it's YYYY-MM-DD...
      if (typeof raw === "string") {
        const m = String(raw).match(
          /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/,
        );
        if (m && m[4]) {
          const hh = String(Number(m[4])).padStart(2, "0");
          const mm = String(Number(m[5] || 0)).padStart(2, "0");
          const ss = m[6] ? String(Number(m[6])).padStart(2, "0") : "00";
          return `${hh}:${mm}:${ss}`;
        }
      }
      const d = new Date(raw);
      if (!isNaN(d.getTime())) {
        const hh = String(d.getHours()).padStart(2, "0");
        const mm = String(d.getMinutes()).padStart(2, "0");
        const ss = String(d.getSeconds()).padStart(2, "0");
        return `${hh}:${mm}:${ss}`;
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  // Filter submissions by selected date as well
  const filteredSubmissions = selectedDate
    ? submissions.filter((s) => {
        // prefer explicit `date` column if present, otherwise try scheduled_at
        const raw = (s as any).date ?? (s as any).scheduled_at ?? null;
        if (!raw) return false;

        // If raw is in YYYY-MM-DD form, use that directly
        const m = String(raw).match(/^(\d{4}-\d{2}-\d{2})/);
        if (m) return m[1] === selectedDate;

        const d = new Date(raw);
        if (isNaN(d.getTime())) return false;
        const scheduledDateStr = `${d.getFullYear()}-${String(
          d.getMonth() + 1,
        ).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

        return scheduledDateStr === selectedDate;
      })
    : submissions;

  return (
    <div className="soccom-page container-fluid py-4">
      <div className="soccom-header d-flex align-items-center mb-4 px-3">
        <div className="d-flex align-items-center header-left">
          <div className="avatar me-2">
            {profileUrl ? (
              // profileUrl may be a data URL or storage public URL
              // eslint-disable-next-line jsx-a11y/img-redundant-alt
              <img src={profileUrl} alt="avatar" />
            ) : (
              <div className="avatar-fallback">
                <i className="bi bi-person-circle" />
              </div>
            )}
          </div>
          <div className="user-meta">
            <div className="user-name">{userName || "Presenter"}</div>
            <div className="small text-muted">Presenter</div>
          </div>
        </div>

        <div className="mx-auto text-center header-center">
          <div className="h5 mb-0">
            {new Date().toISOString().split("T")[0]}
          </div>
          <div className="small text-muted">{nowString}</div>
        </div>

        <div className="ms-auto header-right">
          <nav className="nav">
            <Link className="nav-link active" to="/soccom">
              Dashboard
            </Link>
            <Link className="nav-link" to="/files">
              Files
            </Link>
            <Link className="nav-link" to="/admin">
              Admin
            </Link>
            <button className="nav-link btn btn-link" onClick={handleLogout}>
              Logout
            </button>
          </nav>
        </div>
      </div>

      {/* Layout with Announcements Sidebar */}
      <div className="container px-3">
        <div className="row g-4">
          {/* Announcements Panel Aside - First on mobile, right on desktop */}
          <div className="col-12 col-lg-3 announcements-col">
            <div className="card announcements-panel">
              <div className="card-header bg-primary text-white">
                <i className="bi bi-megaphone-fill me-2"></i>
                <span>Announcements</span>
              </div>
              <div className="card-body p-0">
                {announcementsLoading ? (
                  <div className="text-center p-3">
                    <div
                      className="spinner-border spinner-border-sm text-primary"
                      role="status"
                    >
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : announcements.length === 0 ? (
                  <div className="p-3 text-center text-muted small">
                    <i className="bi bi-inbox fs-4 d-block mb-2"></i>
                    <p className="mb-0">No announcements at this time</p>
                  </div>
                ) : (
                  <div
                    className="announcement-list"
                    style={{ maxHeight: "500px", overflowY: "auto" }}
                  >
                    {announcements.map((announcement) => {
                      let mediaUrls: string[] = [];
                      if (announcement.media_urls) {
                        try {
                          mediaUrls = JSON.parse(announcement.media_urls);
                        } catch (e) {
                          // ignore
                        }
                      }
                      return (
                        <div
                          key={announcement.id}
                          className="announcement-item border-bottom p-3"
                        >
                          <h6 className="mb-2 text-primary">
                            <i className="bi bi-pin-fill me-2"></i>
                            {announcement.title}
                          </h6>
                          <p className="mb-2 small">{announcement.content}</p>
                          {mediaUrls.length > 0 && (
                            <div className="mt-2 mb-2">
                              {mediaUrls.map((url, idx) => {
                                const isImage =
                                  /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                                return isImage ? (
                                  <div
                                    key={`${announcement.id}-img-${idx}`}
                                    style={{
                                      cursor: "pointer",
                                      display: "inline-block",
                                    }}
                                    onClick={() => setExpandedImage(url)}
                                  >
                                    <img
                                      src={url}
                                      alt="Announcement"
                                      className="img-fluid rounded mb-2"
                                      style={{
                                        maxWidth: "100%",
                                        maxHeight: "200px",
                                        border: "2px solid #dee2e6",
                                        cursor: "pointer",
                                      }}
                                    />
                                  </div>
                                ) : (
                                  <a
                                    key={`${announcement.id}-file-${idx}`}
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn btn-sm btn-outline-primary me-2 mb-2"
                                  >
                                    <i className="bi bi-file-download me-1"></i>
                                    Download
                                  </a>
                                );
                              })}
                            </div>
                          )}
                          <small className="text-muted">
                            By {announcement.created_by} •{" "}
                            {new Date(
                              announcement.created_at,
                            ).toLocaleDateString()}
                          </small>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Lineups Column */}
          <div className="col-12 col-lg-9">
            {/* Date Picker Filter */}
            <div className="mb-4">
              <label htmlFor="datePicker" className="form-label fw-bold">
                <i className="bi bi-calendar3 me-2"></i>
                Filter by Date
              </label>
              <div className="input-group">
                <input
                  id="datePicker"
                  type="date"
                  className="form-control"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
                {selectedDate && (
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => setSelectedDate("")}
                    title="Clear date filter"
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                )}
              </div>
              {selectedDate && (
                <small className="text-muted">
                  Showing lineups for {selectedDate} (
                  {filteredRows.length + filteredSubmissions.length} found)
                </small>
              )}
            </div>

            {/* Lineups Grid */}
            <div className="row g-4 dashboard-grid">
              {loading && <div className="col-12">Loading…</div>}
              {!loading &&
                sortedRows.length === 0 &&
                filteredSubmissions.length === 0 &&
                selectedDate && (
                  <div className="col-12">
                    <div className="alert alert-warning">
                      <i className="bi bi-calendar-x me-2"></i>
                      No lineups found for the selected date
                    </div>
                  </div>
                )}
              {!loading &&
                sortedRows.length === 0 &&
                filteredSubmissions.length === 0 &&
                !selectedDate && (
                  <div className="col-12">No upcoming lineups</div>
                )}

              {sortedRows.map((r) => {
                const statusRaw = (r.status || r.STATUS || "").toString();
                const status = statusRaw.trim();
                const statusLower = status.toLowerCase();
                const badgeClass =
                  statusLower === "approved"
                    ? "bg-success"
                    : statusLower === "completed"
                      ? "bg-primary text-white"
                      : "bg-warning text-dark";
                const title = r.NAME || r.name || "(No name)";
                const pos = r.POSITION || r.position || "";
                const profileImg = r.PROFILE || r.profile || null;
                return (
                  <div key={r.id} className="col-12 col-sm-6 col-md-4 col-lg-3">
                    <div className="card card-dashboard h-100 shadow-sm">
                      {profileImg ? (
                        <img
                          src={profileImg}
                          alt={title}
                          className="card-img-top"
                          style={{
                            height: "150px",
                            objectFit: "cover",
                            backgroundColor: "#f0f0f0",
                          }}
                        />
                      ) : (
                        <img
                          src="https://via.placeholder.com/300x150?text=No+Profile"
                          alt="No Profile"
                          className="card-img-top"
                          style={{
                            height: "150px",
                            objectFit: "cover",
                            backgroundColor: "#e9ecef",
                          }}
                        />
                      )}
                      <div className="card-body d-flex flex-column">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div className="d-flex align-items-center flex-grow-1">
                            <div className="icon-circle me-3">
                              <i className="bi bi-music-note-list" />
                            </div>
                            <div className="flex-grow-1">
                              <h6 className="card-title mb-1">{title}</h6>
                              <div className="small text-muted">{pos}</div>
                            </div>
                          </div>
                          <div className={`status-badge ${badgeClass}`}>
                            {status || "(No status)"}
                          </div>
                        </div>

                        <div className="mt-auto">
                          <div className="mb-3">
                            <div className="serve-date">
                              <div>
                                <strong>{getMassTimeForRow(r) ?? ""}</strong>
                              </div>
                              <div className="small text-muted">
                                {getServeDateForRow(r) ?? "-"}
                              </div>
                            </div>
                          </div>
                          <Link
                            to={`/lineup/${r.id}`}
                            className="btn btn-primary btn-sm w-100"
                          >
                            View Lineup
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredSubmissions.map((s) => {
                const profileImg = s.profile || s.PROFILE || null;
                return (
                  <div
                    key={`s-${s.id}`}
                    className="col-12 col-sm-6 col-md-4 col-lg-3"
                  >
                    <div className="card h-100 shadow-sm">
                      {profileImg ? (
                        <img
                          src={profileImg}
                          alt={s.name || "User"}
                          className="card-img-top"
                          style={{
                            height: "150px",
                            objectFit: "cover",
                            backgroundColor: "#f0f0f0",
                          }}
                        />
                      ) : (
                        <img
                          src="https://via.placeholder.com/300x150?text=No+Profile"
                          alt="No Profile"
                          className="card-img-top"
                          style={{
                            height: "150px",
                            objectFit: "cover",
                            backgroundColor: "#e9ecef",
                          }}
                        />
                      )}
                      <div className="card-body">
                        <h6 className="card-title mb-1">
                          {s.name || "(No name)"}
                        </h6>
                        <div className="small text-muted mb-2">
                          {s.position || ""}
                        </div>
                        <div className="mb-2">
                          <strong>
                            {(() => {
                              const time = getMassTimeForRow(s);
                              const date = getServeDateForRow(s);
                              if (time && date) return `${time} · ${date}`;
                              if (date) return date;
                              return "-";
                            })()}
                          </strong>
                        </div>
                      </div>
                      <div className="card-footer bg-transparent border-0">
                        <Link
                          to={`/lineup/${s.id}`}
                          className="btn btn-outline-primary btn-sm w-100"
                        >
                          Open
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Image Modal */}
      {expandedImage && (
        <div
          className="modal-overlay"
          onClick={() => setExpandedImage(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <img
            src={expandedImage}
            alt="Expanded"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "90%",
              maxHeight: "90%",
              objectFit: "contain",
              borderRadius: "8px",
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Soccom;
