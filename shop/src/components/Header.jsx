import React from "react";
import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="site-header">
      <Link to="/" aria-label="Starbucks Genie home">
        <img src="/logo.png" alt="" />
        <span>
          Starbucks Genie<small>YOUR PERSONAL DRINK INSPIRATION</small>
        </span>
      </Link>
    </header>
  );
}
