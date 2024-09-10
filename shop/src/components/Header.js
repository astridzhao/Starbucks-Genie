import React from 'react';
import styled from 'styled-components';

const HeaderContainer = styled.header`
  background-color: #1e3932;
  color: white;
  display: flex;
  padding: 10px 20px;
  text-align: center;
  img {
    height: 50px;  // Adjust according to your actual logo size
  }
`;

function Header() {
  return (
    <HeaderContainer>
      <img src="logo.png" alt="Starbucks" />
    </HeaderContainer>
  );
}

export default Header;
