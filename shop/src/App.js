import React from 'react';
import styled from 'styled-components';
import Header from './components/Header';
import Menu from './components/Menu';
import DrinkDetail from './components/drink/DrinkDetail'; // Ensure you have this component
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Styled container for the app
const AppContainer = styled.div`
  font-family: Arial, sans-serif;
  width: 100%;
  margin: auto;
`;

function App() {
  return (
    <AppContainer>
      <Header />
      <Router>
        <Routes>
          <Route path="/" element={<Menu />} />
          <Route path="/drink/:drinkId" element={<DrinkDetail />} />
        </Routes>
      </Router>
    </AppContainer>
  );
}

export default App;