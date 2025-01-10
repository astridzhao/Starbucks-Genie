import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import DrinkGrid from './DrinkGrid';
import TabMenu from './TabMenu';
import { useNavigate, useLocation } from 'react-router-dom';// Import useNavigate

const ButtonBar = styled.div`
  display: flex;
  justify-content: space-around;
  margin-top: 20px;
  background-color: white;
  overflow-x: auto; //horizontal scrolling
`;

const Button = styled.button`
  background-color: #F2F2F2;
  border-radius: 40px ;
  border: none;
  padding: 10px 30px;
  font-family: 'Menlo';
  font-size: 15px;
  color: #333;
  min-width: 100px;            // Added to prevent buttons from shrinking too much
  flex-shrink: 0;              // Prevent shrinking below the min-width
  white-space: nowrap;         // Prevents text from wrapping

  &.active {
    background-color: #00623B;
    color: white;
    font-size: 15px;
    font-weight: bold; 
  }

  &:focus {
    outline: none;
  }

 @media (max-width: 1920px) { // laptop and lower
    justify-content: space-around;
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

function DrinkMenu() {
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  // Separate array for drink categories
  const items = [
    { label: 'Cold Coffee', path: 'coldcoffee' },
    { label: 'Hot Coffee', path: 'hotcoffee' },
    { label: 'Iced Tea', path: 'icetea' },
    { label: 'Refresher', path: 'refresher' },
  ];

  const handleButtonClick = (index) => {
    setActiveIndex(index);
    navigate(`/menu/${items[index].path}`); // Add navigation when button is clicked
  };

  const getContent = () => {
    const pathParts = location.pathname.split('/');
    const category = pathParts[2];
    switch (category) {
      case 'coldcoffee':
        return <DrinkGrid />;
      case 'hotcoffee':
        return <DrinkGrid />
      case 'icetea':
        return <DrinkGrid />;
      case 'refresher':
        return <DrinkGrid />;
    }
  };

  return (
    <div className="drink-bar">
      <TabMenu />
      <ButtonBar style={{ padding: "30px" }}>
        {items.map((item, index) => (
          <Button
            key={index}
            className={activeIndex === index ? 'active' : ''}
            onClick={() => handleButtonClick(index)}>{item.label}
          </Button>
        ))}
      </ButtonBar>
      <div>
        {getContent()}
      </div>
    </div>
  );
}

export default DrinkMenu;