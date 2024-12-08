import styled from 'styled-components';
import React, { useState, useEffect } from 'react';
import DrinkMenu from './DrinkMenu';
import Welcome from './Welcome';
import TabMenu from './TabMenu';
import { useNavigate, useLocation } from 'react-router-dom';

const MenuContainer = styled.div`
    display: flex;
    flex-direction: column; 
    background-color: white;
    width: 100%; 
`

const ContentContainer = styled.div`
  width: 100%; // Ensures the content spans 100% width
  margin: 10px 30px 10px 30px; 
`;


function Menu() {
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const items = [
    { label: 'MENU', path: 'menu' },
    { label: 'TRENDING', path: 'trending' },
    { label: 'CUSTOMIZE', path: 'customize' },
  ];

  useEffect(() => {
    const path = location.pathname.slice(1) || 'menu'; // Remove leading slash
    const index = items.findIndex(item => item.path === path);
    if (index !== -1) {
      setActiveIndex(index);
    }
  }, [location.pathname]);

  const handleTabClick = (index) => {
    setActiveIndex(index);
    const selectedPath = items[index].path;
    if (selectedPath === 'menu') {
      navigate('/menu/coldcoffee');
    } else {
      navigate(`/${selectedPath}`);
    }
  };

  const getContent = () => {
    const path = location.pathname.slice(1);
    switch (path) {
      case 'menu':
        return <DrinkMenu />;
      case 'trending':
        return <p>Content for Trending</p>;
      case 'customize':
        return <p>Content for Customize</p>;
      default:
        return <Welcome />;
    }
  };

  return (
    <MenuContainer>
      <TabMenu />
      <ContentContainer>
        {getContent()}
      </ContentContainer>
    </MenuContainer>
  );
}

export default Menu;



