import React, { useState } from 'react';
import styled from 'styled-components';
import DrinkGrid from './DrinkGrid';

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
    font-family:'Menlo';
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
  const items = [
    { label: 'Cold Coffee' },
    { label: 'Hot Coffee' },
    { label: 'Ice Tea' },
    { label: 'Refresher' },
  ];

  const getContent = () => {
    switch (activeIndex) {
      case 0:
        return <DrinkGrid />;
      case 1:
        return <p>Content for Trending</p>;
      case 2:
        return <p>Content for Customize</p>;
      default:
        return <p>Welcome to our app!</p>;
    }
  };

  return (
    <div className="drink-bar">
      <ButtonBar>
        {items.map((item, index) => (
            <Button key={index}
              className={activeIndex === index ? 'active' : ''}
              onClick={() => setActiveIndex(index)}>{item.label}
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