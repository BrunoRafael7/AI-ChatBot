import fs from 'fs';
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = 'AIzaSyCeKINa1zVz9pplTelidaeJypaeYzi0Fk8'
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash-thinking-exp-01-21"
}); // Use getGenerativeModel

const ragServices = {
    prompt: async (userPrompt) => {
        const prompt = {
            "contents":
            [{"parts":[
                {"text":userPrompt},
            ]}
        ]}
        const response = await model.generateContent(prompt, { timeout: 600000 }); // Use the model instance
        return response.response; // Access the response correctly
    },
    analyzeDocument: async (pdfPath, query) => {
        try {
        const researcherPrompt = `
            You are an elite researcher and subject matter expert with advanced analytical skills. Your expertise lies in carefully scrutinized comprehensive documents and synthesizing clear evidence-based answers.

            Task Description:
            You will be provided with a full-length document along with a query. Your task is to:
            1. Thoroughly Analyze: Read and understand the entire document, identifying all sections, details, and evidence that may be relevant to the query.
            2. Synthesize Information: Extract and integrate the pertinent information into a coherent and concise answer.
            3. Support Your Answer: Where applicable, reference specific parts of the document to substantiate your conclusions.
            4. Highlight Ambiguities: If the document does not fully address the query or leaves room for interpretation, clearly indicate it any assumptions or uncertainties.

            Tone & Style:
            Use formal, precise language suitable for academic and professional research. Your answer should be clear, logical, and directly focused on adressing the query.

            Instructions:
            Query: ${query}

            Document: [Full document text provided]

            Provide the document title and a final answer that is based solely on the content of the document, meeting all the task descriptions requirements.
        `
            let pdfBuffer = await fs.readFileSync(pdfPath);
            const pdfBase64 = await pdfBuffer.toString('base64');

            const prompt = {
                "contents":
                [{"parts":[
                    {"text":researcherPrompt},
                    {"inline_data":{"mime_type":"application/pdf","data":pdfBase64}}
                ]}
            ]}

            /*const prompt = {
                contents: [
                    {
                        parts: [ //
                            {
                                mime_type: "application/pdf",
                                data: pdfBase64
                            },
                            {
                                text: researcherPrompt
                            }
                        ]
                    }
                ]
            };*/

            const response = await model.generateContent(prompt); // Use the model instance

            return response.response; // Access the response correctly

        } catch (error) {
            console.error('Error analyzing document:', error);
            throw error;
        }
    },

    synthesizeFinalAnswer: async (responses) => {
        const combinedContext = responses.map((resp, idx) => 
            `Document ${idx + 1}:\nIndividual_Final_Answer: ${(resp.text())}`
        ).join('\n');

        const finalPrompt = `
            You have used p1 trained with templates responses from multiple documents.

            Your task is to synthesize a final, comprehensive answer based solely on the combined content below.
            Please cite the doc sources used in your final answer concisely e.g. [1] or [1,2,3].
            Please list out the titles of the documents cited in your final answer in the footnote.

            Combined Document Responses:
            ${combinedContext}

            Provide a final synthesized answer concisely:
        `
        try {
            const prompt = {
                "contents":
                [{"parts":[
                    {"text":finalPrompt}
                ]}
            ]}
            const response = await model.generateContent(prompt);
            return response.response;
        } catch (error) {
            console.error('Error synthesizing:', error);
            throw error;
        }
    }
};

export default ragServices;
