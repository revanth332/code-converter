import path, { dirname } from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const args = process.argv && process.argv.slice(2);
dotenv.config();
let config; // Define config variable outside try-catch block

try {
    config = {
        AZURE_OPENAI_KEY : process.env.AZURE_OPENAI_KEY,
        AZURE_OPENAI_RESOURCE : process.env.AZURE_OPENAI_RESOURCE,
        AZURE_OPENAI_DEPLOYMENT : process.env.AZURE_OPENAI_DEPLOYMENT,
        GEMINI_API_KEY : process.env.GEMINI_API_KEY,
    };
} catch (error) {
    console.log(error);
}


export default config; // Export config inside try-catch block
