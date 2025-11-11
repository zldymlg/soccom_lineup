import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import "./Choir.css";
import "./soccom.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Link } from "react-router-dom";

type LineupRow = {
  id: number;
  name?: string | null;
  position?: string | null;
  email?: string | null;
  profile?: string | null;
  scheduled_at?: string | null;
  status?: string | null;
  // Some DBs return uppercase column names depending on how the table was created.
  NAME?: string | null;
  POSITION?: string | null;
  PROFILE?: string | null;
  // support uppercase status if returned that way
  STATUS?: string | null;
};

const Soccom: React.FC = () => {
  const [rows, setRows] = useState<LineupRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [profileUrl, setProfileUrl] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [nowString, setNowString] = useState<string>(
    new Date().toLocaleTimeString()
  );
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [quickFilter, setQuickFilter] = useState<
    "all" | "today" | "week" | "custom"
  >("all");
  const [sortBy, setSortBy] = useState<"date" | "status">("date");

  const fetchUpcoming = async () => {
    try {
      // Get lineups from 30 days ago to future (not just future)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const res = await supabase
        .from("LINEUP")
        .select("id,NAME,POSITION,EMAIL,PROFILE,scheduled_at,status")
        .gte("scheduled_at", thirtyDaysAgo.toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(50);

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
        .select("id,name,position,created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (res.error) {
        // eslint-disable-next-line no-console
        console.warn("fetchSubmissions error", res.error);
        setSubmissions([]);
        return;
      }
      setSubmissions((res as any).data || []);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(e);
      setSubmissions([]);
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
        setMessage("No upcoming lineups found");
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
          setMessage("Failed to approve upcoming lineup");
        } else {
          setMessage(`Approved upcoming lineup id=${next.id}`);
        }
      } else {
        setMessage("Next upcoming lineup is not pending");
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("approveNext error", e);
      setMessage("Error while approving upcoming lineup");
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      await fetchUpcoming();
      await approveNext();
      await fetchSubmissions();
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

  // live clock
  useEffect(() => {
    const t = setInterval(
      () => setNowString(new Date().toLocaleTimeString()),
      1000
    );
    return () => clearInterval(t);
  }, []);

  // Filter rows by selected date
  const filteredRows = selectedDate
    ? rows.filter((r) => {
        if (!r.scheduled_at) return false;

        // Parse the scheduled date and normalize to local date
        const scheduled = new Date(r.scheduled_at);
        const scheduledDateStr = `${scheduled.getFullYear()}-${String(
          scheduled.getMonth() + 1
        ).padStart(2, "0")}-${String(scheduled.getDate()).padStart(2, "0")}`;

        // Debug logging
        if (rows.indexOf(r) === 0) {
          console.log("Filter Debug:", {
            selectedDate,
            scheduledDateStr,
            originalDate: r.scheduled_at,
            matches: scheduledDateStr === selectedDate,
          });
        }

        // Compare date strings directly
        return scheduledDateStr === selectedDate;
      })
    : rows;

  // Sort by date (earliest first)
  const sortedRows = [...filteredRows].sort((a, b) => {
    const dateA = a.scheduled_at ? new Date(a.scheduled_at).getTime() : 0;
    const dateB = b.scheduled_at ? new Date(b.scheduled_at).getTime() : 0;
    return dateA - dateB;
  });

  // Filter submissions by selected date as well
  const filteredSubmissions = selectedDate
    ? submissions.filter((s) => {
        if (!s.created_at) return false;

        const created = new Date(s.created_at);
        const createdDateStr = `${created.getFullYear()}-${String(
          created.getMonth() + 1
        ).padStart(2, "0")}-${String(created.getDate()).padStart(2, "0")}`;

        return createdDateStr === selectedDate;
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
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </div>
          <div className="small text-muted">{nowString}</div>
        </div>

        <div className="ms-auto header-right">
          <nav className="nav">
            <Link className="nav-link active" to="/soccom">
              Dashboard
            </Link>
            {/* <Link className="nav-link" to="/choirs">
              Choirs
            </Link>
            <Link className="nav-link" to="/settings">
              Settings
            </Link> */}
            <Link className="nav-link" to="/">
              Logout
            </Link>
          </nav>
        </div>
      </div>

      {message && (
        <div className="container px-3">
          <div className="alert alert-info">{message}</div>
        </div>
      )}

      {/* Date Picker Filter */}
      <div className="container px-3 mb-4">
        <div className="row">
          <div className="col-12 col-md-6 col-lg-4">
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
                Showing lineups for{" "}
                {new Date(selectedDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}{" "}
                ({filteredRows.length + filteredSubmissions.length} found)
              </small>
            )}
          </div>
        </div>
      </div>

      <div className="container px-3">
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
            !selectedDate && <div className="col-12">No upcoming lineups</div>}

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
            return (
              <div key={r.id} className="col-12 col-sm-6 col-md-4 col-lg-3">
                <div className="card card-dashboard h-100 shadow-sm">
                  <div className="card-body d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className="d-flex align-items-center">
                        <div className="icon-circle me-3">
                          <i className="bi bi-music-note-list" />
                        </div>
                        <div>
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
                        <strong>
                          {r.scheduled_at
                            ? new Date(r.scheduled_at).toLocaleString()
                            : "-"}
                        </strong>
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
          {/* show recent submissions from lineupinfo */}
          {filteredSubmissions.map((s) => (
            <div
              key={`s-${s.id}`}
              className="col-12 col-sm-6 col-md-4 col-lg-3"
            >
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <h6 className="card-title mb-1">{s.name || "(No name)"}</h6>
                  <div className="small text-muted mb-2">
                    {s.position || ""}
                  </div>
                  <div className="mb-2">
                    <strong>
                      {s.created_at
                        ? new Date(s.created_at).toLocaleString()
                        : "-"}
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
          ))}
        </div>
      </div>
    </div>
  );
};

export default Soccom;
