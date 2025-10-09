import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Login";
import ForgotPassword from "./ForgotPassword"; // added

// Example pages/components

const AppRouter: React.FC = () => (
  <Router>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/forgot" element={<ForgotPassword />} />
    </Routes>
  </Router>
);

export default AppRouter;
