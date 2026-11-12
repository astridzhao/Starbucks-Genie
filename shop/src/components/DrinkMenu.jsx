import React from "react";
import { NavLink, useParams } from "react-router-dom";
import DrinkGrid from "./DrinkGrid";
import TabMenu from "./TabMenu";

export const categories = [
  ["coldcoffee", "Cold Coffee"],
  ["hotcoffee", "Hot Coffee"],
  ["icetea", "Iced Tea"],
  ["refresher", "Refreshers"],
];
export default function DrinkMenu() {
  const { category } = useParams();
  return (
    <>
      <TabMenu />
      <main className="page">
        <h1>Find your next favorite</h1>
        <p className="muted">
          Explore a recipe, or let the Genie make something just for you.
        </p>
        <nav className="category-nav" aria-label="Drink categories">
          {categories.map(([path, label]) => (
            <NavLink key={path} to={`/menu/${path}`}>
              {label}
            </NavLink>
          ))}
        </nav>
        {categories.some(([path]) => path === category) ? (
          <DrinkGrid />
        ) : (
          <p>Category not found. Choose a category above.</p>
        )}
      </main>
    </>
  );
}
