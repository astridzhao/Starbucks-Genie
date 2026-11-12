import React, { useState } from "react";
import styled from "styled-components";

const Container = styled.div`
  margin-bottom: 1rem;
`;

const Title = styled.h2`
  font-size: 1.2rem;
  font-weight: bold;
  font-family: "Menlo";
`;

const InputField = styled.input`
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 0.25rem;
  flex-grow: 1;
  margin-right: 0.5rem;
  width: min(300px, 100%);
  box-sizing: border-box;
  font-family: "Menlo";
  font-size: 1rem;
  @media (max-width: 768px) {
    font-size: 0.9rem; // Adjust for smaller screens
  }

  &:focus {
    border-color: #006241;
    outline: none; // Remove default outline
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5); // Optional: add a shadow effect
  }
`;

const AddButton = styled.button`
  background-color: #006241;
  color: white;
  font-weight: bold;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  margin-top: 1rem;
  font-family: "Menlo";

  &:hover {
    background-color: #1e3932;
  }
`;

const CancelButton = styled.button`
  background-color: #c1b19d;
  color: white;
  font-weight: bold;
  border-radius: 0.25rem;
  padding: 0.1rem 0.1rem;
  font-size: 0.8rem;
  width: 20px;
  &:hover {
    background-color: #ebdfcc;
  }
`;

const ListItem = styled.li`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0.3rem 1rem;
  border-radius: 0.25rem;
  margin-bottom: 0.1rem;
  font-size: 16px;
  background-color: ${({ isNew }) => (isNew ? "#d1fae5" : "white")}; // Light green for new items
  transition: background-color 0.3s;
`;

const InputSection = ({ data, setData, title, placeholder }) => {
  const [inputValue, setInputValue] = useState("");

  const handleAddClick = () => {
    if (inputValue.trim() !== "") {
      setData([...data, inputValue.trim()]);
      setInputValue(""); // Clear the input field
    }
  };

  const handleRemoveItem = (index) => {
    setData((prevData) => prevData.filter((_, idx) => idx !== index));
  };

  return (
    <Container>
      <Title>{title}</Title>
      <div className="flex items-center mt-2">
        <InputField
          type="text"
          aria-label={title}
          maxLength={500}
          onKeyDown={(event) => {
            if (event.key === "Enter") handleAddClick();
          }}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
        />
        <AddButton onClick={handleAddClick}>Add</AddButton>
      </div>
      <ul>
        {data.map((item, index) => (
          <ListItem key={index} className="flex items-center justify-between">
            <span>{item}</span>
            <CancelButton
              aria-label={`Remove ${item}`}
              onClick={() => handleRemoveItem(index)}
              style={{ marginLeft: "1rem" }}
            >
              X
            </CancelButton>
          </ListItem>
        ))}
      </ul>
    </Container>
  );
};

export default InputSection;
