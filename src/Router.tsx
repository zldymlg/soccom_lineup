import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Login";
import ForgotPassword from "./ForgotPassword";
import Trouble from "./Trouble";
import Choir from "./Choir";
import Soccom from "./soccom";
import LineupView from "./LineupView";
import Files from "./Files";
import Admin from "./Admin";

const AppRouter: React.FC = () => (
  <Router>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/forgot" element={<ForgotPassword />} />
      <Route path="/trouble" element={<Trouble />} />
      <Route path="/choir" element={<Choir />} />
      <Route path="/soccom" element={<Soccom />} />
      <Route path="/files" element={<Files />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/lineup/:id" element={<LineupView />} />
    </Routes>
  </Router>
);

export default AppRouter;
