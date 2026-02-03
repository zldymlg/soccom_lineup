import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { useNavigate } from "react-router-dom";
import Files from "./Files";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./Admin.css";

interface UserAccount {
  id: number;
  NAME?: string | null;
  POSITION?: string | null;
  EMAIL?: string | null;
  PROFILE?: string | null;
  created_at?: string | null;
}

interface Announcement {
  id: number;
  title: string;
  content: string;
  created_by: string;
  created_at: string;
  is_active: boolean;
}

const lineupEditParts = [
  { key: "procesional", label: "Processional" },
  { key: "kyrie", label: "Kyrie" },
  { key: "gloria", label: "Gloria" },
  { key: "psalm", label: "Responsorial Psalm" },
  { key: "alleluia", label: "Alleluia" },
  { key: "offertorium", label: "Offertory" },
  { key: "mysteriumfidei", label: "Sanctus" },
  { key: "amen", label: "Amen" },
  { key: "agnusdei", label: "Agnus Dei" },
  { key: "communion", label: "Communion" },
  { key: "paternoster", label: "Pater Noster (Sapagkat)" },
  { key: "recession", label: "Recessional" },
];

const isAccountLineup = (lineup: any) =>
  Boolean(
    lineup &&
    (lineup.NAME !== undefined ||
      lineup.POSITION !== undefined ||
      lineup.EMAIL !== undefined),
  );

const getStorageUrls = (value: any): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
      if (typeof parsed === "string" && parsed) return [parsed];
    } catch {
      if (value.trim()) return [value];
    }
  }
  return [];
};

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    "accounts" | "lineups" | "announcements" | "files"
  >("accounts");
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  // Announcements
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [announcementSubmitting, setAnnouncementSubmitting] = useState(false);
  const [announcementMediaFiles, setAnnouncementMediaFiles] = useState<File[]>(
    [],
  );
  const [announcementMediaUrls, setAnnouncementMediaUrls] = useState<string[]>(
    [],
  );
  const [announcementDragActive, setAnnouncementDragActive] = useState(false);

  // Form fields
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPosition, setFormPosition] = useState("member");
  const [formPassword, setFormPassword] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formDepartment, setFormDepartment] = useState("");
  const [formProfileFile, setFormProfileFile] = useState<File | null>(null);
  const [formProfilePreview, setFormProfilePreview] = useState<string | null>(
    null,
  );
  const [uploading, setUploading] = useState(false);

  // Search and filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPosition, setFilterPosition] = useState("all");

  // Lineups
  const [lineups, setLineups] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [lineupsLoading, setLineupsLoading] = useState(false);
  const [editingLineup, setEditingLineup] = useState<any | null>(null);
  const [showLineupEditModal, setShowLineupEditModal] = useState(false);
  const [lineupEditStatus, setLineupEditStatus] = useState("");
  const [lineupEditForm, setLineupEditForm] = useState<Record<
    string,
    any
  > | null>(null);
  const [lineupEditLoading, setLineupEditLoading] = useState(false);

  // Admin verification
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          navigate("/");
          return;
        }

        // Check if user is admin/soccom - try both table names
        let userResult = await supabase
          .from("LINEUP")
          .select("POSITION")
          .eq("EMAIL", user.email)
          .maybeSingle();

        if (userResult.error && userResult.error.code === "42P01") {
          userResult = await supabase
            .from("lineup")
            .select("position")
            .eq("email", user.email)
            .maybeSingle();
        }

        if (userResult.error) {
          console.error("Error checking admin status:", userResult.error);
          navigate("/");
          return;
        }

        const userRow = userResult.data;
        const position =
          userRow && (userRow.POSITION || (userRow as any).position)
            ? String(
                userRow.POSITION || (userRow as any).position,
              ).toLowerCase()
            : "";

        if (position !== "soccom" && position !== "admin") {
          navigate("/soccom");
          return;
        }

        fetchUsers();
        fetchAnnouncements();
        fetchLineups();
      } catch (error: any) {
        console.error("Admin check error:", error);
        navigate("/");
      }
    };
    checkAdmin();
  }, [navigate]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Try LINEUP first (uppercase)
      const upperUserColumns =
        "id,NAME,POSITION,EMAIL,PROFILE,PHONE,DEPARTMENT,CREATED_AT";
      const lowerUserColumns =
        "id,NAME,POSITION,EMAIL,PROFILE,PHONE,DEPARTMENT,created_at";

      let result: any = await supabase
        .from("LINEUP")
        .select(upperUserColumns)
        .not("EMAIL", "is", null)
        .order("id", { ascending: false })
        .limit(200);

      // If LINEUP doesn't exist, try lowercase
      if (result.error && result.error.code === "42P01") {
        result = await supabase
          .from("lineup")
          .select(lowerUserColumns)
          .not("email", "is", null)
          .order("created_at", { ascending: false })
          .limit(200);
      }

      if (result.error) throw result.error;
      setUsers(result.data || []);
    } catch (error: any) {
      showMessage("Failed to load users: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    setAnnouncementsLoading(true);
    try {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

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

  const fetchLineups = async () => {
    setLineupsLoading(true);
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const dateStr = thirtyDaysAgo.toISOString().split("T")[0];
      const orFilter = `scheduled_at.gte.${thirtyDaysAgo.toISOString()},date.gte.${dateStr}`;

      const res = await supabase
        .from("LINEUP")
        .select("id,NAME,POSITION,EMAIL,PROFILE,date,time,scheduled_at,status")
        .or(orFilter)
        .order("scheduled_at", { ascending: true })
        .limit(200);

      if (res.error) {
        console.warn("Error fetching lineups:", res.error);
        setLineups([]);
      } else {
        setLineups((res as any).data || []);
      }

      // Fetch submissions
      const subRes = await supabase
        .from("lineupinfo")
        .select("id,name,position,created_at,date,time")
        .order("created_at", { ascending: false })
        .limit(50);

      if (subRes.error) {
        console.warn("Error fetching submissions:", subRes.error);
        setSubmissions([]);
      } else {
        const submissionsData = (subRes as any).data || [];
        const enrichedSubmissions = await Promise.all(
          submissionsData.map(async (submission: any) => {
            try {
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
              // ignore
            }
            return submission;
          }),
        );
        setSubmissions(enrichedSubmissions);
      }
    } catch (e) {
      console.error("Error loading lineups:", e);
      setLineups([]);
      setSubmissions([]);
    } finally {
      setLineupsLoading(false);
    }
  };

  const closeLineupEditModal = () => {
    setShowLineupEditModal(false);
    setEditingLineup(null);
    setLineupEditForm(null);
    setLineupEditStatus("");
    setLineupEditLoading(false);
  };

  const openLineupEditModal = async (lineup: any, status: string) => {
    setEditingLineup(lineup);
    setLineupEditStatus(status);
    setShowLineupEditModal(true);
    setLineupEditLoading(true);

    try {
      if (isAccountLineup(lineup)) {
        setLineupEditForm({
          name: lineup.NAME || lineup.name || "",
          position: lineup.POSITION || lineup.position || "",
          date: lineup.DATE || lineup.date || "",
          time: lineup.TIME || lineup.time || "",
        });
        return;
      }

      const { data, error } = await supabase
        .from("lineupinfo")
        .select("*")
        .eq("id", lineup.id)
        .maybeSingle();

      if (error) throw error;

      const row = data || lineup;
      setEditingLineup(row);
      const form: Record<string, any> = {
        name: row.name || "",
        position: row.position || "",
        date: row.date || "",
        time: row.time || "",
      };

      for (const part of lineupEditParts) {
        form[part.key] = row[part.key] || "";
        form[`${part.key}lyrics`] = row[`${part.key}lyrics`] || "";
        form[`${part.key}storage`] = row[`${part.key}storage`] || null;
      }

      setLineupEditForm(form);
    } catch (e: any) {
      showMessage("Failed to load lineup: " + e.message, "error");
      setLineupEditForm(null);
    } finally {
      setLineupEditLoading(false);
    }
  };

  const updateLineupEditField = (field: string, value: string) => {
    setLineupEditForm((prev) => ({
      ...(prev || {}),
      [field]: value,
    }));
  };

  const uploadAnnouncementMedia = async (files: File[]): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of files) {
      try {
        const fileExt = file.name.split(".").pop();
        const fileName = `announcement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const path = `announcements/${fileName}`;

        const { error } = await supabase.storage
          .from("PDF")
          .upload(path, file, { upsert: false });

        if (error) throw error;

        const { data } = supabase.storage.from("PDF").getPublicUrl(path);
        if (data?.publicUrl) {
          urls.push(data.publicUrl);
        }
      } catch (e: any) {
        console.warn("Failed to upload announcement media:", e);
      }
    }
    return urls;
  };

  const handleAddAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementContent.trim()) {
      showMessage("Please fill in both title and content", "error");
      return;
    }

    try {
      setAnnouncementSubmitting(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Upload media files if any
      let mediaUrls = announcementMediaUrls;
      if (announcementMediaFiles.length > 0) {
        mediaUrls = await uploadAnnouncementMedia(announcementMediaFiles);
      }

      const { error } = await supabase.from("announcements").insert([
        {
          title: announcementTitle,
          content: announcementContent,
          created_by: user?.email || "Unknown",
          media_urls: mediaUrls.length > 0 ? JSON.stringify(mediaUrls) : null,
          is_active: true,
        },
      ]);

      if (error) throw error;

      showMessage("Announcement created successfully!", "success");
      setAnnouncementTitle("");
      setAnnouncementContent("");
      setAnnouncementMediaFiles([]);
      setAnnouncementMediaUrls([]);
      setShowAnnouncementModal(false);
      fetchAnnouncements();
    } catch (error: any) {
      showMessage("Failed to create announcement: " + error.message, "error");
    } finally {
      setAnnouncementSubmitting(false);
    }
  };

  const handleDeleteAnnouncement = async (announcementId: number) => {
    if (!window.confirm("Are you sure you want to delete this announcement?"))
      return;

    try {
      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", announcementId);

      if (error) throw error;

      showMessage("Announcement deleted successfully!", "success");
      fetchAnnouncements();
    } catch (error: any) {
      showMessage("Failed to delete announcement: " + error.message, "error");
    }
  };

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleProfileUpload = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random()
        .toString(36)
        .substring(7)}.${fileExt}`;
      const filePath = `profiles/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("profiles")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("profiles")
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error: any) {
      showMessage(
        "Failed to upload profile picture: " + error.message,
        "error",
      );
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!formName || !formEmail || !formPassword) {
      showMessage("Please fill in all required fields", "error");
      return;
    }

    if (!formProfileFile) {
      showMessage("Please upload a profile picture", "error");
      return;
    }

    try {
      setUploading(true);

      // Upload profile picture - REQUIRED
      const profileUrl = await handleProfileUpload(formProfileFile);

      if (!profileUrl) {
        showMessage(
          "Failed to upload profile picture. Please try again.",
          "error",
        );
        setUploading(false);
        return;
      }

      // Create auth user in Supabase Authentication using signUp
      const { error: authError } = await supabase.auth.signUp({
        email: formEmail,
        password: formPassword,
      });

      if (authError) {
        // If auth user already exists or other error, log but continue
        if (!authError.message.includes("already registered")) {
          console.warn("Auth creation warning:", authError.message);
        }
      }

      // Try LINEUP first, then lowercase
      let insertResult = await supabase.from("LINEUP").insert({
        NAME: formName,
        EMAIL: formEmail,
        POSITION: formPosition,
        PROFILE: profileUrl,
        PHONE: formPhone || null,
        DEPARTMENT: formDepartment || null,
      });

      if (insertResult.error && insertResult.error.code === "42P01") {
        insertResult = await supabase.from("lineup").insert({
          name: formName,
          email: formEmail,
          position: formPosition,
          profile: profileUrl,
          phone: formPhone || null,
          department: formDepartment || null,
        });
      }

      if (insertResult.error) throw insertResult.error;

      showMessage("User created successfully with auth account!", "success");
      resetForm();
      setShowCreateModal(false);
      fetchUsers();
    } catch (error: any) {
      showMessage("Failed to create user: " + error.message, "error");
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser || !formName || !formEmail) {
      showMessage("Please fill in all required fields", "error");
      return;
    }

    try {
      setUploading(true);

      // Upload new profile picture if provided
      let profileUrl = editingUser.PROFILE;
      if (formProfileFile) {
        const newUrl = await handleProfileUpload(formProfileFile);
        if (!newUrl) {
          showMessage(
            "Failed to upload profile picture. Please try again.",
            "error",
          );
          setUploading(false);
          return;
        }
        profileUrl = newUrl;
      }

      // Ensure user has a profile picture
      if (!profileUrl) {
        showMessage(
          "User must have a profile picture. Please upload one.",
          "error",
        );
        setUploading(false);
        return;
      }

      // Try LINEUP first, then lowercase
      let updateResult = await supabase
        .from("LINEUP")
        .update({
          NAME: formName,
          EMAIL: formEmail,
          POSITION: formPosition,
          PROFILE: profileUrl,
          PHONE: formPhone || null,
          DEPARTMENT: formDepartment || null,
        })
        .eq("id", editingUser.id);

      if (updateResult.error && updateResult.error.code === "42P01") {
        updateResult = await supabase
          .from("lineup")
          .update({
            name: formName,
            email: formEmail,
            position: formPosition,
            profile: profileUrl,
            phone: formPhone || null,
            department: formDepartment || null,
          })
          .eq("id", editingUser.id);
      }

      if (updateResult.error) throw updateResult.error;

      showMessage("User updated successfully!", "success");
      resetForm();
      setShowEditModal(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      showMessage("Failed to update user: " + error.message, "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      // Try LINEUP first, then lowercase
      let deleteResult = await supabase
        .from("LINEUP")
        .delete()
        .eq("id", userId);

      if (deleteResult.error && deleteResult.error.code === "42P01") {
        deleteResult = await supabase.from("lineup").delete().eq("id", userId);
      }

      if (deleteResult.error) throw deleteResult.error;

      showMessage("User deleted successfully!", "success");
      fetchUsers();
    } catch (error: any) {
      showMessage("Failed to delete user: " + error.message, "error");
    }
  };

  // Filter and search users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      !searchQuery ||
      user.NAME?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.EMAIL?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user as any).PHONE?.includes(searchQuery) ||
      (user as any).DEPARTMENT?.toLowerCase().includes(
        searchQuery.toLowerCase(),
      );

    const matchesPosition =
      filterPosition === "all" ||
      user.POSITION?.toLowerCase() === filterPosition.toLowerCase();

    return matchesSearch && matchesPosition;
  });

  const openEditModal = (user: UserAccount) => {
    setEditingUser(user);
    setFormName(user.NAME || "");
    setFormEmail(user.EMAIL || "");
    setFormPosition(user.POSITION || "member");
    setFormPhone((user as any).PHONE || "");
    setFormDepartment((user as any).DEPARTMENT || "");
    setFormProfilePreview(user.PROFILE || null);
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormName("");
    setFormEmail("");
    setFormPosition("member");
    setFormPassword("");
    setFormPhone("");
    setFormDepartment("");
    setFormProfileFile(null);
    setFormProfilePreview(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormProfileFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormProfilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-header">
        <div className="container-fluid">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h4 className="mb-0">Admin Panel</h4>
              <p className="text-muted small mb-0">
                Manage user accounts and settings
              </p>
            </div>
            <div className="d-flex gap-2">
              {activeTab === "accounts" && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    resetForm();
                    setShowCreateModal(true);
                  }}
                >
                  <i className="bi bi-plus-circle me-2"></i>Create User
                </button>
              )}
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => handleLogout()}
              >
                <i className="bi bi-box-arrow-right me-2"></i>Logout
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <ul className="nav nav-tabs" role="tablist">
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === "accounts" ? "active" : ""}`}
                onClick={() => setActiveTab("accounts")}
                type="button"
                role="tab"
                aria-selected={activeTab === "accounts"}
              >
                <i className="bi bi-people-fill me-2"></i>Accounts
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === "lineups" ? "active" : ""}`}
                onClick={() => setActiveTab("lineups")}
                type="button"
                role="tab"
                aria-selected={activeTab === "lineups"}
              >
                <i className="bi bi-file-earmark-music me-2"></i>Lineups
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === "announcements" ? "active" : ""}`}
                onClick={() => setActiveTab("announcements")}
                type="button"
                role="tab"
                aria-selected={activeTab === "announcements"}
              >
                <i className="bi bi-megaphone-fill me-2"></i>Announcements
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === "files" ? "active" : ""}`}
                onClick={() => setActiveTab("files")}
                type="button"
                role="tab"
                aria-selected={activeTab === "files"}
              >
                <i className="bi bi-folder2-open me-2"></i>Files
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Message Alert */}
      {message && (
        <div className="container-fluid mt-3">
          <div
            className={`alert alert-${
              message.type === "success" ? "success" : "danger"
            } alert-dismissible fade show`}
          >
            {message.text}
            <button
              type="button"
              className="btn-close"
              onClick={() => setMessage(null)}
            ></button>
          </div>
        </div>
      )}

      {/* Accounts Tab Content */}
      {activeTab === "accounts" && (
        <div className="container-fluid mt-4">
          <div className="card">
            <div className="card-header bg-white">
              <div className="row align-items-center mb-3">
                <div className="col">
                  <h5 className="mb-0">
                    User Accounts ({filteredUsers.length})
                  </h5>
                </div>
              </div>
              <div className="row g-2">
                <div className="col-md-6">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Search by name, email, phone, or department..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="col-md-4">
                  <select
                    className="form-select form-select-sm"
                    value={filterPosition}
                    onChange={(e) => setFilterPosition(e.target.value)}
                  >
                    <option value="all">All Positions</option>
                    <option value="member">Member</option>
                    <option value="choir">Choir</option>
                    <option value="soccom">Soccom</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <button
                    className="btn btn-sm btn-outline-secondary w-100"
                    onClick={() => {
                      setSearchQuery("");
                      setFilterPosition("all");
                    }}
                  >
                    <i className="bi bi-funnel me-1"></i>Clear
                  </button>
                </div>
              </div>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover table-sm">
                    <thead>
                      <tr>
                        <th style={{ width: "50px" }}>Profile</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Position</th>
                        <th>Position</th>
                        <th style={{ width: "80px" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="text-center py-4 text-muted"
                          >
                            No users found
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => (
                          <tr key={user.id}>
                            <td>
                              <div className="user-profile-img">
                                {user.PROFILE ? (
                                  <img
                                    src={user.PROFILE}
                                    alt={user.NAME || "User"}
                                  />
                                ) : (
                                  <div className="profile-placeholder">
                                    <i className="bi bi-person-circle"></i>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td>
                              <strong>{user.NAME || "-"}</strong>
                            </td>
                            <td>
                              <small>{user.EMAIL || "-"}</small>
                            </td>
                            <td>
                              <small>{(user as any).PHONE || "-"}</small>
                            </td>
                            <td>
                              <small>{(user as any).DEPARTMENT || "-"}</small>
                            </td>
                            <td>
                              <span
                                className={`badge bg-${
                                  user.POSITION?.toLowerCase() === "soccom"
                                    ? "primary"
                                    : user.POSITION?.toLowerCase() === "choir"
                                      ? "success"
                                      : user.POSITION?.toLowerCase() === "admin"
                                        ? "danger"
                                        : "secondary"
                                }`}
                              >
                                {user.POSITION || "member"}
                              </span>
                            </td>
                            <td>
                              <div className="btn-group btn-group-sm">
                                <button
                                  className="btn btn-outline-primary"
                                  onClick={() => openEditModal(user)}
                                  title="Edit user"
                                >
                                  <i className="bi bi-pencil"></i>
                                </button>
                                <button
                                  className="btn btn-outline-danger"
                                  onClick={() => handleDeleteUser(user.id)}
                                  title="Delete user"
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "files" && (
        <div className="container-fluid mt-4">
          <div className="card">
            <div className="card-body">
              <Files embed />
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}

      {/* Lineups Tab Content */}
      {activeTab === "lineups" && (
        <div className="container-fluid mt-4">
          <div className="card">
            <div className="card-header bg-light">
              <h5 className="mb-0">
                <i className="bi bi-file-earmark-music me-2"></i>
                All Lineups & Submissions
              </h5>
            </div>
            <div className="card-body">
              {lineupsLoading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <div className="row g-4 dashboard-grid">
                  {lineups.map((lineup) => {
                    const serveName = lineup.NAME || "(No name)";
                    const servePosition = lineup.POSITION || "";
                    const serveDate =
                      lineup.date ||
                      (lineup.scheduled_at
                        ? new Date(lineup.scheduled_at)
                            .toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })
                            .toLowerCase()
                        : "-");
                    const serveTime =
                      lineup.time ||
                      (lineup.scheduled_at
                        ? new Date(lineup.scheduled_at)
                            .toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                            .toLowerCase()
                        : "-");
                    const profileImg = lineup.PROFILE || lineup.profile || null;
                    const status = (lineup.status || "pending").toLowerCase();
                    const badgeClass =
                      status === "approved"
                        ? "bg-success"
                        : status === "completed"
                          ? "bg-primary text-white"
                          : "bg-warning text-dark";

                    return (
                      <div
                        key={`lineup-${lineup.id}`}
                        className="col-12 col-sm-6 col-md-4 col-lg-3"
                      >
                        <div className="card card-dashboard h-100 shadow-sm">
                          {profileImg && (
                            <img
                              src={profileImg}
                              alt={serveName}
                              className="card-img-top"
                              style={{
                                height: "200px",
                                objectFit: "cover",
                              }}
                            />
                          )}
                          <div className="card-body d-flex flex-column">
                            <div className="d-flex justify-content-between mb-3">
                              <div className="d-flex gap-3 flex-grow-1">
                                <div className="icon-circle">
                                  <i className="bi bi-music-note-list" />
                                </div>
                                <div className="flex-grow-1">
                                  <h6 className="card-title mb-1">
                                    {serveName}
                                  </h6>
                                  <div className="small text-muted">
                                    {servePosition}
                                  </div>
                                </div>
                              </div>
                              <div className={`status-badge ${badgeClass}`}>
                                {status}
                              </div>
                            </div>

                            <div className="mt-auto">
                              <div className="mb-3">
                                <div className="serve-date">
                                  <div>
                                    <strong>{serveTime}</strong>
                                  </div>
                                  <div className="small text-muted">
                                    {serveDate}
                                  </div>
                                </div>
                              </div>
                              <button
                                className="btn btn-primary btn-sm w-100"
                                onClick={() =>
                                  openLineupEditModal(lineup, status)
                                }
                              >
                                <i className="bi bi-pencil me-1"></i>Edit
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {submissions.map((sub) => {
                    const profileImg = sub.profile || sub.PROFILE || null;
                    const subStatus = "submitted";
                    const badgeClass = "bg-info";

                    return (
                      <div
                        key={`sub-${sub.id}`}
                        className="col-12 col-sm-6 col-md-4 col-lg-3"
                      >
                        <div className="card card-dashboard h-100 shadow-sm">
                          {profileImg && (
                            <img
                              src={profileImg}
                              alt={sub.name || "User"}
                              className="card-img-top"
                              style={{
                                height: "200px",
                                objectFit: "cover",
                              }}
                            />
                          )}
                          <div className="card-body d-flex flex-column">
                            <div className="d-flex justify-content-between mb-3">
                              <div className="d-flex gap-3 flex-grow-1">
                                <div className="icon-circle">
                                  <i className="bi bi-file-earmark-music" />
                                </div>
                                <div className="flex-grow-1">
                                  <h6 className="card-title mb-1">
                                    {sub.name || "(No name)"}
                                  </h6>
                                  <div className="small text-muted">
                                    {sub.position || ""}
                                  </div>
                                </div>
                              </div>
                              <div className={`status-badge ${badgeClass}`}>
                                {subStatus}
                              </div>
                            </div>

                            <div className="mt-auto">
                              <div className="mb-3">
                                <div className="serve-date">
                                  <div>
                                    <strong>{sub.time || "-"}</strong>
                                  </div>
                                  <div className="small text-muted">
                                    {sub.date || "-"}
                                  </div>
                                </div>
                              </div>
                              <button
                                className="btn btn-primary btn-sm w-100"
                                onClick={() =>
                                  openLineupEditModal(sub, "submitted")
                                }
                              >
                                <i className="bi bi-pencil me-1"></i>View
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab Content */}
      {/* Lineup Edit Modal */}
      {showLineupEditModal && editingLineup && (
        <div
          className="modal d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={closeLineupEditModal}
        >
          <div
            className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Lineup</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeLineupEditModal}
                ></button>
              </div>
              <div className="modal-body">
                {lineupEditLoading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-3">
                      <label className="form-label">Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={lineupEditForm?.name || ""}
                        onChange={(e) =>
                          updateLineupEditField("name", e.target.value)
                        }
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Position</label>
                      <input
                        type="text"
                        className="form-control"
                        value={lineupEditForm?.position || ""}
                        onChange={(e) =>
                          updateLineupEditField("position", e.target.value)
                        }
                      />
                    </div>

                    {isAccountLineup(editingLineup) ? (
                      <div className="mb-3">
                        <label className="form-label">Status</label>
                        <select
                          className="form-select"
                          value={lineupEditStatus}
                          onChange={(e) => setLineupEditStatus(e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                    ) : (
                      <>
                        <div className="row g-3">
                          <div className="col-12 col-md-6">
                            <label className="form-label">Date</label>
                            <input
                              type="date"
                              className="form-control"
                              value={lineupEditForm?.date || ""}
                              onChange={(e) =>
                                updateLineupEditField("date", e.target.value)
                              }
                            />
                          </div>
                          <div className="col-12 col-md-6">
                            <label className="form-label">Time</label>
                            <input
                              type="time"
                              className="form-control"
                              value={lineupEditForm?.time || ""}
                              onChange={(e) =>
                                updateLineupEditField("time", e.target.value)
                              }
                            />
                          </div>
                        </div>

                        <hr className="my-4" />
                        <h6 className="mb-3">Lineup Details</h6>
                        <div className="row g-3">
                          {lineupEditParts.map((part) => (
                            <div key={part.key} className="col-12 col-lg-6">
                              <label className="form-label">{part.label}</label>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Song title"
                                value={lineupEditForm?.[part.key] || ""}
                                onChange={(e) =>
                                  updateLineupEditField(
                                    part.key,
                                    e.target.value,
                                  )
                                }
                              />
                              <textarea
                                className="form-control mt-2"
                                rows={3}
                                placeholder="Lyrics"
                                value={
                                  lineupEditForm?.[`${part.key}lyrics`] || ""
                                }
                                onChange={(e) =>
                                  updateLineupEditField(
                                    `${part.key}lyrics`,
                                    e.target.value,
                                  )
                                }
                              />
                              {getStorageUrls(
                                lineupEditForm?.[`${part.key}storage`],
                              ).length > 0 && (
                                <div className="mt-2 small">
                                  <div className="fw-semibold">Files</div>
                                  <ul className="list-unstyled mb-0">
                                    {getStorageUrls(
                                      lineupEditForm?.[`${part.key}storage`],
                                    ).map((url: string, idx: number) => (
                                      <li key={`${part.key}-file-${idx}`}>
                                        <a
                                          href={url}
                                          target="_blank"
                                          rel="noreferrer"
                                        >
                                          Open file {idx + 1}
                                        </a>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeLineupEditModal}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={async () => {
                    try {
                      // Check if it's a lineup (from LINEUP table) or submission (from lineupinfo table)
                      const isLineup = isAccountLineup(editingLineup);
                      if (isLineup) {
                        const { error } = await supabase
                          .from("LINEUP")
                          .update({
                            NAME: lineupEditForm?.name || "",
                            POSITION: lineupEditForm?.position || "",
                            STATUS: lineupEditStatus,
                          })
                          .eq("id", editingLineup.id);
                        if (error) throw error;
                        showMessage("Lineup updated successfully!", "success");
                      } else {
                        if (!lineupEditForm) {
                          showMessage("No changes to save.", "error");
                          return;
                        }

                        const payload: Record<string, any> = {
                          name: lineupEditForm.name || "",
                          position: lineupEditForm.position || "",
                          date: lineupEditForm.date || null,
                          time: lineupEditForm.time || null,
                        };

                        for (const part of lineupEditParts) {
                          payload[part.key] = lineupEditForm[part.key] || "";
                          payload[`${part.key}lyrics`] =
                            lineupEditForm[`${part.key}lyrics`] || "";
                        }

                        const { error } = await supabase
                          .from("lineupinfo")
                          .update(payload)
                          .eq("id", editingLineup.id);
                        if (error) throw error;
                        showMessage("Lineup updated successfully!", "success");
                      }
                      closeLineupEditModal();
                      fetchLineups();
                    } catch (e: any) {
                      showMessage("Failed to update: " + e.message, "error");
                    }
                  }}
                >
                  {isAccountLineup(editingLineup) ? "Save Changes" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "announcements" && (
        <div className="container-fluid mt-4">
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-header bg-light d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <i className="bi bi-megaphone-fill me-2"></i>
                    Announcements
                  </h5>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setAnnouncementTitle("");
                      setAnnouncementContent("");
                      setShowAnnouncementModal(true);
                    }}
                  >
                    <i className="bi bi-plus-circle me-2"></i>
                    Add Announcement
                  </button>
                </div>
                <div className="card-body">
                  {announcementsLoading ? (
                    <div className="text-center py-5">
                      <div
                        className="spinner-border text-primary"
                        role="status"
                      >
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : announcements.length === 0 ? (
                    <div className="text-center py-5">
                      <i className="bi bi-inbox fs-1 text-muted"></i>
                      <p className="text-muted mt-3">No announcements yet</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Title</th>
                            <th>Content</th>
                            <th>Created By</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {announcements.map((announcement) => (
                            <tr key={announcement.id}>
                              <td>
                                <strong>{announcement.title}</strong>
                              </td>
                              <td>
                                <small
                                  className="text-truncate"
                                  style={{ maxWidth: "300px" }}
                                >
                                  {announcement.content}
                                </small>
                              </td>
                              <td>
                                <small>{announcement.created_by}</small>
                              </td>
                              <td>
                                <small>
                                  {new Date(
                                    announcement.created_at,
                                  ).toLocaleDateString()}
                                </small>
                              </td>
                              <td>
                                <span
                                  className={`badge bg-${
                                    announcement.is_active
                                      ? "success"
                                      : "secondary"
                                  }`}
                                >
                                  {announcement.is_active
                                    ? "Active"
                                    : "Inactive"}
                                </span>
                              </td>
                              <td>
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() =>
                                    handleDeleteAnnouncement(announcement.id)
                                  }
                                  title="Delete announcement"
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Announcement Modal */}
      {showAnnouncementModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New Announcement</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowAnnouncementModal(false);
                    setAnnouncementTitle("");
                    setAnnouncementContent("");
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Title *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={announcementTitle}
                    onChange={(e) => setAnnouncementTitle(e.target.value)}
                    placeholder="Enter announcement title"
                    disabled={announcementSubmitting}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Content *</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    value={announcementContent}
                    onChange={(e) => setAnnouncementContent(e.target.value)}
                    placeholder="Enter announcement content"
                    disabled={announcementSubmitting}
                  ></textarea>
                </div>
                <div className="mb-3">
                  <label className="form-label">Attach Images/Files</label>
                  <div
                    className={`file-drop-zone ${announcementDragActive ? "dragging" : ""}`}
                    style={{
                      cursor: announcementSubmitting
                        ? "not-allowed"
                        : "pointer",
                      opacity: announcementSubmitting ? 0.5 : 1,
                    }}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!announcementSubmitting)
                        setAnnouncementDragActive(true);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!announcementSubmitting)
                        setAnnouncementDragActive(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setAnnouncementDragActive(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setAnnouncementDragActive(false);
                      if (!announcementSubmitting) {
                        const files = Array.from(e.dataTransfer.files || []);
                        setAnnouncementMediaFiles([
                          ...announcementMediaFiles,
                          ...files,
                        ]);
                      }
                    }}
                    onClick={() =>
                      !announcementSubmitting &&
                      document.getElementById("announcement-files")?.click()
                    }
                  >
                    <div className="drop-message">
                      <i className="bi bi-cloud-upload me-2"></i>
                      Drop files here or click to upload
                    </div>
                  </div>
                  <input
                    id="announcement-files"
                    type="file"
                    multiple
                    className="d-none"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setAnnouncementMediaFiles([
                        ...announcementMediaFiles,
                        ...files,
                      ]);
                    }}
                    disabled={announcementSubmitting}
                  />
                  <small className="text-muted d-block mt-2">
                    PNG, JPG, PDF, Word documents
                  </small>
                  {announcementMediaFiles.length > 0 && (
                    <div className="mt-3">
                      <strong className="small">
                        Attached files ({announcementMediaFiles.length}):
                      </strong>
                      <ul className="list-unstyled small mt-2">
                        {announcementMediaFiles.map((file, idx) => (
                          <li
                            key={idx}
                            className="d-flex justify-content-between align-items-center"
                          >
                            <span className="text-truncate">
                              <i className="bi bi-file me-1"></i>
                              {file.name}
                            </span>
                            <button
                              type="button"
                              className="btn btn-sm btn-link text-danger p-0"
                              onClick={() => {
                                setAnnouncementMediaFiles(
                                  announcementMediaFiles.filter(
                                    (_, i) => i !== idx,
                                  ),
                                );
                              }}
                            >
                              <i className="bi bi-x"></i>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowAnnouncementModal(false);
                    setAnnouncementTitle("");
                    setAnnouncementContent("");
                    setAnnouncementMediaFiles([]);
                    setAnnouncementMediaUrls([]);
                  }}
                  disabled={announcementSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleAddAnnouncement()}
                  disabled={announcementSubmitting}
                >
                  {announcementSubmitting ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Creating...
                    </>
                  ) : (
                    "Create Announcement"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create New User</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Profile Picture *</label>
                  <div className="profile-upload-area">
                    {formProfilePreview ? (
                      <div className="profile-preview">
                        <img src={formProfilePreview} alt="Preview" />
                        <button
                          className="btn btn-sm btn-danger position-absolute top-0 end-0 m-2"
                          onClick={() => {
                            setFormProfileFile(null);
                            setFormProfilePreview(null);
                          }}
                        >
                          <i className="bi bi-x"></i>
                        </button>
                      </div>
                    ) : (
                      <label className="profile-upload-label">
                        <i className="bi bi-cloud-upload"></i>
                        <span>Click to upload profile picture (Required)</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          hidden
                        />
                      </label>
                    )}
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Enter full name"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Password *</label>
                  <input
                    type="password"
                    className="form-control"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Enter password"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Phone</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+1-555-0000"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Position</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    placeholder="e.g., Music Ministry, Choir Group"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Position *</label>
                  <select
                    className="form-select"
                    value={formPosition}
                    onChange={(e) => setFormPosition(e.target.value)}
                  >
                    <option value="member">Member</option>
                    <option value="choir">Choir</option>
                    <option value="soccom">Soccom</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleCreateUser}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Creating...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-plus-circle me-2"></i>
                      Create User
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit User</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                    resetForm();
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Profile Picture</label>
                  <div className="profile-upload-area">
                    {formProfilePreview ? (
                      <div className="profile-preview">
                        <img src={formProfilePreview} alt="Preview" />
                        <button
                          className="btn btn-sm btn-danger position-absolute top-0 end-0 m-2"
                          onClick={() => {
                            setFormProfileFile(null);
                            setFormProfilePreview(editingUser.PROFILE || null);
                          }}
                        >
                          <i className="bi bi-x"></i>
                        </button>
                      </div>
                    ) : (
                      <label className="profile-upload-label">
                        <i className="bi bi-cloud-upload"></i>
                        <span>Click to upload new picture</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          hidden
                        />
                      </label>
                    )}
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Phone</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+1-555-0000"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Department</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    placeholder="e.g., Music Ministry, Choir Group"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Position *</label>
                  <select
                    className="form-select"
                    value={formPosition}
                    onChange={(e) => setFormPosition(e.target.value)}
                  >
                    <option value="member">Member</option>
                    <option value="choir">Choir</option>
                    <option value="soccom">Soccom</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleUpdateUser}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Updating...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-2"></i>
                      Update User
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
