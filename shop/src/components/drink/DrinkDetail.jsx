import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getDrink, usesSampleMenu } from "../../data/catalog";
import DrinkHeroSection from "../ui/DrinkDetail-HeroSection";
import DrinkSection from "./DrinkSection";
import TabMenu from "../TabMenu";

export default function DrinkDetail() {
  const { category, drinkId } = useParams();
  const [drink, setDrink] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setLoading(true);
    setDrink(null);
    setError("");
    getDrink(category, drinkId)
      .then((data) => {
        if (active) setDrink(data);
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
  }, [category, drinkId]);
  return (
    <>
      <TabMenu />
      <main className="page">
        <Link to={`/menu/${category}`}>← Back to recipes</Link>
        {loading ? (
          <p role="status">Loading recipe…</p>
        ) : error ? (
          <p role="alert">{error}</p>
        ) : !drink ? (
          <h1>Drink not found</h1>
        ) : (
          <>
            <DrinkHeroSection
              drinkName={drink.name}
              image={drink.image}
              description={drink.general_description}
            />
            {usesSampleMenu && (
              <p className="muted">
                Community recipe · confirm ingredient availability with your
                barista.
              </p>
            )}
            {drink.ingredients && (
              <section className="panel">
                <h2>How to order</h2>
                <ul>
                  {drink.ingredients.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            )}
            <DrinkSection drink={drink.descriptions} />
            <Link className="primary-button" to="/customize">
              Build your own
            </Link>
          </>
        )}
      </main>
    </>
  );
}
