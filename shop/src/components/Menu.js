import styled from 'styled-components';
import React, { useState } from 'react';
import DrinkBar from './DrinkBar';

const MenuContainer = styled.div`
    diaplay: flex;
    margin-top: 20px;
    flex-direction: column; // Align children vertically
    background-color: white;
    width: 100%; // Full width container
`

const TabMenu = styled.div`
  display: flex;
  justify-content: space-around;
  background-color: #F2F2F2;
  border-bottom: 3px solid rgba(70, 68, 77, 0.5);
  box-shadow: 0 4px 5px rgba(0, 0, 0, 0.1); 
`;

const Tab = styled.button`
  flex-grow: 1;
  padding: 10px 0;
  background: none;
  border: none;
  font-weight: semi-bold;
  color: #333;
  font-size: 16px;
  position: relative; 

  &.active {
    color: #46444D;
    border-bottom-color: #46444D;
    &:after {
      content: ''; // Necessary to display the pseudo-element
      position: absolute;
      bottom: 0;
      left: 50%; // Center the line under the tab
      transform: translateX(-50%); // Ensure it's centered regardless of the width
      width: 20%; // Length of the border-bottom (adjust as needed)
      height: 4px; // Thickness of the border-bottom
      background-color: #46444D; // Color of the active border
      border-radius: 10px;
    }
  }

  &:focus {
    outline: none;
  }

  @media (max-width: 1024px) { // iPads and lower
    justify-content: space-around;
  }

  @media (max-width: 768px) { // Tablets and lower
    justify-content: space-between;
  }

  @media (max-width: 480px) { // Mobile phones
    flex-direction: column;
    align-items: center;
    padding: 8px 16px;
    font-size: 0.9rem; // Smaller text on smaller screens
  }
`;

function Menu() {
    const [activeIndex, setActiveIndex] = useState(0);
    const items = [
        { label: 'Menu' },
        { label: 'Trending' },
        { label: 'Customize' },
    ];

    const getContent = () => {
        switch (activeIndex) {
            case 0:
                return <DrinkBar />;
            case 1:
                return <p>Content for Trending</p>;
            case 2:
                return <p>Content for Customize</p>;
            default:
                return <p>Welcome to our app!</p>;
        }
    };

    return (
        <MenuContainer>
            <div className="card">
                <TabMenu>
                    {items.map((item, index) => (
                        <Tab key={index}
                            className={activeIndex === index ? 'active' : ''}
                            onClick={() => setActiveIndex(index)}>
                            {item.label}
                        </Tab>
                    ))}
                </TabMenu>
                <div>
                    {getContent()}
                </div>
            </div>
        </MenuContainer>
    );
}

export default Menu;



