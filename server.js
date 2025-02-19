import deepseek from './services/deepseek.js'
import pdfService from './services/pdfManager.js'
import ragServices from './services/rag.js'

import express from 'express';
import path from 'path';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv'

dotenv.config()
const app = express();
const port = 3000;

const __dirname = import.meta.dirname;

app.use(express.json())


app.post('/deepseek', async (req, res) => {

    // Obtendo o diretório atual

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
    const prompt = req.body.prompt;
    const result = await ragServices.prompt(prompt);
    res.status(200).json({result:result.text()});
})

app.get('/gemini/rag', async (req, res) => {
  const docs = [
    path.join(__dirname, 'training/data.pdf'),
    path.join(__dirname, 'training/05_0028_M.pdf')
  ];
  const userPrompt = req.body.prompt;

  // Lança tarefas assíncronas para analisar cada documento em paralelo
  const responses = await Promise.all(docs.map(doc => ragServices.analyzeDocument(doc, userPrompt)));

  responses.forEach((response, idx) => {
      console.log(`Document ${idx + 1}:`);
      console.log(response.text);
      console.log("===============");
  });

  const finalAnswer = await ragServices.synthesizeFinalAnswer(responses);
  console.log("================Final Synthesized answer============");
  console.log(finalAnswer.text());
  console.log("============================");
  res.status(200).json({result: finalAnswer.text()});
})

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});