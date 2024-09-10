import React, { useEffect, useState } from 'react';
import DrinkCard from './DrinkCard';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const GridContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
  padding: 20px;

  @media (max-width: 1024px) { // iPads and lower
    justify-content: space-around;
  }

  @media (max-width: 768px) { // Tablets and lower
    justify-content: space-between;
  }

  @media (max-width: 480px) { // Mobile phones
    flex-direction: column;
    align-items: center;
  }
`;

const DrinksGrid = () => {
    const [drinks, setDrinks] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDrinks = async () => {
          const { data, error } = await supabase
            .from('drinks')
            .select('image, name');
    
          if (error) console.log('Error fetching drinks:', error);
          else setDrinks(data);
        };
    
        fetchDrinks();
      }, []);
      
      const handleCardClick = (name) => {
        navigate(`/drink/${name}`); // Assumes a route is set up for each drink
      };

      return (
        <GridContainer>
          {drinks.map((drink, index) => (
            <DrinkCard
              key={index}
              image={drink.image}
              name={drink.name}
              onClick={() => handleCardClick(drink.name)}
            />
          ))}
        </GridContainer>
      );
    };
    
    export default DrinksGrid;
    
    
    
    
    
    
    
    
    
