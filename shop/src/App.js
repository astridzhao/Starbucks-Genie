import React from 'react';
import styled from 'styled-components';
import Header from './components/Header';
import Menu from './components/Menu';

import { createGlobalStyle } from 'styled-components';

// Define global styles
const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    font-family: Arial, sans-serif;
    box-sizing: border-box;
  }

  *, *:before, *:after {
    box-sizing: inherit;
  }
`;

// Styled container for the app
const AppContainer = styled.div`
  font-family: Arial, sans-serif;
  max-width: 1200px;
  margin: auto;
`;

function App() {
  return (
    <>
      <GlobalStyle /> 
      <AppContainer>
        <Header />
        <Menu />
      </AppContainer>
    </>
  );
}

export default App;
