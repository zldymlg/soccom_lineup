import { useState, useEffect } from "react";
import "./Login.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import backgroundImage from "./assets/Background1.jpg";
import { Link } from "react-router-dom";

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

  return (
    <>
      {loading && (
        <div className="loading-overlay">
          <div className="loading-box text-center">
            <h2 className="loading-title">Welcome to SOCCOM Website</h2>
            <div
              className="spinner-border text-light"
              role="status"
              aria-hidden="true"
            >
              <span className="visually-hidden">Loading...</span>
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

        {/* Use Bootstrap grid to control responsive width (no custom media queries) */}
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
                    <form>
                      <div className="mb-3 text-start">
                        <label htmlFor="email" className="form-label fw-bold">
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

                        {/* use Link to new forgot route */}
                        <Link to="/forgot" className="text-decoration-none">
                          Forgot password?
                        </Link>
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary w-100 mb-3"
                      >
                        <i className="bi bi-box-arrow-in-right me-2" /> Sign In
                      </button>

                      <a href="#" className="text-decoration-none d-block mb-3">
                        Trouble to Log in? Contact Us
                      </a>

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
