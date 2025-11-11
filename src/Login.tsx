import { useState, useEffect } from "react";
import "./Login.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import backgroundImage from "./assets/Background1.jpg";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";

type LineupRow = {
  NAME?: string | null;
  POSITION?: string | null;
  EMAIL?: string | null;
  PROFILE?: string | null;
};

function App() {
  // initialize from localStorage so preference persists across reloads
  const [showPassword, setShowPassword] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem("soccom-dark-mode") === "true";
    } catch {
      return false;
    }
  });
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();

  // persist darkMode whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem("soccom-dark-mode", String(darkMode));
    } catch {
      /* ignore storage errors */
    }
  }, [darkMode]);

  useEffect(() => {
    // simulate welcome/loading screen
    const t = setTimeout(() => setLoading(false), 2300);
    return () => clearTimeout(t);
  }, []);

  // Handle sign-in and LINEUP lookup
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      const res = await supabase.auth.signInWithPassword({ email, password });
      if (res.error) throw res.error;

      // After successful sign in, check LINEUP table for the user's info
      const rowResult = await supabase
        .from("LINEUP")
        .select("NAME,POSITION,EMAIL,PROFILE")
        .eq("EMAIL", email)
        .maybeSingle();

      const row = rowResult.data as LineupRow | null;
      if (rowResult.error) {
        // non-fatal: warn and continue
        // eslint-disable-next-line no-console
        console.warn("LINEUP lookup error", rowResult.error);
      }

      if (row) {
        // Normalize position once
        const position = row.POSITION
          ? String(row.POSITION).toLowerCase().trim()
          : "";

        // If position is "member" (case-insensitive) deny access
        if (position === "member") {
          try {
            localStorage.removeItem("soccom-user-name");
            localStorage.removeItem("soccom-choir-group");
            localStorage.removeItem("soccom-profile-url");
          } catch {}
          setAuthError(
            "Access restricted: members are not allowed to use this form."
          );
          try {
            await supabase.auth.signOut();
          } catch {}
          setAuthLoading(false);
          return;
        }

        // Handle soccom users -> /soccom, choir users -> /choir
        if (position === "soccom") {
          if (row.NAME) localStorage.setItem("soccom-user-name", row.NAME);
          if (row.POSITION)
            localStorage.setItem("soccom-choir-group", row.POSITION);

          // Resolve profile for soccom users as well
          const profileField = row.PROFILE;
          if (profileField) {
            let resolved = profileField;
            if (!/^https?:\/\//i.test(profileField)) {
              const buckets = ["profiles", "avatars", "public", "lineup"];
              for (const b of buckets) {
                try {
                  const pData = supabase.storage
                    .from(b)
                    .getPublicUrl(profileField);
                  if ((pData as any)?.data?.publicUrl) {
                    resolved = (pData as any).data.publicUrl;
                    break;
                  }
                } catch (e) {
                  // ignore and continue
                }
              }
            }
            localStorage.setItem("soccom-profile-url", resolved);
          }

          setNavigating(true);
          setTimeout(() => navigate("/soccom"), 2300);
          return;
        }

        if (position === "choir") {
          // Persist name and choir group for choir users
          if (row.NAME) localStorage.setItem("soccom-user-name", row.NAME);
          if (row.POSITION)
            localStorage.setItem("soccom-choir-group", row.POSITION);

          // Resolve profile: if it's already a URL use it, else try storage buckets
          const profileField = row.PROFILE;
          if (profileField) {
            let resolved = profileField;
            if (!/^https?:\/\//i.test(profileField)) {
              // try common buckets
              const buckets = ["profiles", "avatars", "public", "lineup"];
              for (const b of buckets) {
                try {
                  const pData = supabase.storage
                    .from(b)
                    .getPublicUrl(profileField);
                  if ((pData as any)?.data?.publicUrl) {
                    resolved = (pData as any).data.publicUrl;
                    break;
                  }
                } catch (e) {
                  // ignore and continue
                }
              }
            }
            localStorage.setItem("soccom-profile-url", resolved);
          }

          // navigate to choir page with loading screen
          setNavigating(true);
          setTimeout(() => navigate("/choir"), 2300);
          return;
        }

        // Otherwise deny access for any other positions
        try {
          localStorage.removeItem("soccom-user-name");
          localStorage.removeItem("soccom-choir-group");
          localStorage.removeItem("soccom-profile-url");
        } catch {}
        setAuthError(
          "Access restricted: only users with the 'choir' or 'soccom' roles can access this system."
        );
        try {
          await supabase.auth.signOut();
        } catch {}
        setAuthLoading(false);
        return;
      }
    } catch (err: any) {
      setAuthError(err?.message || "Sign in failed");
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <>
      {(loading || navigating) && (
        <div className="welcome-screen">
          <div className="welcome-content">
            <div className="logo-container">
              <div className="logo-circle">
                <i className="bi bi-bank logo-icon"></i>
              </div>
              <div className="pulse-ring"></div>
              <div className="pulse-ring-delayed"></div>
            </div>
            <h1 className="welcome-title">SOCCOM</h1>
            <p className="welcome-subtitle">Social Communication Commission</p>
            <div className="loading-dots">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
        </div>
      )}
      <div
        className={`body d-flex justify-content-center align-items-center vh-100 theme-${
          darkMode ? "dark" : "light"
        } `}
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* top-right controls */}
        <div className="position-absolute top-0 end-0 m-3 d-flex gap-2 align-items-center controls-top">
          <button
            type="button"
            className="btn btn-sm btn-outline-light btn-theme-toggle"
            aria-pressed={darkMode}
            onClick={() => setDarkMode((s) => !s)}
            title="Toggle dark / light"
          >
            {darkMode ? (
              <i className={"bi bi-sun-fill"}></i>
            ) : (
              <i className="bi bi-moon-fill"></i>
            )}
          </button>
        </div>
        <div className="container">
          <div className="row justify-content-center w-100">
            <div className="col-12 col-sm-10 col-md-8 col-lg-6 col-xl-5">
              <div
                className={`card shadow-lg card-custom ${
                  darkMode ? "card-dark" : "card-light"
                } mx-2`}
              >
                <div className="card-body d-flex flex-column py-4 px-3">
                  <h3 className="d-flex justify-content-center mb-1">
                    <i className="bi bi-bank me-2" />
                  </h3>
                  <h3
                    className={`card-title text-center fs-5 mb-2 ${
                      darkMode ? "text-light" : "text-dark"
                    }`}
                  >
                    COMMISSION ON SOCIAL COMMUNICATION
                  </h3>
                  <small
                    className={`text-center mb-3 d-block ${
                      darkMode ? "text-light" : "text-dark"
                    }`}
                  >
                    Welcome to SOCCOM X Choir Lineup Form. This platform is
                    designed to help choirs submit and organize their songs for
                    each part of the Mass.
                  </small>

                  {/* scrollable form wrapper uses Bootstrap overflow-auto */}
                  <div className="form-scroll overflow-auto">
                    <form onSubmit={handleSubmit}>
                      <div className="mb-3 text-start">
                        <label htmlFor="email" className="form-lsabel fw-bold">
                          Email Address
                        </label>
                        <div className="input-group">
                          <span
                            className={`input-group-text ${
                              darkMode ? "bg-dark text-light" : "text-dark"
                            }`}
                          >
                            <i
                              className={`bi bi-envelope ${
                                darkMode ? "text-light" : "text-dark"
                              }`}
                            />
                          </span>
                          <input
                            type="email"
                            className="form-control"
                            id="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="mb-3 text-start">
                        <label
                          htmlFor="password"
                          className="form-label fw-bold"
                        >
                          Password
                        </label>
                        <div className="input-group">
                          <span className="input-group-text">
                            <i
                              className={`bi bi-lock ${
                                darkMode ? "bg-dark text-light" : "text-dark"
                              }`}
                            />
                          </span>
                          <input
                            type={showPassword ? "text" : "password"}
                            className="form-control"
                            id="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                          />
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => setShowPassword((s) => !s)}
                            aria-label="Toggle password visibility"
                          >
                            {showPassword ? (
                              <i className="bi bi-eye-slash" />
                            ) : (
                              <i className="bi bi-eye" />
                            )}
                          </button>
                        </div>
                      </div>

                      {authError && (
                        <div className="alert alert-danger small">
                          {authError}
                        </div>
                      )}

                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="form-check">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id="rememberMe"
                          />
                          <label
                            className="form-check-label"
                            htmlFor="rememberMe"
                          >
                            Remember me
                          </label>
                        </div>

                        <Link to="/forgot" className="text-decoration-none">
                          Forgot password?
                        </Link>
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary w-100 mb-3"
                        disabled={authLoading}
                      >
                        {authLoading ? (
                          "Signing in..."
                        ) : (
                          <>
                            <i className="bi bi-box-arrow-in-right me-2" /> Sign
                            In
                          </>
                        )}
                      </button>

                      <Link
                        to="/trouble"
                        className="text-decoration-none d-block mb-3"
                      >
                        Trouble to Log in? Contact Us
                      </Link>

                      <p
                        className={`small text-center  ${
                          darkMode ? "text-light" : "text-muted"
                        }`}
                      >
                        "For where two or three gather in my name, there am I
                        with them." - Matthew 18:20
                      </p>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>{" "}
      {/* end body */}
    </>
  );
}

export default App;
