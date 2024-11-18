import React, { useEffect, useState } from 'react';
import DrinkCard from './DrinkCard';
import styled from 'styled-components';
import supabase from '../db/supabase-client';
import { useNavigate } from 'react-router-dom';

const GridContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
  padding: 20px;

  @media (max-width: 1920px) { // laptop and lower
    justify-content: space-between;
  }

  @media (max-width: 1024px) { // ipads and lower
    justify-content: space-between;
  }

  @media (max-width: 480px) { // Mobile phones
    flex-direction: column;
    align-items: center;
    padding: 8px 16px;
    font-size: 0.9rem; // Smaller text on smaller screens
  }
`;

const DrinksGrid = () => {
  const [drinks, setDrinks] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate(); // Initialize the navigate function

  const handleCardClick = (drinkId) => {
    console.log("Card clicked with drinkId: ", drinkId);
    navigate(`/drink/${drinkId}`); // Use drink ID to navigate
  };

  const table = 'menuitems';

  useEffect(() => {
    async function fetchDrinks() {
      try {
        let { data } = await supabase
          .from(table)
          .select('itemid, name, image'); // Select only needed fields
        setDrinks(data);

        console.log("Drinks id, name, image", data);
      } catch (error) {
        console.error('Error fetching drinks:', error.message);
      } finally {
        setLoading(false);
      }
    }
    fetchDrinks();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="drink-grid">
      <GridContainer>
        {drinks.map((drink) => {
          return (
            <DrinkCard
              key={drink.itemid}
              image={drink.image}
              name={drink.name}
              onClick={() => handleCardClick(drink.itemid)}
            />);
        })}
      </GridContainer>
    </div>
  );
};

export default DrinksGrid;