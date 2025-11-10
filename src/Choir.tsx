import { useState, useEffect } from "react";
import "./Choir.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Link } from "react-router-dom";

interface MassPart {
  id: string;
  title: string;
  icon: string;
  color: string;
}

interface SongFile {
  file: File;
  url: string;
}

const Choir: React.FC = () => {
  const [darkMode, _setDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem("soccom-dark-mode") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("soccom-dark-mode", String(darkMode));
    } catch {}
  }, [darkMode]);

  const massParts: MassPart[] = [
    {
      id: "processional",
      title: "Processional",
      icon: "bi-music-note",
      color: "#0d6efd",
    },
    {
      id: "kyrie",
      title: "Kyrie",
      icon: "bi-music-note-beamed",
      color: "#dc3545",
    },
    {
      id: "gloria",
      title: "Gloria",
      icon: "bi-music-note",
      color: "#198754",
    },
    {
      id: "responsorial",
      title: "Responsorial Psalm",
      icon: "bi-music-note-beamed",
      color: "#0dcaf0",
    },
    {
      id: "alleluia",
      title: "Alleluia",
      icon: "bi-music-note",
      color: "#fd7e14",
    },
    {
      id: "offertory",
      title: "Offertory",
      icon: "bi-music-note-beamed",
      color: "#6610f2",
    },
    {
      id: "sanctus",
      title: "Sanctus",
      icon: "bi-music-note",
      color: "#d63384",
    },
    {
      id: "amen",
      title: "Amen",
      icon: "bi-music-note-beamed",
      color: "#198754",
    },
    {
      id: "agnus",
      title: "Agnus Dei",
      icon: "bi-music-note",
      color: "#0dcaf0",
    },
    {
      id: "communion",
      title: "Communion",
      icon: "bi-music-note-beamed",
      color: "#6f42c1",
    },
    {
      id: "recessional",
      title: "Recessional",
      icon: "bi-music-note",
      color: "#20c997",
    },
  ];

  // user info loaded from localStorage for quick verification
  const [name, setName] = useState("");
  const [choirGroup, setChoirGroup] = useState("");
  const [profileUrl, setProfileUrl] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedName = localStorage.getItem("soccom-user-name");
      const storedGroup = localStorage.getItem("soccom-choir-group");
      const storedProfile = localStorage.getItem("soccom-profile-url");
      if (storedName) setName(storedName);
      if (storedGroup) setChoirGroup(storedGroup);
      if (storedProfile) setProfileUrl(storedProfile);
    } catch {
      /* ignore */
    }
  }, []);

  const [selectedMass, setSelectedMass] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [songFiles, setSongFiles] = useState<Record<string, SongFile>>({});
  const [dragActive, setDragActive] = useState<string | null>(null);
  const handleFileChange = (
    partId: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Only allow PDF and Word files
    if (
      !file.type.match(
        "application/pdf|application/msword|application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      )
    ) {
      alert("Please upload PDF or Word documents only");
      return;
    }

    const url = URL.createObjectURL(file);
    setSongFiles((prev) => ({
      ...prev,
      [partId]: { file, url },
    }));
  };

  const removeFile = (partId: string) => {
    if (songFiles[partId]) {
      URL.revokeObjectURL(songFiles[partId].url);
      setSongFiles((prev) => {
        const newFiles = { ...prev };
        delete newFiles[partId];
        return newFiles;
      });
    }
  };

  const handleDrag = (e: React.DragEvent, partId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(partId);
    } else if (e.type === "dragleave") {
      setDragActive(null);
    }
  };

  const handleDrop = (e: React.DragEvent, partId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(null);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (
      !file.type.match(
        "application/pdf|application/msword|application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      )
    ) {
      alert("Please upload PDF or Word documents only");
      return;
    }

    const url = URL.createObjectURL(file);
    setSongFiles((prev) => ({
      ...prev,
      [partId]: { file, url },
    }));
  };

  return (
    <div className="choir-container">
      <div className="container-fluid">
        <div className="row justify-content-center">
          <div className="col-12 col-xl-9">
            <div className="mass-card">
              {/* Updated header section */}
              <div className="mass-header px-3">
                <div className="d-flex align-items-center justify-content-between flex-wrap">
                  <div className="d-flex align-items-center gap-3">
                    <i className="bi bi-music-note-list fs-4 text-primary"></i>
                    <div>
                      <h5 className="mb-0">Mass Song Selection</h5>
                      <div className="text-muted small">
                        Plan your choir's lineup
                      </div>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-3 ms-auto flex-wrap">
                    <div className="d-flex align-items-center">
                      <select
                        className="form-select form-select-sm choir-select"
                        value={selectedMass}
                        onChange={(e) => setSelectedMass(e.target.value)}
                      >
                        <option value="">Select Mass Schedule</option>
                        <option value="6:00 AM">6:00 AM Mass</option>
                        <option value="7:30 AM">7:30 AM Mass</option>
                        <option value="9:00 AM">9:00 AM Mass</option>
                        <option value="4:30 PM">4:30 PM Mass</option>
                        <option value="6:00 PM">6:00 PM Mass</option>
                        <option value="other">Other (Specify Time)</option>
                      </select>

                      {selectedMass === "other" && (
                        <input
                          type="time"
                          className="form-control form-control-sm ms-2"
                          placeholder="Specify time"
                        />
                      )}

                      <input
                        type="date"
                        className="form-control form-control-sm ms-2"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                      />
                    </div>

                    <div className="d-flex align-items-center ms-3">
                      {profileUrl ? (
                        <img
                          src={profileUrl}
                          alt="Profile"
                          className="rounded-circle"
                          style={{ width: 56, height: 56, objectFit: "cover" }}
                        />
                      ) : (
                        <i className="bi bi-person-circle fs-3 text-secondary"></i>
                      )}
                      <div className="ms-2 text-end">
                        <div className="fw-bold small">
                          {name || "(No name)"}
                        </div>
                        <div className="small text-muted">
                          {choirGroup || "(No choir)"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-12">
                  <div className="row">
                    {massParts.map((part) => (
                      <div key={part.id} className="col-12 col-lg-6">
                        <div className="song-section">
                          <div
                            className="song-icon"
                            style={{
                              background: `${part.color}15`,
                              color: part.color,
                            }}
                          >
                            <i className={`bi ${part.icon}`}></i>
                          </div>
                          <div className="song-content">
                            <div className="song-title">{part.title}</div>
                            <input
                              type="text"
                              className="form-control mb-2"
                              placeholder="Enter song title"
                            />
                            <textarea
                              className="form-control mb-2"
                              rows={2}
                              placeholder="Additional notes (optional)"
                            ></textarea>

                            <div className="file-section">
                              {songFiles[part.id] ? (
                                <div className="d-flex align-items-center gap-2 border rounded p-2 bg-light">
                                  <i
                                    className={`bi ${
                                      songFiles[part.id].file.type.includes(
                                        "pdf"
                                      )
                                        ? "bi-file-pdf"
                                        : "bi-file-word"
                                    }`}
                                  ></i>
                                  <small className="text-truncate flex-grow-1">
                                    {songFiles[part.id].file.name}
                                  </small>
                                  <div className="btn-group btn-group-sm">
                                    <a
                                      href={songFiles[part.id].url}
                                      target="_blank"
                                      className="btn btn-outline-primary btn-sm"
                                      rel="noopener noreferrer"
                                    >
                                      <i className="bi bi-eye"></i>
                                    </a>
                                    <button
                                      type="button"
                                      className="btn btn-outline-danger btn-sm"
                                      onClick={() => removeFile(part.id)}
                                    >
                                      <i className="bi bi-x"></i>
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  className={`file-drop-zone ${
                                    dragActive === part.id ? "dragging" : ""
                                  }`}
                                  onDragEnter={(e) => handleDrag(e, part.id)}
                                  onDragOver={(e) => handleDrag(e, part.id)}
                                  onDragLeave={(e) => handleDrag(e, part.id)}
                                  onDrop={(e) => handleDrop(e, part.id)}
                                  onClick={() =>
                                    document
                                      .getElementById(`file-${part.id}`)
                                      ?.click()
                                  }
                                >
                                  <div className="drop-message">
                                    <i className="bi bi-cloud-upload me-2"></i>
                                    Drop files here or click to upload
                                  </div>
                                  <input
                                    id={`file-${part.id}`}
                                    type="file"
                                    className="d-none"
                                    accept=".pdf,.doc,.docx"
                                    onChange={(e) =>
                                      handleFileChange(part.id, e)
                                    }
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center mt-4 pt-4 border-top">
                <button className="btn btn-primary px-4">Submit Lineup</button>
                <Link to="/" className="btn btn-outline-secondary">
                  Cancel
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Choir;
