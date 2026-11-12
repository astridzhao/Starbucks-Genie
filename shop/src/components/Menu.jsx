import React from "react";
import { useLocation } from "react-router-dom";
import DrinkCustomizer from "./CustomizePage";
import DrinkGrid from "./DrinkGrid";
import TabMenu from "./TabMenu";
import DrinkBuilder from "./builder/DrinkBuilder";

export default function Menu() {
  const aiEnabled =
    import.meta.env.DEV || Boolean(import.meta.env.VITE_API_URL);
  const { pathname } = useLocation();
  return (
    <>
      <TabMenu />
      <main className="page">
        {pathname === "/customize" ? (
          <>
            <DrinkBuilder />
            {aiEnabled && (
              <details className="ai-section">
                <summary>Want more ideas? Ask the AI Genie</summary>
                <DrinkCustomizer />
              </details>
            )}
          </>
        ) : (
          <>
            <h1>Community picks</h1>
            <p className="muted">
              Featured recipes to inspire your next order.
            </p>
            <DrinkGrid featured />
          </>
        )}
      </main>
    </>
  );
}
