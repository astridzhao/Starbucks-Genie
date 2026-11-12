import React from "react";
import { NavLink } from "react-router-dom";

export default function TabMenu() {
  return (
    <nav className="main-nav" aria-label="Main navigation">
      <NavLink
        to="/menu/coldcoffee"
        className={({ isActive }) =>
          isActive || window.location.pathname.startsWith("/menu/")
            ? "active"
            : ""
        }
      >
        Menu
      </NavLink>
      <NavLink to="/trending">Community picks</NavLink>
      <NavLink to="/customize">Create a drink</NavLink>
    </nav>
  );
}
