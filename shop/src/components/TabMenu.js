import React from 'react';
import styled from 'styled-components';
import { useNavigate, useLocation } from 'react-router-dom';


const TabMenuContainer = styled.div`
    display: flex;
    justify-content: space-around;
    background-color: #F2F2F2;
    border-bottom: 2px solid rgba(70, 68, 77, 0.2);
    box-shadow: 0 4px 5px rgba(0, 0, 0, 0.1); 
    padding: 10px 0;
    width: 100%; 
    height: 50px; 
    align-items: center;
`;

const Tab = styled.button`
    flex-grow: 1;
    padding: 10px 0;
    background-color: ${(props) => (props.active ? '#004225' : '#f4f4f4')}; 
    border: none;
    font-weight: semi-bold;
    color: #333;
    font-size: 16px;
    font-family: 'Pike';
    font-weight: 800; 
    position: relative; 
    font-weight: 700;

    &.active {
        color: #46444D;
        font-weight: bold; 
        &:after {
        content: ''; 
        position: absolute;
        bottom: 0;
        left: 50%; // Center the line under the tab
        transform: translateX(-50%); // Ensure it's centered regardless of the width
        width: 15%; // Length of the border-bottom (adjust as needed)
        height: 4px; // Thickness of the border-bottom
        background-color: #46444D; // Color of the active border
        border-radius: 10px;
        }
    }

    &:hover {
        background-color: ${(props) => (props.active ? '#004f2d' : '#e8e8e8')};  // Softer color shift on hover
        color: ${(props) => (props.active ? 'white' : '#333')};  // Keep text color consistent
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);  // Add a subtle shadow on hover for depth
        transform: translateY(-2px);  // Slight lift effect on hover
        transition: background-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease;
    }

    &:focus {
        outline: none;
    }

    @media (max-width: 1920px) { // laptop and lower
        justify-content: space-around;
    }

    @media (max-width: 1024px) { // ipads and lower
        justify-content: space-between;
    }

    @media (max-width: 480px) { // Mobile phones
        flex-direction: column;
        align-items: center;
        padding: 8px 16px;
        font-size: 0.9rem; // Smaller text on smaller screens
    }
`;

const TabMenu = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const items = [
        { label: 'MENU', path: 'menu' },
        { label: 'TRENDING', path: 'trending' },
        { label: 'CUSTOMIZE', path: 'customize' },
    ];

    const activeIndex = items.findIndex(item => item.path === location.pathname.split('/')[1]);

    const handleTabClick = (index) => {
        const selectedPath = items[index].path;
        if (selectedPath === 'menu') {
            navigate(`/menu/coldcoffee`);
        } else {
            navigate(`/${selectedPath}`);
        }
    };

    return (
        <TabMenuContainer>
            {items.map((item, index) => (
                <Tab key={index}
                    className={activeIndex === index ? 'active' : ''}
                    onClick={() => handleTabClick(index)}>
                    {item.label}
                </Tab>
            ))}
        </TabMenuContainer>
    );
};

export default TabMenu;