// Please install OpenAI SDK first: `npm install openai`
import axios from 'axios'
const BASE_URL = 'http://localhost:11434'

const operations = {
    sendMessage: (prompt) => {
        return axios.post(`${BASE_URL}/api/generate`, {
            model: 'deepseek-r1:8b', // Modelo carregado no Ollama
            prompt: prompt,
            stream: false,
            system: "Você é um especialista médico. Você deve elencar as 3 doenças com maior probabilidade de casar com o diagnóstico. Mostre a probabilidade de cada uma. Escreva a resposta em português. A resposta deve ser um texto com codificação UTF-8."
        }, {
            responseType: 'text', // Habilita o streaming de dados
        });
    },
    fineTuneModel : async (data) => {
        return axios.post(`${BASE_URL}/api/fine-tune`, {
            model: 'deepseek-r1:8b',
            data: data,
        });
    }
}

export default operations;