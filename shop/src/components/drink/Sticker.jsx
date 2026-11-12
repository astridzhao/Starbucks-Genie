import React from "react";
import "./Sticker.css";


const Sticker = ({ order }) => {
    const { itemNumber, totalItems, name, customizations, dateTime } = order;

    return (
        <div className="sticker">
            <p>Item: {itemNumber} of {totalItems}</p>
            <h2>{name}</h2>
            <ul>
                {customizations.map((custom, index) => (
                    <li key={index}>{custom}</li>
                ))}
            </ul>
            <p>{dateTime}</p>
        </div>
    );
};

export default Sticker;