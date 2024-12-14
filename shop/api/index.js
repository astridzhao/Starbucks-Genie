
const { app } = require('@azure/functions');
const { OpenAI } = require("openai");
const cors = require('cors');

app.use(cors());
app.http('getAIResponse', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'starbucks',
    handler: async (request, context) => {
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });

        const body = await request.json();
        inputText = body.inputText;

        const drink_response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { "role": "system", "content": "You are a assistant helping user to customize a Starbucks Drink. User will give you a prompt about what they want. Respond should be in list format, avoid using any markdown symbol" },
                { "role": "user", "content": `Write an  based on the prompt: "${inputText}"` }
            ]
        });

        const image_response = await openai.images.generate({
            model: "dall-e-3",
            prompt: `Generate a beautiful, fantastical image visualizing the dream: "${inputText}"`,
            size: "1024x1024",
            quality: "standard",
            n: 1,
        });

        return {
            jsonBody: { analysis: drink_response.choices[0].message.content }
            // jsonBody: { imageURL: image_response.data[0].url, analysis: drink_response.choices[0].message.content }
        }
    },
});