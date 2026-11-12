import React from "react";
import { Toaster } from "react-hot-toast";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import AppUpdateNotice from "./components/system/AppUpdateNotice";
import Header from "./components/Header";
import Menu from "./components/Menu";
import Welcome from "./components/Welcome";
import DrinkDetail from "./components/drink/DrinkDetail";
import DrinkMenu from "./components/DrinkMenu";

export default function App() {
  return (
    <BrowserRouter>
      <Toaster />
      <Header />
      <AppUpdateNotice />
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route
          path="/menu"
          element={<Navigate to="/menu/coldcoffee" replace />}
        />
        <Route path="/trending" element={<Menu />} />
        <Route path="/customize" element={<Menu />} />
        <Route path="/menu/:category" element={<DrinkMenu />} />
        <Route path="/menu/:category/:drinkId" element={<DrinkDetail />} />
        <Route
          path="*"
          element={
            <main className="page">
              <h1>Page not found</h1>
              <Link to="/">Back to home</Link>
            </main>
          }
        />
      </Routes>
      <footer>
        Made for curious coffee lovers. Recipes are suggestions; confirm
        ingredients and allergens with your barista.
      </footer>
    </BrowserRouter>
  );
}
