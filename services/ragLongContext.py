# footnote: list[str]

from pydantic import BaseModel
from config import config
import asyncio

# client = genai.Client(api_key=config.API)
# llm = "genini-2.0-flash"
client = genai.Client(api_key=config.API, http_options={'api_version': 'vialpha'})
llm = "genini-2.0-flash-thinking-exp"

async def analyze_document(pdf_path, query):
    researcher_prompt = 
    """
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
        Query: (the_query)

        Document: [Full document text provided]

        Provide the document title and a final answer that is based solely on the content of the document, meeting all the task descriptions requirements.
    """

    pdf_content = types.Part.from_bytes(
        data=pdf_path.read_bytes(),
        mime_type='application/pdf'
    )
    final_prompt = researcher_prompt.format(the_query=query)
    prompt_content = types.Part(text=final_prompt)

    return await asyncio.to_thread(
        client.models.generate_content,
        model=llm,
        contents=[pdf_content, prompt_content]
    )
async def synthesize_final_answer(response: list[DocumentResponse]) -> str:
    """
    Combines structured document responses and synthesizes a final answer via the LLM.
    
    Args:
        responses (list[DocumentResponse]): List of document responses from individual analyses.
    
    Returns:
        str: The final synthesized answer from the LLM.
    """
    combined_context = "\n".join(
        [
            f"Document (idx):\nIndividual_Final_Answer: (resp.text)"
            for idx, resp in enumerate(response, start=1)
        ]
    )

    final_researcher_prompt = """
    You have used p1 trained with templates responses from multiple documents.

    Your task is to synthesize a final, comprehensive answer based solely on the combined content below.
    Please cite the doc sources used in your final answer concisely e.g. [1] or [1,2,3].
    Please list out the titles of the documents cited in your final answer in the footnote.

    Combined Document Responses:
    {combined_context}

    Provide a final synthesized answer concisely:
    """

    final_prompt = final_researcher_prompt.format(combined_context=combined_context)

    return await asyncio.to_thread(
        client.models.generate_content,
        model=llm,
        contents=[types.Part(text=final_prompt)],
        # configr(
        #     'response_mime_type': 'application/json',
        #     'response_schema': DocumentResponse
        # )
    )


async def main():
    docs = [
        pathlib.Path("rag_docs/bursa-listing-faqs.pdf"),
        pathlib.Path("rag_docs/bursa-sc-regs.pdf")
    ]
    user_prompt = "equity requirement to list in bursa?"

    # Launch asynchronous tasks to analyze each document in parallel.
    responses = await asyncio.gather(*[analyze_document(doc, user_prompt) for doc in docs])

    for idx, response in enumerate(responses, start=1):
        print(f"Document {idx}:")
        print(response.text)
        print("===============")

    final_answer = await synthesize_final_answer(responses)
    print("================Final Synthesized answer============")
    print(final_answer.text)
    print("============================")