import { useState, useEffect } from "react";
import "./Login.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import backgroundImage from "./assets/Background1.jpg";
import { Link } from "react-router-dom";

const Trouble: React.FC = () => {
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
      /* ignore */
    }
  }, [darkMode]);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("");
  const [details, setDetails] = useState("");
  const [priority, setPriority] = useState<"Low" | "Normal" | "High">("Normal");
  const [_file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // placeholder: replace with real submission
    setMessage("Support request submitted. We'll contact you shortly.");
    setTimeout(() => setMessage(null), 4500);
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
      <div className="position-absolute top-0 end-0 m-3 d-flex gap-2 align-items-center controls-top">
        <button
          type="button"
          className="btn btn-sm btn-outline-light btn-theme-toggle"
          aria-pressed={darkMode}
          onClick={() => setDarkMode((s) => !s)}
          title="Toggle dark / light"
        >
          {darkMode ? (
            <i className="bi bi-sun-fill" />
          ) : (
            <i className="bi bi-moon-fill" />
          )}
        </button>
      </div>

      <div className="container">
        <div className="row justify-content-center w-100">
          <div className="col-12 col-sm-10 col-md-8 col-lg-7 col-xl-6">
            <div
              className={`card shadow-lg card-custom mx-2 ${
                darkMode ? "card-dark" : "card-light"
              }`}
            >
              <div className="card-body py-4 px-3">
                <h5 className="text-center fw-bold mb-3">
                  Describe Your Problem
                </h5>
                <p
                  className={`text-center small mb-3 ${
                    darkMode ? "text-light" : "text-muted"
                  }`}
                >
                  Please provide details so our team can review and assist
                  quickly.
                </p>

                <div className="form-scroll overflow-auto">
                  <form onSubmit={submit}>
                    <div className="row g-2 mb-3">
                      <div className="col-12 col-md-6">
                        <label className="form-label fw-bold">Full Name</label>
                        <input
                          className="form-control"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label fw-bold">
                          Email Address
                        </label>
                        <input
                          type="email"
                          className="form-control"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="row g-2 mb-3">
                      <div className="col-12 col-md-6">
                        <label className="form-label fw-bold">
                          Phone / Contact
                        </label>
                        <input
                          className="form-control"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label fw-bold">
                          Problem Category
                        </label>
                        <select
                          className="form-select"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                        >
                          <option value="">Select category</option>
                          <option>Account</option>
                          <option>Lineup Submission</option>
                          <option>Technical</option>
                          <option>Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-bold">
                        Detailed Description
                      </label>
                      <textarea
                        className="form-control"
                        rows={5}
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-bold">
                        Attachment (optional)
                      </label>
                      <input
                        className="form-control"
                        type="file"
                        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                      />
                    </div>

                    <div className="mb-3 d-flex gap-2 align-items-center">
                      <label className="form-label fw-bold mb-0 me-2">
                        Priority
                      </label>
                      <div
                        className="btn-group"
                        role="group"
                        aria-label="priority"
                      >
                        <button
                          type="button"
                          className={`btn btn-sm ${
                            priority === "Low"
                              ? "btn-primary"
                              : "btn-outline-secondary"
                          }`}
                          onClick={() => setPriority("Low")}
                        >
                          Low
                        </button>
                        <button
                          type="button"
                          className={`btn btn-sm ${
                            priority === "Normal"
                              ? "btn-primary"
                              : "btn-outline-secondary"
                          }`}
                          onClick={() => setPriority("Normal")}
                        >
                          Normal
                        </button>
                        <button
                          type="button"
                          className={`btn btn-sm ${
                            priority === "High"
                              ? "btn-primary"
                              : "btn-outline-secondary"
                          }`}
                          onClick={() => setPriority("High")}
                        >
                          High
                        </button>
                      </div>
                    </div>

                    {message && (
                      <div className="alert alert-info">{message}</div>
                    )}

                    <div className="d-flex gap-2">
                      <button
                        type="submit"
                        className="btn btn-primary flex-grow-1"
                      >
                        <i className="bi bi-send me-2" /> Submit
                      </button>
                      <Link to="/" className="btn btn-outline-secondary">
                        Back
                      </Link>
                    </div>

                    <p
                      className={`small text-center mt-3 ${
                        darkMode ? "text-light" : "text-muted"
                      }`}
                    >
                      If urgent, contact admin directly.
                    </p>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Trouble;
