const { GoogleGenAI } = require('@google/genai');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const main = async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No API key found in .env");
        return;
    }
    console.log("Using key prefix:", apiKey.substring(0, 10));
    const genAI = new GoogleGenAI({ apiKey });
    try {
        console.log("Fetching models...");
        // In @google/genai (new SDK), models are listed via ai.models.list()
        // Wait, the new SDK might have a different method.
        // Let's try to just generate content with a common name.
        const result = await genAI.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: [{ role: 'user', parts: [{ text: 'hi' }] }]
        });
        console.log("Success with gemini-1.5-flash");
    } catch (err) {
        console.log("Failed with gemini-1.5-flash:", err.message);
        try {
            const result = await genAI.models.generateContent({
                model: 'gemini-1.5-pro',
                contents: [{ role: 'user', parts: [{ text: 'hi' }] }]
            });
            console.log("Success with gemini-1.5-pro");
        } catch (err2) {
            console.log("Failed with gemini-1.5-pro:", err2.message);
        }
    }
}

main();
