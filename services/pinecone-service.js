import { OpenAIEmbeddings } from "@langchain/openai";
import { Pinecone } from "@pinecone-database/pinecone";

class PineconeService {
    async storeChunksInPinecone (docs, filePath) {
        // Inicializar Pinecone
        const pinecone = new Pinecone({
          apiKey: process.env.PINECONE_API_KEY,
          environment: process.env.PINECONE_ENVIRONMENT,
        });
      
        const indexName = process.env.PINECONE_INDEX_NAME;
        const index = pinecone.Index(indexName);
      
        // Inicializar embeddings (OpenAI)
        const embeddings = new OpenAIEmbeddings({
          openAIApiKey: process.env.OPENAI_API_KEY,
        });
      
        // Converter documentos para vetores e metadados
        const vectors = await Promise.all(
          docs.map(async (doc, idx) => {
            const embedding = await embeddings.embedQuery(doc.pageContent);
            return {
              id: `chunk-${idx}`,
              values: embedding,
              metadata: {
                text: doc.pageContent,
                source: filePath,
              },
            };
          })
        );
      
        // Upsert no Pinecone
        await index.upsert(vectors);
        console.log("Chunks armazenados com sucesso!");
    };
      
}

export default PineconeService