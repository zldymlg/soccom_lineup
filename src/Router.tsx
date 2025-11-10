import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Login";
import ForgotPassword from "./ForgotPassword";
import Trouble from "./Trouble";
import Choir from "./Choir";

const AppRouter: React.FC = () => (
  <Router>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/forgot" element={<ForgotPassword />} />
      <Route path="/trouble" element={<Trouble />} />
      <Route path="/choir" element={<Choir />} /> {/* added */}
    </Routes>
  </Router>
);

export default AppRouter;
