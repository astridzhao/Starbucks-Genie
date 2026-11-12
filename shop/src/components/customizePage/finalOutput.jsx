import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
`;

const Title = styled.h2`
    font-size: 1.25rem;
    font-weight: bold;
    margin-bottom: 1rem;
    font-family: 'Menlo';
`;

const ReceiptContainer = styled.div`
    flex-grow: 1;
    overflow: auto;
    border: 2px solid #d1d5db;
    border-radius: 0.375rem;
    padding: 1.5rem;
    min-height: 200px;
    max-height: 400px;
    font-family: 'Menlo', monospace;
    background-color: #ffffff;
`;

const DrinkLabel = styled.div`
    border: 1px solid #d1d5db;
    padding: 1rem;
    margin-bottom: 1rem;
    background-color: #ffffff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const DrinkName = styled.div`
    font-size: 1.2rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
    border-bottom: 1px dashed #d1d5db;
    padding-bottom: 0.5rem;
`;

const IngredientList = styled.ul`
    list-style: none;
    padding: 0;
    margin: 0.5rem 0;
`;

const IngredientItem = styled.li`
    padding: 0.25rem 0;
    font-size: 0.9rem;
    &:before {
        content: '• ';
        color: #006241;
    }
`;

const RecommendationBox = styled.div`
    margin-top: 1rem;
    padding: 0.5rem;
    border-top: 1px dashed #d1d5db;
    font-size: 0.9rem;
    color: #666;
`;

const EmptyMessage = styled.p`
    color: #9ca3af;
    text-align: center;
    padding: 2rem;
`;

const FinalOutput = ({ drinkInfoList = [] }) => {
    return (
        <Container>
            <Title>Your Drink</Title>
            <ReceiptContainer>
                {drinkInfoList?.length === 0 ? (
                    <EmptyMessage>No drink created yet...</EmptyMessage>
                ) : (
                    drinkInfoList.map((drinkInfo, index) => (
                        <DrinkLabel key={index}>
                            <DrinkName>
                                {drinkInfo.name}
                            </DrinkName>
                            <IngredientList>
                                {Array.isArray(drinkInfo.ingredient) ?
                                    drinkInfo.ingredient.map((ing, i) => (
                                        <IngredientItem key={i}>{ing}</IngredientItem>
                                    ))
                                    : <IngredientItem>{drinkInfo.ingredient}</IngredientItem>
                                }
                            </IngredientList>
                            <RecommendationBox>
                                {drinkInfo.recommendation}
                            </RecommendationBox>
                        </DrinkLabel>
                    ))
                )}
            </ReceiptContainer>
        </Container>
    );
};

export default FinalOutput;