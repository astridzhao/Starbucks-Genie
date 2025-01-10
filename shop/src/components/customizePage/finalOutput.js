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
    font-family:'Menlo';
`;

const OutputContainer = styled.div`
    flex-grow: 1;
    overflow: auto;
    border: 2px solid #d1d5db;
    border-radius: 0.375rem;
    padding: 1rem;
    min-height: 200px;
    max-height: 400px;
    margin-bottom: 2rem;
`;

const DrinkCard = styled.div`
    margin-bottom: 1rem;
`;

const IngredientList = styled.ul`
    list-style-type: disc;
    padding-left: 1.25rem;
    margin: 0.5rem 0;
`;

const Label = styled.strong`
    font-weight: 600;
    margin-right: 0.5rem;
`;

const EmptyMessage = styled.p`
    color: #9ca3af;
`;

const FinalOutput = ({ drinkInfoList = [] }) => {
    console.log("FinalOutput received:", drinkInfoList);
    return (
        <Container>
            <Title>Final Output</Title>
            <OutputContainer>
                {drinkInfoList?.length === 0 ? (
                    <EmptyMessage>No job result been returned yet.</EmptyMessage>
                ) : (
                    drinkInfoList.map((drinkInfo, index) => (
                        <DrinkCard key={index}>
                            <p>
                                <Label>Name:</Label>
                                {drinkInfo.name}
                            </p>
                            <div>
                                <Label>Ingredients:</Label>
                                <IngredientList>
                                    {Array.isArray(drinkInfo.ingredient) ?
                                        drinkInfo.ingredient.map((ing, i) => (
                                            <li key={i}>{ing}</li>
                                        ))
                                        : <li>{drinkInfo.ingredient}</li>
                                    }
                                </IngredientList>
                            </div>
                            <p>
                                <Label>Recommendation:</Label>
                                {drinkInfo.recommendation}
                            </p>
                        </DrinkCard>
                    ))
                )}
            </OutputContainer>
        </Container>
    );
};

export default FinalOutput;