import { useState, useEffect } from "react";
import "./Choir.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Link } from "react-router-dom";
import { supabase } from "./supabaseClient";

interface MassPart {
  id: string;
  title: string;
  icon: string;
  color: string;
}

interface SongFile {
  file: File;
  url?: string;
  storagePath?: string;
  uploading?: boolean;
  uploaded?: boolean;
}

interface LineupRecord {
  id: number;
  name: string;
  position: string;
  time: string;
  date: string;
  created_at: string;
  procesional?: string;
  procesionallyrics?: string;
  kyrie?: string;
  kyrielyrics?: string;
  gloria?: string;
  glorialyrics?: string;
  psalm?: string;
  psalmlyrics?: string;
  alleluia?: string;
  alleluialyrics?: string;
  offertorium?: string;
  offertoriumlyrics?: string;
  mysteriumfidei?: string;
  mysteriumfideilyrics?: string;
  amen?: string;
  amenlyrics?: string;
  agnusdei?: string;
  agnusdeilyrics?: string;
  paternoster?: string;
  paternosterlyrics?: string;
  recession?: string;
  recessionlyrics?: string;
  procesionalstorage?: string;
  kyriestorage?: string;
  gloriastorage?: string;
  psalmstorage?: string;
  alleluiastorage?: string;
  offertoriumstorage?: string;
  mysteriumfideistorage?: string;
  amenstorage?: string;
  agnusdeistorage?: string;
  paternosterstorage?: string;
  recessionstorage?: string;
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

  // Approve the next upcoming lineup entry automatically (if status is Pending)
  useEffect(() => {
    // approval now handled in Soccom dashboard
    return undefined;
  }, []);

  const [selectedMass, setSelectedMass] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [songFiles, setSongFiles] = useState<Record<string, SongFile[]>>({});
  const [songsData, setSongsData] = useState<
    Record<string, { title: string; lyrics: string }>
  >({});
  const [dragActive, setDragActive] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [showLineups, setShowLineups] = useState(false);
  const [lineups, setLineups] = useState<LineupRecord[]>([]);
  const [loadingLineups, setLoadingLineups] = useState(false);
  const [lineupsError, setLineupsError] = useState<string | null>(null);
  const [editingLineup, setEditingLineup] = useState<LineupRecord | null>(null);
  // Supabase storage bucket name
  const SUPABASE_BUCKET = "PDF";

  // Auto-hide notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (
    message: string,
    type: "success" | "error" | "info"
  ) => {
    setNotification({ message, type });
  };

  const fetchLineups = async () => {
    setLoadingLineups(true);
    setLineupsError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        const errorMsg = "Please log in to view lineups";
        setLineupsError(errorMsg);
        showNotification(errorMsg, "error");
        setLoadingLineups(false);
        return;
      }

      // Get the current user's name from localStorage or use email
      const userName =
        name || localStorage.getItem("soccom-user-name") || user.email;

      console.log("Fetching lineups for user:", userName);

      const { data, error } = await supabase
        .from("lineupinfo")
        .select("*")
        .eq("name", userName)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching lineups:", error);
        console.error("Error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        const errorMsg = `Failed to load lineups: ${
          error.message || error.code || "Unknown error"
        }`;
        setLineupsError(errorMsg);
        showNotification(errorMsg, "error");
      } else {
        console.log("Lineups fetched successfully:", data?.length || 0);
        setLineups(data || []);
        setLineupsError(null);
      }
    } catch (e: any) {
      console.error("Error loading lineups:", e);
      const errorMsg = `Error loading lineups: ${
        e?.message || JSON.stringify(e)
      }`;
      setLineupsError(errorMsg);
      showNotification(errorMsg, "error");
    } finally {
      setLoadingLineups(false);
    }
  };

  const canEditLineup = (massDate: string): boolean => {
    const mass = new Date(massDate);
    const now = new Date();
    const hoursDifference = (mass.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursDifference >= 24;
  };

  const loadLineupForEdit = (lineup: LineupRecord) => {
    if (!canEditLineup(lineup.date)) {
      showNotification(
        "Cannot edit lineup less than 24 hours before mass",
        "error"
      );
      return;
    }

    // Map DB columns back to form state
    const mapping: Record<string, string> = {
      procesional: "processional",
      kyrie: "kyrie",
      gloria: "gloria",
      psalm: "responsorial",
      alleluia: "alleluia",
      offertorium: "offertory",
      mysteriumfidei: "sanctus",
      amen: "amen",
      agnusdei: "agnus",
      paternoster: "communion",
      recession: "recessional",
    };

    const newSongsData: Record<string, { title: string; lyrics: string }> = {};
    const newSongFiles: Record<string, SongFile[]> = {};

    for (const [dbCol, localId] of Object.entries(mapping)) {
      const title = (lineup as any)[dbCol] || "";
      const lyrics = (lineup as any)[`${dbCol}lyrics`] || "";
      const storageCol = `${dbCol}storage`;
      const storageData = (lineup as any)[storageCol];

      if (title) {
        newSongsData[localId] = { title, lyrics };
      }

      // Parse file URLs if they exist
      if (storageData) {
        try {
          const urls = JSON.parse(storageData);
          if (Array.isArray(urls) && urls.length > 0) {
            // Create placeholder file objects for existing files
            newSongFiles[localId] = urls.map((url: string) => ({
              file: new File([], "existing-file.pdf"),
              url,
              uploaded: true,
            }));
          }
        } catch (e) {
          console.warn("Failed to parse storage data:", e);
        }
      }
    }

    // Load the lineup data into the form
    setSelectedMass(lineup.time);
    setSelectedDate(lineup.date);
    setSongsData(newSongsData);
    setSongFiles(newSongFiles);
    setEditingLineup(lineup);
    setShowLineups(false);

    showNotification("Lineup loaded for editing", "info");
  };

  const uploadToStorage = async (partId: string, file: File) => {
    try {
      // Validate that date is selected before uploading
      if (!selectedDate) {
        showNotification(
          "Please select a mass date before uploading files",
          "error"
        );
        return null;
      }

      // Get user email from Supabase auth
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        showNotification(
          "Error: You must be logged in to upload files",
          "error"
        );
        return null;
      }

      const userEmail = user.email;

      // Create folder name from user email (sanitize it)
      const folderName = userEmail.replace(/[^a-z0-9@._-]/gi, "_");

      // Create date folder (format: YYYY-MM-DD)
      const dateFolder = selectedDate; // Already in YYYY-MM-DD format from date input

      // Get the mass part title for the filename
      const massPart = massParts.find((p) => p.id === partId);
      const partTitle = massPart?.title.replace(/\s+/g, "_") || partId;

      // Get file extension
      const fileExt = file.name.split(".").pop() || "pdf";

      // Format the date and time for filename
      const massDate = new Date(selectedDate);
      const dateStr = massDate.toISOString().split("T")[0]; // YYYY-MM-DD

      // Get mass time (sanitize for filename)
      const timeStr = (selectedMass === "other" ? selectedTime : selectedMass)
        .replace(/\s+/g, "_")
        .replace(/:/g, "-"); // Replace : with - for filename compatibility

      // Add current timestamp to allow multiple files
      const uploadTimestamp = Date.now();

      // Create path: folderName/dateFolder/PartTitle_Date_Time_timestamp.ext
      const path = `${folderName}/${dateFolder}/${partTitle}_Date-${dateStr}_Time-${timeStr}_${uploadTimestamp}.${fileExt}`;

      console.log(`Uploading to bucket "PDF" with path: ${path}`);

      const res = await supabase.storage
        .from(SUPABASE_BUCKET)
        .upload(path, file, { upsert: false });

      if (res.error) {
        console.error("Storage upload error:", res.error);

        // Handle RLS policy error specifically
        if (
          res.error.message.includes("row-level security policy") ||
          res.error.message.includes("RLS") ||
          res.error.message.includes("policy")
        ) {
          showNotification(
            "Upload permission denied. Please contact the administrator to enable storage access for the 'PDF' bucket.",
            "error"
          );
        } else {
          showNotification(`Failed to upload: ${res.error.message}`, "error");
        }
        return null;
      }

      const publicRes = await supabase.storage
        .from(SUPABASE_BUCKET)
        .getPublicUrl(path);

      console.log("Upload successful! Public URL:", publicRes.data?.publicUrl);

      return { publicUrl: publicRes.data?.publicUrl || "", path };
    } catch (e: any) {
      console.error("Upload error:", e);
      showNotification(
        `Error uploading: ${e?.message || "Unknown error"}`,
        "error"
      );
      return null;
    }
  };

  const handleFileChange = async (
    partId: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Add files to state immediately (not uploaded yet)
    const newFiles: SongFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Only allow PDF and Word files
      if (
        !file.type.match(
          "application/pdf|application/msword|application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
      ) {
        showNotification(
          `Skipped ${file.name}: Only PDF or Word documents allowed`,
          "error"
        );
        continue;
      }

      newFiles.push({
        file,
        uploading: false,
        uploaded: false,
      });
    }

    if (newFiles.length > 0) {
      setSongFiles((prev) => ({
        ...prev,
        [partId]: [...(prev[partId] || []), ...newFiles],
      }));

      showNotification(
        `${newFiles.length} file(s) added. They will be uploaded when you submit.`,
        "info"
      );
    }

    // Reset the input
    event.target.value = "";
  };

  const removeFile = (partId: string, fileIndex: number) => {
    const files = songFiles[partId];
    if (!files || !files[fileIndex]) return;

    const fileToRemove = files[fileIndex];

    // attempt to remove from storage if we have a path
    if (fileToRemove.storagePath) {
      supabase.storage
        .from(SUPABASE_BUCKET)
        .remove([fileToRemove.storagePath])
        .catch((e) => {
          // eslint-disable-next-line no-console
          console.warn("failed to remove storage file", e);
        });
    }

    setSongFiles((prev) => {
      const updatedFiles = [...(prev[partId] || [])];
      updatedFiles.splice(fileIndex, 1);

      if (updatedFiles.length === 0) {
        const newFiles = { ...prev };
        delete newFiles[partId];
        return newFiles;
      }

      return {
        ...prev,
        [partId]: updatedFiles,
      };
    });
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

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    // Add files to state immediately (not uploaded yet)
    const newFiles: SongFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (
        !file.type.match(
          "application/pdf|application/msword|application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
      ) {
        showNotification(
          `Skipped ${file.name}: Only PDF or Word documents allowed`,
          "error"
        );
        continue;
      }

      newFiles.push({
        file,
        uploading: false,
        uploaded: false,
      });
    }

    if (newFiles.length > 0) {
      setSongFiles((prev) => ({
        ...prev,
        [partId]: [...(prev[partId] || []), ...newFiles],
      }));

      showNotification(
        `${newFiles.length} file(s) added. They will be uploaded when you submit.`,
        "info"
      );
    }
  };

  const updateSongField = (
    partId: string,
    field: "title" | "lyrics",
    value: string
  ) => {
    setSongsData((prev) => ({
      ...prev,
      [partId]: {
        title: field === "title" ? value : prev[partId]?.title || "",
        lyrics: field === "lyrics" ? value : prev[partId]?.lyrics || "",
      },
    }));
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!selectedMass) {
      showNotification("Please select a mass schedule", "error");
      return;
    }
    if (selectedMass === "other" && !selectedTime) {
      showNotification("Please specify the mass time", "error");
      return;
    }
    if (!selectedDate) {
      showNotification("Please select a date", "error");
      return;
    }

    // Check if at least one song title is filled
    const hasAnySong = massParts.some((part) =>
      songsData[part.id]?.title?.trim()
    );
    if (!hasAnySong) {
      showNotification("Please enter at least one song title", "error");
      return;
    }

    setSubmitting(true);
    showNotification("Uploading files and saving lineup...", "info");

    try {
      // Upload all files that haven't been uploaded yet
      const uploadPromises: Promise<void>[] = [];

      for (const partId of Object.keys(songFiles)) {
        const files = songFiles[partId];

        for (let i = 0; i < files.length; i++) {
          const fileObj = files[i];

          // Skip if already uploaded
          if (fileObj.uploaded && fileObj.url) continue;

          // Mark as uploading
          setSongFiles((prev) => {
            const updated = { ...prev };
            updated[partId] = [...(prev[partId] || [])];
            updated[partId][i] = { ...fileObj, uploading: true };
            return updated;
          });

          // Create upload promise
          const uploadPromise = (async () => {
            const uploaded = await uploadToStorage(partId, fileObj.file);

            if (uploaded) {
              // Update file with uploaded info
              setSongFiles((prev) => {
                const updated = { ...prev };
                updated[partId] = [...(prev[partId] || [])];
                updated[partId][i] = {
                  ...fileObj,
                  url: uploaded.publicUrl,
                  storagePath: uploaded.path,
                  uploading: false,
                  uploaded: true,
                };
                return updated;
              });
            } else {
              // Mark upload as failed
              setSongFiles((prev) => {
                const updated = { ...prev };
                updated[partId] = [...(prev[partId] || [])];
                updated[partId][i] = { ...fileObj, uploading: false };
                return updated;
              });
            }
          })();

          uploadPromises.push(uploadPromise);
        }
      }

      // Wait for all uploads to complete
      await Promise.all(uploadPromises);

      // Get the updated songFiles after all uploads
      const currentSongFiles = { ...songFiles };

      // Map local part ids to DB column base names
      const mapping: Record<string, string> = {
        processional: "Procesional",
        kyrie: "Kyrie",
        gloria: "Gloria",
        responsorial: "Psalm",
        alleluia: "Alleluia",
        offertory: "Offertorium",
        sanctus: "MysteriumFidei",
        amen: "Amen",
        agnus: "AgnusDei",
        communion: "PaterNoster",
        recessional: "Recession",
      };

      const payload: Record<string, any> = {
        name: name || "",
        position: choirGroup || "",
        time: selectedMass === "other" ? selectedTime : selectedMass,
        date: selectedDate,
        created_at: new Date().toISOString(),
      };

      for (const part of massParts) {
        const colBase = mapping[part.id] || part.id;
        const data = songsData[part.id] || { title: "", lyrics: "" };
        const fileEntries = currentSongFiles[part.id] || [];

        // Only include uploaded files
        const uploadedFiles = fileEntries.filter((f) => f.uploaded && f.url);

        payload[colBase] = data.title || "";
        payload[`${colBase}Lyrics`] = data.lyrics || "";
        payload[`${colBase}Storage`] =
          uploadedFiles.length > 0
            ? JSON.stringify(uploadedFiles.map((f) => f.url))
            : null;
      }

      // Postgres folds unquoted identifiers to lowercase
      const tableName = "lineupinfo";
      const payloadLower: Record<string, any> = {};
      for (const k of Object.keys(payload)) {
        payloadLower[k.toLowerCase()] = payload[k];
      }

      let res;
      if (editingLineup) {
        // Update existing lineup
        res = await supabase
          .from(tableName)
          .update(payloadLower)
          .eq("id", editingLineup.id);
      } else {
        // Insert new lineup
        res = await supabase.from(tableName).insert([payloadLower]);
      }

      if (res.error) {
        console.warn(
          editingLineup ? "update error" : "insert error",
          res.error
        );
        showNotification("Failed to save lineup to database", "error");
      } else {
        showNotification(
          editingLineup
            ? "Lineup updated successfully!"
            : "Lineup saved successfully!",
          "success"
        );

        // Clear form after successful submission
        setTimeout(() => {
          setSongFiles({});
          setSongsData({});
          setSelectedMass("");
          setSelectedTime("");
          setSelectedDate("");
          setEditingLineup(null);
        }, 2000);
      }
    } catch (e) {
      console.warn(e);
      showNotification("Error saving lineup", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="choir-container">
      {/* Notification Toast */}
      {notification && (
        <div
          className={`position-fixed top-0 start-50 translate-middle-x mt-3 alert alert-${
            notification.type === "success"
              ? "success"
              : notification.type === "error"
              ? "danger"
              : "info"
          } alert-dismissible fade show shadow-lg`}
          style={{ zIndex: 9999, minWidth: "300px" }}
          role="alert"
        >
          <div className="d-flex align-items-center">
            <i
              className={`bi ${
                notification.type === "success"
                  ? "bi-check-circle-fill"
                  : notification.type === "error"
                  ? "bi-exclamation-triangle-fill"
                  : "bi-info-circle-fill"
              } me-2`}
            ></i>
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={() => setNotification(null)}
            aria-label="Close"
          ></button>
        </div>
      )}

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
                      <h5 className="mb-0">
                        {editingLineup ? (
                          <>
                            <i className="bi bi-pencil-square text-warning me-2"></i>
                            Editing Lineup
                          </>
                        ) : (
                          "Mass Song Selection"
                        )}
                      </h5>
                      <div className="text-muted small">
                        {editingLineup
                          ? `Mass on ${new Date(
                              editingLineup.date
                            ).toLocaleDateString()}`
                          : "Plan your choir's lineup"}
                      </div>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-3 ms-auto flex-wrap">
                    <button
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => {
                        setShowLineups(true);
                        fetchLineups();
                      }}
                    >
                      <i className="bi bi-list-ul me-2"></i>
                      View Lineups
                    </button>

                    <div className="d-flex align-items-center">
                      <select
                        className="form-select form-select-sm choir-select"
                        value={selectedMass}
                        onChange={(e) => setSelectedMass(e.target.value)}
                        required
                      >
                        <option value="">Select Mass Schedule *</option>
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
                          value={selectedTime}
                          onChange={(e) => setSelectedTime(e.target.value)}
                          required
                        />
                      )}

                      <input
                        type="date"
                        className="form-control form-control-sm ms-2"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        required
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
                              placeholder="Enter song title *"
                              value={songsData[part.id]?.title || ""}
                              onChange={(e) =>
                                updateSongField(
                                  part.id,
                                  "title",
                                  e.target.value
                                )
                              }
                              disabled={submitting}
                            />
                            <textarea
                              className="form-control mb-2"
                              rows={2}
                              placeholder="Additional notes (optional)"
                              value={songsData[part.id]?.lyrics || ""}
                              onChange={(e) =>
                                updateSongField(
                                  part.id,
                                  "lyrics",
                                  e.target.value
                                )
                              }
                              disabled={submitting}
                            ></textarea>

                            <div className="file-section">
                              {songFiles[part.id] &&
                              songFiles[part.id].length > 0 ? (
                                <div className="d-flex flex-column gap-2">
                                  {songFiles[part.id].map((fileObj, index) => (
                                    <div
                                      key={index}
                                      className="d-flex align-items-center gap-2 border rounded p-2 bg-light"
                                    >
                                      {fileObj.uploading ? (
                                        <>
                                          <div
                                            className="spinner-border spinner-border-sm text-primary"
                                            role="status"
                                          >
                                            <span className="visually-hidden">
                                              Uploading...
                                            </span>
                                          </div>
                                          <small className="text-muted">
                                            Uploading {fileObj.file.name}...
                                          </small>
                                        </>
                                      ) : (
                                        <>
                                          <i
                                            className={`bi ${
                                              fileObj.file.type.includes("pdf")
                                                ? "bi-file-pdf"
                                                : "bi-file-word"
                                            } ${
                                              fileObj.uploaded
                                                ? "text-success"
                                                : "text-secondary"
                                            }`}
                                          ></i>
                                          <small className="text-truncate flex-grow-1">
                                            {fileObj.file.name}
                                            {fileObj.uploaded && (
                                              <i
                                                className="bi bi-check-circle-fill text-success ms-1"
                                                title="Uploaded"
                                              ></i>
                                            )}
                                          </small>
                                          <div className="btn-group btn-group-sm">
                                            {fileObj.uploaded &&
                                              fileObj.url && (
                                                <a
                                                  href={fileObj.url}
                                                  target="_blank"
                                                  className="btn btn-outline-primary btn-sm"
                                                  rel="noopener noreferrer"
                                                >
                                                  <i className="bi bi-eye"></i>
                                                </a>
                                              )}
                                            <button
                                              type="button"
                                              className="btn btn-outline-danger btn-sm"
                                              onClick={() =>
                                                removeFile(part.id, index)
                                              }
                                              disabled={submitting}
                                            >
                                              <i className="bi bi-x"></i>
                                            </button>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  ))}
                                  {/* Add more files button */}
                                  <div
                                    className="file-drop-zone"
                                    style={{
                                      padding: "0.5rem",
                                      cursor: submitting
                                        ? "not-allowed"
                                        : "pointer",
                                      opacity: submitting ? 0.5 : 1,
                                    }}
                                    onClick={() =>
                                      !submitting &&
                                      document
                                        .getElementById(`file-${part.id}`)
                                        ?.click()
                                    }
                                  >
                                    <div
                                      className="drop-message"
                                      style={{ fontSize: "0.85rem" }}
                                    >
                                      <i className="bi bi-plus-circle me-2"></i>
                                      Add more files
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  className={`file-drop-zone ${
                                    dragActive === part.id ? "dragging" : ""
                                  }`}
                                  style={{
                                    cursor: submitting
                                      ? "not-allowed"
                                      : "pointer",
                                    opacity: submitting ? 0.5 : 1,
                                  }}
                                  onDragEnter={(e) =>
                                    !submitting && handleDrag(e, part.id)
                                  }
                                  onDragOver={(e) =>
                                    !submitting && handleDrag(e, part.id)
                                  }
                                  onDragLeave={(e) =>
                                    !submitting && handleDrag(e, part.id)
                                  }
                                  onDrop={(e) =>
                                    !submitting && handleDrop(e, part.id)
                                  }
                                  onClick={() =>
                                    !submitting &&
                                    document
                                      .getElementById(`file-${part.id}`)
                                      ?.click()
                                  }
                                >
                                  <div className="drop-message">
                                    <i className="bi bi-cloud-upload me-2"></i>
                                    Drop files here or click to upload
                                  </div>
                                </div>
                              )}
                              <input
                                id={`file-${part.id}`}
                                type="file"
                                className="d-none"
                                accept=".pdf,.doc,.docx"
                                multiple
                                disabled={submitting}
                                onChange={(e) => handleFileChange(part.id, e)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center mt-4 pt-4 border-top">
                <button
                  className="btn btn-primary px-4"
                  onClick={() => handleSubmit()}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Uploading & Saving...
                    </>
                  ) : editingLineup ? (
                    <>
                      <i className="bi bi-pencil me-2"></i>
                      Update Lineup
                    </>
                  ) : (
                    "Submit Lineup"
                  )}
                </button>
                <div className="d-flex gap-2">
                  {editingLineup && (
                    <button
                      className="btn btn-outline-warning"
                      onClick={() => {
                        setSongFiles({});
                        setSongsData({});
                        setSelectedMass("");
                        setSelectedTime("");
                        setSelectedDate("");
                        setEditingLineup(null);
                        showNotification("Edit cancelled", "info");
                      }}
                      disabled={submitting}
                    >
                      <i className="bi bi-x-circle me-2"></i>
                      Cancel Edit
                    </button>
                  )}
                  <Link to="/" className="btn btn-outline-secondary">
                    Back
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lineups Modal */}
      {showLineups && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-calendar-event me-2"></i>
                  Your Lineups
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowLineups(false)}
                ></button>
              </div>
              <div className="modal-body">
                {loadingLineups ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3 text-muted">Loading your lineups...</p>
                  </div>
                ) : lineupsError ? (
                  <div className="alert alert-danger" role="alert">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    <strong>Error:</strong> {lineupsError}
                    <hr />
                    <small>
                      Please check the browser console for more details. Make
                      sure the 'lineupinfo' table exists in your Supabase
                      database.
                    </small>
                  </div>
                ) : lineups.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="bi bi-inbox fs-1 text-muted"></i>
                    <p className="mt-3 text-muted">No lineups found</p>
                    <small className="text-muted">
                      Your submitted lineups will appear here
                    </small>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead className="table-light">
                        <tr>
                          <th>Date</th>
                          <th>Mass Schedule</th>
                          <th>Songs</th>
                          <th>Created</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lineups.map((lineup) => {
                          const canEdit = canEditLineup(lineup.date);
                          const songCount = [
                            lineup.procesional,
                            lineup.kyrie,
                            lineup.gloria,
                            lineup.psalm,
                            lineup.alleluia,
                            lineup.offertorium,
                            lineup.mysteriumfidei,
                            lineup.amen,
                            lineup.agnusdei,
                            lineup.paternoster,
                            lineup.recession,
                          ].filter(Boolean).length;

                          return (
                            <tr key={lineup.id}>
                              <td>
                                <strong>
                                  {new Date(lineup.date).toLocaleDateString(
                                    "en-US",
                                    {
                                      weekday: "short",
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    }
                                  )}
                                </strong>
                              </td>
                              <td>
                                <i className="bi bi-clock me-2 text-primary"></i>
                                {lineup.time}
                              </td>
                              <td>
                                <span className="badge bg-info">
                                  {songCount} song{songCount !== 1 ? "s" : ""}
                                </span>
                              </td>
                              <td className="text-muted small">
                                {new Date(lineup.created_at).toLocaleDateString(
                                  "en-US"
                                )}
                              </td>
                              <td>
                                {canEdit ? (
                                  <button
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => loadLineupForEdit(lineup)}
                                  >
                                    <i className="bi bi-pencil me-1"></i>
                                    Edit
                                  </button>
                                ) : (
                                  <button
                                    className="btn btn-sm btn-outline-secondary"
                                    disabled
                                    title="Cannot edit within 24 hours of mass"
                                  >
                                    <i className="bi bi-lock me-1"></i>
                                    Locked
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowLineups(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Choir;
