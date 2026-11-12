import React from "react";
import { Link } from "react-router-dom";
import TabMenu from "./TabMenu";

export default function Welcome() {
  return (
    <>
      <TabMenu />
      <main className="page welcome">
        <span className="eyebrow">A LITTLE INSPIRATION IN EVERY CUP</span>
        <h1>
          Your taste.
          <br />A little Genie magic.
        </h1>
        <p>
          Tell us what you’re craving. Get a creative drink recipe with
          ingredients and an easy way to order.
        </p>
        <div className="actions">
          <Link className="primary-button" to="/customize">
            Create my drink
          </Link>
          <Link className="secondary-button" to="/menu/coldcoffee">
            Explore recipes
          </Link>
        </div>
        <p className="muted">
          An independent community project. Not affiliated with Starbucks.
        </p>
      </main>
    </>
  );
}
