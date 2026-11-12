import React, { useEffect, useState } from "react";
import DrinkCard from "./DrinkCard";
import { getDrinks, usesSampleMenu } from "../data/catalog";
import { useNavigate, useParams } from "react-router-dom";

export default function DrinkGrid({ featured = false }) {
  const [drinks, setDrinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const { category } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    getDrinks(category)
      .then((data) => {
        if (active)
          setDrinks(featured ? data.filter((drink) => drink.featured) : data);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [category, featured, attempt]);

  if (loading) return <p role="status">Loading drinks…</p>;
  if (error)
    return (
      <div role="alert">
        <p>{error}</p>
        <button onClick={() => setAttempt((value) => value + 1)}>
          Try again
        </button>
      </div>
    );
  return (
    <section>
      {usesSampleMenu && (
        <p className="muted">
          Sample community recipes · ingredient availability varies by location.
          Photos are illustrative.
        </p>
      )}
      {drinks.length === 0 ? (
        <p>No drinks here yet. Try another category or create your own.</p>
      ) : (
        <div className="catalog-grid">
          {drinks.map((drink) => (
            <DrinkCard
              key={drink.itemid}
              drink={drink}
              onClick={() =>
                navigate(`/menu/${drink.category}/${drink.itemid}`)
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}
