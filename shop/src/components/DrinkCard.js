import React from 'react';
import styled from 'styled-components';

const Card = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 20px;
  padding: 20px;
  cursor: pointer;
  text-align: center;
`;

const Image = styled.img`
  width: 100%;
  height: auto;
  max-width: 150px;
  max-height: 150px;
  border-radius: 50%;
  object-fit: cover;
`;

const Label = styled.span`
  margin-top: 20px;
  color: #333;
  font-size: 1rem; // Default size
  font-family: 'Menlo';
  @media (max-width: 768px) {
    font-size: 0.9rem; // Smaller text on tablets and below
  }

  @media (max-width: 480px) {
    font-size: 0.8rem; // Even smaller text on phones
  }
`;

const DrinkCard = ({ drink, onClick }) => (
  <Card onClick={onClick}>
    <Image src={drink.image} alt={drink.name} />
    <Label>{drink.name}</Label>
  </Card>
);


export default DrinkCard;
