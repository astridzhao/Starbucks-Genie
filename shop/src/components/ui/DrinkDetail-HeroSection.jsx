// src/DrinkDetailSection.js

import React from 'react';
import './DrinkDetail-HeroSection.css'; // Import the CSS for styling

const DrinkHeroSection = ({ drinkName, image, description }) => {
    return (
        <section className="drink-detail-section">
            <div className="image-container">
                <img src={image} alt={drinkName} className="drink-image" />
            </div>
            <h1 className="drink-name">{drinkName}</h1>
            <p className="drink-description">{description}</p>
        </section>
    );
};

export default DrinkHeroSection;
