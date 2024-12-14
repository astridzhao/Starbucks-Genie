import React, { useEffect, useState } from 'react';
import DrinkCard from './DrinkCard';
import styled from 'styled-components';
import supabase from '../db/supabase-client';
import { useNavigate, useLocation } from 'react-router-dom';

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
  const location = useLocation();
  const navigate = useNavigate(); // Initialize the navigate function
  const pathParts = location.pathname.split('/');
  const drinkCategory = pathParts[2];
  console.log("Current drink category: ", drinkCategory)

  const handleCardClick = (drink) => {
    console.log("Card clicked with drinkId: ", drink.itemid);
    navigate(`/menu/${drink.category}/${drink.itemid}`, {
      state: { drinkData: drink }
    });
  };

  const table = 'menuitems';

  useEffect(() => {
    async function fetchDrinks() {
      try {
        let { data } = await supabase
          .from(table)
          .select('*')
          .eq('category', drinkCategory);
        if (data) {
          console.log("Fetched drinks:", data);
          setDrinks(data);
        } else {
          console.log("No drinks found for category:", drinkCategory);
        }
      } catch (error) {
        console.error('Error fetching drinks:', error.message);
      } finally {
        setLoading(false);
      }
    }
    fetchDrinks();
  }, [drinkCategory]);

  if (loading) return <div style={{ margin: '20px', padding: '10px' }}><p>Loading...</p></div>;

  return (
    <div className="drink-grid">
      <GridContainer>
        {drinks.map((drink) => {
          return (
            <DrinkCard
              key={drink.itemid}
              drink={drink}
              onClick={() => handleCardClick(drink)}
            />);
        })}
      </GridContainer>
    </div>
  );
};

export default DrinksGrid;