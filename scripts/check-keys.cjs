const { GoogleGenAI } = require('@google/genai');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const checkKey = async (name, key) => {
    console.log(`Checking ${name}: ${key.substring(0, 10)}...`);
    const genAI = new GoogleGenAI({ apiKey: key });
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    try {
        const result = await model.generateContent("hi");
        console.log(`${name} is VALID! Response: ${result.response.text()}`);
    } catch (err) {
        console.log(`${name} is INVALID: ${err.message}`);
    }
}

const main = async () => {
    if (process.env.GEMINI_API_KEY) {
        await checkKey('GEMINI_API_KEY', process.env.GEMINI_API_KEY);
    }
    if (process.env.GOOGLE_API_KEY) {
        await checkKey('GOOGLE_API_KEY', process.env.GOOGLE_API_KEY);
    }
}

main();
