import deepseek from './services/deepseek.js'
import pdfService from './services/pdfManager.js'

import express from 'express';
import path from 'path';
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import dotenv from 'dotenv'

dotenv.config()
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const app = express();
const port = 3000;

app.use(express.json())


app.post('/deepseek', async (req, res) => {

    // Obtendo o diretório atual
    const __dirname = import.meta.dirname;

    const filePath = path.join(__dirname, 'training', '05_0028_M.pdf');
    const pdfText = await pdfService.extractTextFromPDF(filePath);
    const result = await deepseek.fineTuneModel(pdfText);
    res.status(200).json({result: result});
})

app.get('/deepseek', async (req, res) => {
    try {
        const prompt = req.body.prompt;
        const completion = await deepseek.sendMessage(prompt);
        const result = JSON.parse(completion.data);
        const message = result.response;
        res.status(200).json({result: message});
    } catch (error) {
        console.error('Erro ao acessar o Ollama:', error.response ? error.response.data : error.message);
        throw error;
    }
});

app.get('/gemini', async (req, res) => {
    const prompt = "Does this look store-bought or homemade?";
    const image = {
      inlineData: {
        data: Buffer.from(fs.readFileSync("images/cookies.png")).toString("base64"),
        mimeType: "image/png",
      },
    };
    
    const result = await model.generateContent([prompt, image]);
    console.log(result.response.text());
})
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});