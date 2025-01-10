import React from 'react';
import styled from 'styled-components';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Menu from './components/Menu';
import Welcome from './components/Welcome';
import DrinkDetail from './components/drink/DrinkDetail'; // Ensure you have this component
import DrinkMenu from './components/DrinkMenu';
// import DrinksGrid from './components/DrinkGrid';

// Styled container for the app
const AppContainer = styled.div`
  font-family: Arial, sans-serif;
  width: 100%;
  margin: auto;
`;

function App() {
  return (
    <AppContainer>
      <Toaster />
      <Header />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="menu" element={<Menu />} />
          <Route path="trending" element={<Menu />} />
          <Route path="customize" element={<Menu />} />
          <Route path="/menu/:category" element={<DrinkMenu />} />
          <Route path="/menu/:category/:drinkId" element={<DrinkDetail />} />
        </Routes>
      </BrowserRouter>
    </AppContainer>
  );
}

export default App;