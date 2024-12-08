import React from 'react';
import styled from 'styled-components';
import logo from '../public/logo.png';
const HeaderContainer = styled.header`
  background-color: #1e3932;
  min-height: 10%;
  color: white;
  display: flex;
  padding: 10px 20px;
  img {
    height: 50px;  // Adjust according to your actual logo size
  }
`;

function Header() {
  return (
    <HeaderContainer>
      <img src={logo} alt="Starbucks" height={150} />
    </HeaderContainer>
  );
}

export default Header;
