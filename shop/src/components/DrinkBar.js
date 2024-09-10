import React, { useState } from 'react';
import styled from 'styled-components';
import DrinkGrid from './DrinkGrid';

const ButtonBar = styled.div`
  display: flex;
  justify-content: space-around;
  padding: 10px 0;
  margin: 20px;
  background-color: white;
  overflow-x: auto; //horizontal scrolling
`;

const Button = styled.button`
  background-color: #F2F2F2;
  border-radius: 20% ;
  border: none;
  padding: 12px 20px;
  font-size: 14px;
  color: #333;
  min-width: 0;            // Added to allow shrinking below natural size
  white-space: nowrap;  

  &.active {
    background-color: #00623B;
    color: white;
  }

  &:focus {
    outline: none;
  }

  @media (max-width: 480px) {
    padding: 8px 16px;
    font-size: 0.9rem; // Smaller text on smaller screens
  }
`;

function DrinkBar() {
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
    <div className="card">
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

export default DrinkBar;