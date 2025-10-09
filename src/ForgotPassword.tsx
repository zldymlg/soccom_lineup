import { useState, useEffect } from "react";
import "./Login.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import backgroundImage from "./assets/Background1.jpg";
import { Link } from "react-router-dom";

const ForgotPassword: React.FC = () => {
  // changed: split steps into request -> enterCode -> changePassword
  const [step, setStep] = useState<"request" | "enterCode" | "changePassword">(
    "request"
  );
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false); // added
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // added
  const [message, setMessage] = useState<string | null>(null);

  // persistent dark mode (unchanged logic)
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem("soccom-dark-mode") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("soccom-dark-mode", String(darkMode));
    } catch {
      /* ignore storage errors */
    }
  }, [darkMode]);

  // send code then show code entry step
  const sendCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setMessage("Please enter your email to receive a reset code.");
      return;
    }
    // simulate sending code
    setMessage(`A reset code was sent to ${email}. Please enter it below.`);
    setTimeout(() => {
      setStep("enterCode");
      setMessage(null);
    }, 900);
  };

  // verify code only, then allow changing password
  const submitCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setMessage("Please enter the reset code.");
      return;
    }
    // placeholder verification logic
    // if valid:
    setMessage("Code verified. Please enter your new password.");
    setTimeout(() => {
      setStep("changePassword");
      setMessage(null);
    }, 700);
  };

  // final password reset step (updated to validate confirm password)
  const submitNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      setMessage("Please enter a new password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      // added validation
      setMessage("Passwords do not match. Please re-enter.");
      return;
    }
    // placeholder: perform actual password reset
    setMessage("Your password was reset. You may now sign in.");
    setTimeout(() => {
      setMessage(null);
      // optionally navigate back to login
      setStep("request");
      setEmail("");
      setCode("");
      setNewPassword("");
      setConfirmPassword(""); // clear confirm on success
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    }, 1400);
  };

  return (
    <div
      className={`body d-flex justify-content-center align-items-center vh-100 theme-${
        darkMode ? "dark" : "light"
      }`}
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* top-right dark/light toggle (same style as Login) */}
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
              className={`card shadow-lg card-custom mx-2 ${
                darkMode ? "card-dark" : "card-light"
              }`}
            >
              <div className="card-body d-flex flex-column py-4 px-3">
                <h3 className="d-flex justify-content-center mb-1">
                  <i className="bi bi-key-fill me-2" />
                </h3>
                <h1 className="card-title text-center fw-bold mb-2">
                  Forgot Password?
                </h1>
                <small
                  className={`text-center mb-3 d-block ${
                    darkMode ? "text-light" : "text-muted"
                  }`}
                >
                  Enter your account email to receive a reset code, then enter
                  the code and set a new password.
                </small>

                <div className="form-scroll overflow-auto">
                  {step === "request" && (
                    <form onSubmit={sendCode}>
                      <div className="mb-3 text-start">
                        <label
                          htmlFor="fp-email"
                          className="form-label fw-bold"
                        >
                          Email Address
                        </label>
                        <div className="input-group">
                          <span className="input-group-text">
                            <i className="bi bi-envelope" />
                          </span>
                          <input
                            id="fp-email"
                            type="email"
                            className="form-control"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>
                      </div>

                      {message && (
                        <div className="alert alert-info">{message}</div>
                      )}

                      <button
                        type="submit"
                        className="btn btn-primary w-100 mb-3"
                      >
                        Send Reset Code
                      </button>

                      <div className="text-center">
                        <Link to="/" className="text-decoration-none">
                          Back to Sign In
                        </Link>
                      </div>
                    </form>
                  )}

                  {step === "enterCode" && (
                    <form onSubmit={submitCode}>
                      <div className="mb-3 text-start">
                        <label htmlFor="fp-code" className="form-label fw-bold">
                          Enter Reset Code
                        </label>
                        <input
                          id="fp-code"
                          type="text"
                          className="form-control"
                          placeholder="Enter reset code"
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                        />
                      </div>

                      {message && (
                        <div className="alert alert-info">{message}</div>
                      )}

                      <div className="d-flex gap-2 mb-3">
                        <button
                          type="submit"
                          className="btn btn-primary flex-grow-1"
                        >
                          Verify Code
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => {
                            setStep("request");
                            setMessage(null);
                            setCode("");
                          }}
                        >
                          Back
                        </button>
                      </div>

                      <div className="text-center">
                        <Link to="/" className="text-decoration-none">
                          Back to Sign In
                        </Link>
                      </div>
                    </form>
                  )}

                  {step === "changePassword" && (
                    <form onSubmit={submitNewPassword}>
                      <div className="mb-3 text-start">
                        <label
                          htmlFor="fp-newpass"
                          className="form-label fw-bold"
                        >
                          New Password
                        </label>
                        <div className="input-group">
                          <input
                            id="fp-newpass"
                            type={showNewPassword ? "text" : "password"}
                            className="form-control"
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                          />
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => setShowNewPassword((s) => !s)}
                            aria-label="Toggle new password visibility"
                          >
                            {showNewPassword ? (
                              <i className="bi bi-eye-slash" />
                            ) : (
                              <i className="bi bi-eye" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Confirm / Re-enter password */}
                      <div className="mb-3 text-start">
                        <label
                          htmlFor="fp-confirm"
                          className="form-label fw-bold"
                        >
                          Confirm Password
                        </label>
                        <div className="input-group">
                          <input
                            id="fp-confirm"
                            type={showConfirmPassword ? "text" : "password"}
                            className="form-control"
                            placeholder="Re-enter new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                          />
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => setShowConfirmPassword((s) => !s)}
                            aria-label="Toggle confirm password visibility"
                          >
                            {showConfirmPassword ? (
                              <i className="bi bi-eye-slash" />
                            ) : (
                              <i className="bi bi-eye" />
                            )}
                          </button>
                        </div>
                      </div>

                      {message && (
                        <div className="alert alert-info">{message}</div>
                      )}

                      <div className="d-flex gap-2 mb-3">
                        <button
                          type="submit"
                          className="btn btn-primary flex-grow-1"
                        >
                          Reset Password
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => {
                            setStep("enterCode");
                            setMessage(null);
                            setNewPassword("");
                            setConfirmPassword(""); // clear confirm when backing
                          }}
                        >
                          Back
                        </button>
                      </div>

                      <div className="text-center">
                        <Link to="/" className="text-decoration-none">
                          Back to Sign In
                        </Link>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>{" "}
      {/* container */}
    </div>
  );
};

export default ForgotPassword;
