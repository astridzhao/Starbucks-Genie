import React, { useState, useEffect } from 'react';

const DrinkCustomizer = () => {
    const [prompt, setPrompt] = useState('');
    const [generatedDrink, setGeneratedDrink] = useState("");
    const [loading, setLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState("")
    const [submitStatus, setSubmitStatus] = useState("Submit");

    const responseGenerate = async (inputText) => {
        const prompt = {
            inputText: inputText
        }

        const result = await fetch("http://localhost:7071/api/starbucks", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(prompt)
        })

        if (result.ok) {
            const airespond = await result.json();
            setGeneratedDrink(airespond.analysis);
            // setImageUrl(airespond.imageURL);
            setSubmitStatus("Submit");
        } else {
            setSubmitStatus("Retry");
        }
    };

    async function submitDescription() {
        setSubmitStatus("Waiting");
        responseGenerate(prompt);
    }

    return (
        <div>
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your drink..."
                className="prompt-description"
            />
            <button onClick={submitDescription} disabled={loading}>
                {loading ? 'Generating...' : 'Generate'}
            </button>

            {generatedDrink && (
                <div>
                    <h2>Generated Drink</h2>
                    <p>{JSON.stringify(generatedDrink)}</p>
                    {/* <button onClick={handleSave}>Save Drink</button> */}
                </div>
            )}
        </div>
    );
};

export default DrinkCustomizer;