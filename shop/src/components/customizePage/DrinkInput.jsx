import React from 'react';

const DrinkInput = ({ userInput, setUserInput, userPreference, setUserPreference }) => {
    return (
        <div>
            <input
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Enter your drink input"
            />
            <input
                value={userPreference}
                onChange={(e) => setUserPreference(e.target.value)}
                placeholder="Enter your drink preference"
            />
        </div>
    );
};

export default DrinkInput;