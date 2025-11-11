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
              (res2 as any).error
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

  const toggleLyrics = (partId: string) => {
    setExpandedParts((prev) => ({ ...prev, [partId]: !prev[partId] }));
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
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
                Mass Lineup - {formatDate(row?.scheduled_at || row?.created_at)}
              </h2>
              <p className="text-muted mb-0">
                Complete liturgical music program with lyrics
              </p>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-danger btn-sm">
                <i className="bi bi-file-pdf"></i> Export PDF
              </button>
              <button className="btn btn-dark btn-sm">
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
              {formatDate(row?.scheduled_at || row?.created_at) && (
                <>
                  <div className="fw-bold">
                    9:00 AM - {formatDate(row?.scheduled_at || row?.created_at)}
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
                            <div className="mt-2">
                              <a
                                href={storage}
                                target="_blank"
                                rel="noreferrer"
                                className="file-link"
                              >
                                <i className="bi bi-file-earmark-music"></i>{" "}
                                {storage.includes(".pdf")
                                  ? "Sheet Music.pdf"
                                  : storage.includes(".mp3")
                                  ? "Audio Guide.mp3"
                                  : "View File"}
                              </a>
                            </div>
                          )}
                        </div>
                        <div className="part-time text-muted small">
                          {p.time} -{" "}
                          {formatDate(row?.scheduled_at || row?.created_at)}
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
