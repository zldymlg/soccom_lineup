import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import "./LineupView.css";
import { useParams, useNavigate } from "react-router-dom";

const massParts = [
  {
    id: "processional",
    label: "Processional",
    col: "Procesional",
    time: "9:00 AM",
  },
  { id: "kyrie", label: "Kyrie", col: "Kyrie", time: "9:05 AM" },
  { id: "gloria", label: "Gloria", col: "Gloria", time: "9:09 AM" },
  {
    id: "responsorial",
    label: "Responsorial Psalm",
    col: "Psalm",
    time: "9:20 AM",
  },
  { id: "alleluia", label: "Alleluia", col: "Alleluia", time: "9:25 AM" },
  {
    id: "offertory",
    label: "Offertorium",
    col: "Offertorium",
    time: "9:35 AM",
  },
  { id: "sanctus", label: "Sanctus", col: "MysteriumFidei", time: "9:45 AM" },
  { id: "communion", label: "Communion", col: "PaterNoster", time: "10:15 AM" },
  { id: "amen", label: "Amen", col: "Amen", time: "9:50 AM" },
  { id: "agnus", label: "Agnus Dei", col: "AgnusDei", time: "10:10 AM" },
  {
    id: "recessional",
    label: "Recessional",
    col: "Recession",
    time: "10:25 AM",
  },
];

const findField = (row: any, name: string) => {
  if (!row) return null;
  if (row[name] !== undefined) return row[name];
  const lower = name.toLowerCase();
  if (row[lower] !== undefined) return row[lower];
  const upper = name.toUpperCase();
  if (row[upper] !== undefined) return row[upper];
  return null;
};

const LineupView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [row, setRow] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedParts, setExpandedParts] = useState<{
    [key: string]: boolean;
  }>({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        // Try LINEUP first, fallback to lineupinfo
        const res = await supabase
          .from("LINEUP")
          .select("*")
          .eq("id", id)
          .maybeSingle();
        if (!mounted) return;
        if ((res as any).error) {
          // eslint-disable-next-line no-console
          console.warn("Lineup fetch error (LINEUP)", (res as any).error);
        }
        let data = (res as any).data || null;
        if (!data) {
          const res2 = await supabase
            .from("lineupinfo")
            .select("*")
            .eq("id", id)
            .maybeSingle();
          if (!mounted) return;
          if ((res2 as any).error) {
            // eslint-disable-next-line no-console
            console.warn(
              "Lineup fetch error (lineupinfo)",
              (res2 as any).error,
            );
          }
          data = (res2 as any).data || null;
        }
        setRow(data);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(e);
        setRow(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const getFilesFromStorageField = (field: any) => {
    if (!field) return [] as string[];
    if (Array.isArray(field)) return field as string[];
    if (typeof field === "string") {
      try {
        const parsed = JSON.parse(field);
        if (Array.isArray(parsed)) return parsed;
        if (typeof parsed === "string") return [parsed];
      } catch (e) {
        return [field];
      }
    }
    return [] as string[];
  };

  const buildPrintableHTML = (data: any) => {
    const title = data?.NAME || data?.name || "Mass Lineup";
    const date = formatDate(data?.date || data?.scheduled_at) || "";
    let html = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
      <style>body{font-family:Arial,Helvetica,sans-serif;padding:20px}h1{font-size:20px}h2{font-size:16px}.part{margin-bottom:12px}.label{font-weight:700}</style>
      </head><body>`;
    html += `<h1>${title}</h1><h2>${date}</h2>`;
    html += `<div>`;
    massParts.forEach((p) => {
      const base = findField(data, p.col) || "";
      const lyrics = findField(data, `${p.col}Lyrics`) || "";
      html += `<div class="part"><div class="label">${p.label}</div><div>${base}</div>`;
      if (lyrics) html += `<pre style="white-space:pre-wrap">${lyrics}</pre>`;
      html += `</div>`;
    });
    html += `</div></body></html>`;
    return html;
  };

  const exportAsPDF = () => {
    const html = buildPrintableHTML(row);
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    setTimeout(() => {
      try {
        w.focus();
        w.print();
      } catch (e) {
        // ignore
      }
    }, 500);
  };

  const exportAsWord = () => {
    const html = buildPrintableHTML(row);
    const blob = new Blob([html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lineup-${id || "export"}.doc`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const toggleLyrics = (partId: string) => {
    setExpandedParts((prev) => ({ ...prev, [partId]: !prev[partId] }));
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "";
    // Normalize common SQL date formats (YYYY-MM-DD, YYYY-MM-DD HH:MM:SS, or ISO)
    try {
      if (typeof dateString === "string") {
        // Match YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS or with space
        const m = dateString.match(
          /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/,
        );
        if (m) {
          const y = Number(m[1]);
          const mo = String(Number(m[2])).padStart(2, "0");
          const d = String(Number(m[3])).padStart(2, "0");
          return `${y}-${mo}-${d}`;
        }
      }
      const date = new Date(dateString as any);
      if (isNaN(date.getTime())) return "";
      const y = date.getFullYear();
      const mo = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return `${y}-${mo}-${d}`;
    } catch (e) {
      return "";
    }
  };

  const formatTimeString = (timeString: string | null | undefined) => {
    if (!timeString) return "";
    // If already a readable time (contains AM/PM), return as-is
    if (/AM|PM/i.test(timeString)) return timeString;
    // Match HH:MM or HH:MM:SS
    const m = String(timeString).match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (m) {
      const hh = String(Number(m[1])).padStart(2, "0");
      const mm = String(Number(m[2])).padStart(2, "0");
      const ss = m[3] ? String(Number(m[3])).padStart(2, "0") : "00";
      return `${hh}:${mm}:${ss}`;
    }
    return String(timeString);
  };

  return (
    <div className="lineup-view-page">
      <div className="lineup-container container">
        {/* Header */}
        <div className="lineup-page-header">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-2">
                <i className="bi bi-music-note-beamed text-primary"></i>
                <span className="text-muted small">ChoirMaster</span>
              </div>
              <h2 className="lineup-title mb-1">
                Mass Lineup - {formatDate(row?.date || row?.scheduled_at)}
              </h2>
              <p className="text-muted mb-0">
                Complete liturgical music program with lyrics
              </p>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-danger btn-sm" onClick={exportAsPDF}>
                <i className="bi bi-file-pdf"></i> Export PDF
              </button>
              <button className="btn btn-dark btn-sm" onClick={exportAsWord}>
                <i className="bi bi-file-word"></i> Export Word
              </button>
            </div>
          </div>

          {/* User Info */}
          <div className="user-info-bar d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-3">
              <div className="user-avatar">
                {row?.PROFILE || row?.profile ? (
                  <img
                    src={row?.PROFILE || row?.profile}
                    alt="Profile"
                    className="rounded-circle"
                  />
                ) : (
                  <i className="bi bi-person-circle"></i>
                )}
              </div>
              <div>
                <div className="fw-bold">
                  {row?.NAME || row?.name || "Unknown"}
                </div>
                <div className="small text-muted">
                  {row?.POSITION || row?.position || "Music Director"}
                </div>
              </div>
            </div>
            <div className="text-end small text-muted">
              {(row?.date || row?.scheduled_at) && (
                <>
                  <div className="fw-bold">
                    {formatTimeString(row?.time || row?.TIME || "")} -{" "}
                    {formatDate(row?.date || row?.scheduled_at)}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {loading && <div>Loading…</div>}
        {!loading && !row && <div>No lineup found</div>}

        {!loading && row && (
          <div className="lineup-parts-list">
            {massParts.map((p, index) => {
              const base = findField(row, p.col) || "";
              const lyrics = findField(row, `${p.col}Lyrics`);
              const storage = findField(row, `${p.col}Storage`);
              const isExpanded = expandedParts[p.id];

              return (
                <div key={p.id} className="lineup-part-card">
                  <div className="part-header">
                    <div className="part-number">{index + 1}</div>
                    <div className="part-content flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h5 className="part-label mb-1">{p.label}</h5>
                          <div className="part-song-title">
                            {base || "(No song selected)"}
                          </div>
                          {lyrics && (
                            <button
                              className="btn-link-custom"
                              onClick={() => toggleLyrics(p.id)}
                            >
                              <i
                                className={`bi bi-chevron-${
                                  isExpanded ? "down" : "right"
                                }`}
                              ></i>
                              Show Lyrics
                            </button>
                          )}
                          {storage && (
                            <div className="mt-2 file-links">
                              {getFilesFromStorageField(storage).map((u, i) => (
                                <div key={i} className="mb-1">
                                  <a
                                    href={u}
                                    target="_blank"
                                    rel="noreferrer noopener"
                                    className="file-link d-inline-flex align-items-center"
                                  >
                                    <i
                                      className={`bi ${
                                        u.toLowerCase().endsWith(".pdf")
                                          ? "bi-file-pdf"
                                          : u.toLowerCase().endsWith(".doc") ||
                                              u.toLowerCase().endsWith(".docx")
                                            ? "bi-file-word"
                                            : u.toLowerCase().endsWith(".svg")
                                              ? "bi-file-earmark-image"
                                              : "bi-file-earmark"
                                      } me-2`}
                                    ></i>
                                    <span className="small">
                                      {u.split("/").pop() || `file-${i + 1}`}
                                    </span>
                                  </a>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="part-time text-muted small">
                          {formatTimeString(row?.time || p.time)} -{" "}
                          {formatDate(row?.date || row?.scheduled_at)}
                        </div>
                      </div>
                      {isExpanded && lyrics && (
                        <div className="lyrics-section mt-3">
                          <div className="lyrics-content">{lyrics}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Choir files removed per request */}

        {/* Back Button */}
        <div className="text-center mt-4">
          <button
            className="btn btn-outline-primary"
            onClick={() => navigate(-1)}
          >
            <i className="bi bi-arrow-left"></i> Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default LineupView;
