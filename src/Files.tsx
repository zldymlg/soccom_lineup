import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { Link, useNavigate } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./Choir.css";
import "./soccom.css";

interface FileEntry {
  url: string;
  fileName: string;
  part: string;
  uploaderName?: string | null;
  uploaderEmail?: string | null;
  date?: string | null;
  created_at?: string | null;
  source?: string;
}

interface FilesProps {
  embed?: boolean;
}

const Files: React.FC<FilesProps> = ({ embed = false }) => {
  const navigate = useNavigate();
  const [filesList, setFilesList] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [userName, setUserName] = useState<string | null>(null);
  const [profileUrl, setProfileUrl] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [nowString, setNowString] = useState<string>(
    new Date().toISOString().split("T")[1].split(".")[0],
  );

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

  const fetchFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all files from PDF storage bucket
      const { error: storageError } = await supabase.storage
        .from("PDF")
        .list("", {
          limit: 1000,
          offset: 0,
          sortBy: { column: "created_at", order: "desc" },
        });

      if (storageError) {
        // eslint-disable-next-line no-console
        console.warn("Storage list error", storageError);
        setError("Failed to fetch files from storage");
        setFilesList([]);
        setLoading(false);
        return;
      }

      const collected: FileEntry[] = [];

      // Recursively list all folders
      const listFolder = async (path: string) => {
        const { data: items, error: listError } = await supabase.storage
          .from("PDF")
          .list(path, {
            limit: 1000,
            offset: 0,
            sortBy: { column: "created_at", order: "desc" },
          });

        if (listError) {
          // eslint-disable-next-line no-console
          console.warn(`List error for ${path}`, listError);
          return;
        }

        if (!items) return;

        for (const item of items) {
          const fullPath = path ? `${path}/${item.name}` : item.name;

          if (item.id === null) {
            // It's a folder, recurse
            await listFolder(fullPath);
          } else {
            // It's a file
            const { data: publicUrlData } = supabase.storage
              .from("PDF")
              .getPublicUrl(fullPath);

            if (publicUrlData?.publicUrl) {
              // Extract metadata from path (email/date/filename pattern)
              const pathParts = fullPath.split("/");
              let uploaderEmail: string | null = null;
              let date: string | null = null;
              let part: string | null = null;

              // Pattern: email/date/filename or date/email/filename
              if (pathParts.length >= 2) {
                // Try to detect email in path
                const emailMatch = pathParts.find((p) => p.includes("@"));
                if (emailMatch) uploaderEmail = emailMatch;

                // Try to detect date (YYYY-MM-DD)
                const dateMatch = pathParts.find((p) =>
                  /^\d{4}-\d{2}-\d{2}$/.test(p),
                );
                if (dateMatch) date = dateMatch;
              }

              // Extract part from filename (assumes pattern: part_date_time_*.pdf)
              const fileName = item.name;
              const partMatch = fileName.match(/^([^_]+)_/);
              if (partMatch) {
                part = partMatch[1];
              }

              collected.push({
                url: publicUrlData.publicUrl,
                fileName: item.name,
                part: part || "unknown",
                uploaderName: null,
                uploaderEmail,
                date,
                created_at: item.created_at || null,
                source: "storage",
              });
            }
          }
        }
      };

      await listFolder("");

      // Dedupe by URL
      const seen = new Set<string>();
      const deduped = collected.filter((f) => {
        if (!f.url) return false;
        if (seen.has(f.url)) return false;
        seen.add(f.url);
        return true;
      });

      // Sort newest first
      deduped.sort((a, b) => {
        const ta = a.created_at
          ? new Date(a.created_at).getTime()
          : a.date
            ? new Date(a.date).getTime()
            : 0;
        const tb = b.created_at
          ? new Date(b.created_at).getTime()
          : b.date
            ? new Date(b.date).getTime()
            : 0;
        return tb - ta;
      });

      setFilesList(deduped);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("fetchFiles exception", e);
      setError("Unexpected error fetching files");
      setFilesList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();

    // Load user info from localStorage
    try {
      const name = localStorage.getItem("soccom-user-name");
      const p = localStorage.getItem("soccom-profile-url");
      const role = localStorage.getItem("soccom-user-role");
      if (name) setUserName(name);
      if (p) setProfileUrl(p);
      if (role) setUserRole(role);
    } catch (e) {
      // ignore
    }
  }, []);

  // Live clock
  useEffect(() => {
    const t = setInterval(
      () => setNowString(new Date().toLocaleTimeString()),
      1000,
    );
    return () => clearInterval(t);
  }, []);

  const filteredFiles = selectedDate
    ? filesList.filter((f) => f.date && String(f.date).startsWith(selectedDate))
    : filesList;

  // Apply search filter
  const searchFilteredFiles = searchQuery
    ? filteredFiles.filter((f) => {
        const query = searchQuery.toLowerCase();
        return (
          f.fileName.toLowerCase().includes(query) ||
          f.part.toLowerCase().includes(query) ||
          (f.uploaderEmail && f.uploaderEmail.toLowerCase().includes(query)) ||
          (f.date && f.date.includes(query))
        );
      })
    : filteredFiles;

  return (
    <div
      className={`${embed ? "container-fluid" : "soccom-page container-fluid"} py-4`}
    >
      {!embed && (
        <div className="soccom-header d-flex align-items-center mb-4 px-3">
          <div className="d-flex align-items-center header-left">
            <div className="avatar me-2">
              {profileUrl ? (
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
              <Link className="nav-link" to="/soccom">
                Dashboard
              </Link>
              <Link className="nav-link active" to="/files">
                Files
              </Link>
              {userRole === "admin" && (
                <Link className="nav-link" to="/admin">
                  Admin
                </Link>
              )}
              <button className="nav-link btn btn-link" onClick={handleLogout}>
                Logout
              </button>
            </nav>
          </div>
        </div>
      )}

      <div className="container px-3">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="mb-0">
            <i className="bi bi-folder2-open me-2" />
            All Files
          </h3>
          <div className="d-flex align-items-center">
            <div className="me-3">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: "200px" }}
              />
            </div>
            <div className="me-3">
              <input
                type="date"
                className="form-control form-control-sm"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            {(selectedDate || searchQuery) && (
              <button
                className="btn btn-sm btn-outline-secondary me-2"
                onClick={() => {
                  setSelectedDate("");
                  setSearchQuery("");
                }}
                title="Clear filters"
              >
                <i className="bi bi-x-lg" /> Clear
              </button>
            )}
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => fetchFiles()}
              disabled={loading}
            >
              <i className="bi bi-arrow-clockwise" /> Refresh
            </button>
          </div>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {loading && (
          <div className="small text-muted mb-2">
            Loading files from storage…
          </div>
        )}

        {!loading && searchFilteredFiles.length === 0 && (
          <div className="alert alert-warning mb-0">
            {searchQuery || selectedDate
              ? "No files match your filters"
              : "No files found"}
          </div>
        )}

        {!loading && searchFilteredFiles.length > 0 && (
          <div className="table-responsive">
            <table className="table table-sm table-hover">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Part</th>
                  <th>Uploaded By</th>
                  <th>Date</th>
                  <th>Added</th>
                </tr>
              </thead>
              <tbody>
                {searchFilteredFiles.map((f, i) => (
                  <tr key={i}>
                    <td>
                      <a href={f.url} target="_blank" rel="noreferrer noopener">
                        <i className="bi bi-file-earmark-pdf me-2"></i>
                        {f.fileName}
                      </a>
                    </td>
                    <td>
                      <span className="badge bg-secondary">{f.part}</span>
                    </td>
                    <td>{f.uploaderEmail || "-"}</td>
                    <td>{f.date ? f.date : "-"}</td>
                    <td>
                      {f.created_at
                        ? new Date(f.created_at).toISOString()
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Files;
