/*import { PDFDocument } from 'pdf-lib';
import fs from 'fs'
import pdfParse from 'pdf-parse';

async function processLargePDF(filePath) {
    try {
        // Lê o arquivo como buffer (mas vamos carregar só o necessário depois)
        const pdfBytes = await fs.promises.readFile(filePath);
        const pdfDoc = await PDFDocument.load(pdfBytes);

        const numPages = pdfDoc.getPageCount();
        console.log(`Total de páginas: ${numPages}`);

        // Processa página por página
        for (let i = 0; i < numPages; i++) {
            console.log(`Processando página ${i + 1}`);

            // Cria um novo PDF com apenas uma página
            const newPdfDoc = await PDFDocument.create();
            const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [i]);
            newPdfDoc.addPage(copiedPage);

            // Salva a página como buffer
            const pageBytes = await newPdfDoc.save();

            // Extrai o texto dessa página com pdf-parse
            const pageData = await pdfParse(pageBytes);
            console.log(`Texto da página ${i + 1}:`, pageData.text);
        }
        console.log('PDF processado com sucesso!');
    } catch (error) {
        console.error('Erro ao processar o PDF:', error);
    }
}


const resumePdf = (filePath) => {   
    processLargePDF(filePath);
}

export default resumePdf*/



import { PDFDocument } from 'pdf-lib';
import fs from 'fs'
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import pdfParse from 'pdf-parse';
import iaService from './ia-services.js'
import PineconeService from './pinecone-service.js';

class DataManagerService {
    DataManagerService() {
        this.pineconeService = new PineconeService()
    }
    async resumePdf (filePath) {
        try {
            // Lê o arquivo como buffer (mas vamos carregar só o necessário depois)
            const pdfBytes = await fs.promises.readFile(filePath);
            const pdfDoc = await PDFDocument.load(pdfBytes);
    
            const numPages = pdfDoc.getPageCount();
            console.log(`Total de páginas: ${numPages}`);
    
            // Processa página por página
            for (let i = 0; i < numPages; i++) {
                console.log(`Processando página ${i + 1}`);
    
                // Cria um novo PDF com apenas uma página
                const newPdfDoc = await PDFDocument.create();
                const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [i]);
    
                newPdfDoc.addPage(copiedPage);
    
                // Salva a página como buffer
                const pageBytes = await newPdfDoc.save();
    
                // Extrai o texto dessa página com pdf-parse
                const pageData = await pdfParse(pageBytes);
                const prompt = `Summarize the text provided in 'Text:', without losing any important information. Text: ${pageData.text}. If you cannot evaluate Text, return INVALID`
                const result = await iaService.prompt(prompt);

                const chunks = this.#splitTextIntoChunks(result.text());
                if (result.text() !== 'INVALID') {
                    this.pineconeService.storeChunksInPinecone(chunks, filePath)
                }
            }
            console.log('PDF processado com sucesso!');
        } catch (error) {
            console.error('Erro ao processar o PDF:', error);
        }
    }

    async #splitTextIntoChunks (text) {
        const splitter = new RecursiveCharacterTextSplitter({
          chunkSize: 1000,  // Tamanho de cada chunk (em caracteres)
          chunkOverlap: 200, // Overlap entre chunks
        });
      
        const docs = await splitter.createDocuments([text]);
        return docs;
    }
}


export default DataManagerService



