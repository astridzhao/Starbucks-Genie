import React, { useRef } from "react";
import toast from "react-hot-toast";
import "../ui/DrinkSection.css";
import "./Sticker.css";
import { toPng } from "html-to-image";

export default function DrinkSection({ drink }) {
  const stickerRef = useRef(null);

  // Add null check before destructuring
  if (!drink) {
    return null; // or return some loading/error state
  }

  const { size, nutrition, customization } = drink;

  const saveStickerAsImage = async () => {
    const stickerElement = stickerRef.current;
    try {
      await toPng(stickerElement).then((dataUrl) => {
        const link = document.createElement("a");
        link.download = "sticker.png";
        link.href = dataUrl;
        link.click();
      });
    } catch {
      toast.error("Could not save the recipe image. Please try again.");
    }
  };

  return (
    <section className="drink-detail-section">
      <div className="drink-info" ref={stickerRef}>
        <div className="size">
          <h2>Size</h2>
          <p>
            <strong>{size?.name}</strong>: {size?.volume}
          </p>
        </div>

        <div className="nutrition">
          <h2>Nutritional Information</h2>
          <ul>
            <li>Carbohydrates: {nutrition?.carbohydrates}</li>
            <li>Protein: {nutrition?.protein}</li>
            <li>Fat: {nutrition?.fat}</li>
            <li>Calories: {nutrition?.calories}</li>
          </ul>
        </div>

        <div className="customization">
          <h2>Recipe Details</h2>
          <ul>
            {Object.entries(customization || {}).map(([category, value]) => {
              if (Array.isArray(value)) {
                // Handle categories with multiple items (e.g., Syrup)
                return (
                  <li key={category}>
                    <strong>{category}:</strong>
                    <ul>
                      {value.map((item, index) => (
                        <li key={index}>
                          {item.quantity} {item.unit ? item.unit : ""}{" "}
                          {item.item}
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              } else {
                // Handle categories with single items
                if (value.quantity > 0) {
                  return (
                    <li key={category}>
                      <strong>{category}:</strong> {value.quantity}{" "}
                      {value.unit ? value.unit : ""} {value.item}
                    </li>
                  );
                } else {
                  return (
                    <li key={category}>
                      <strong>{category}:</strong> {value.item}
                    </li>
                  );
                }
              }
            })}
          </ul>
        </div>
      </div>
      <button className="generate-sticker-button" onClick={saveStickerAsImage}>
        Generate Sticker
      </button>
    </section>
  );
}
