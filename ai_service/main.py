from fastapi import FastAPI
from langchain.agents import create_agent
from langchain_groq import ChatGroq

from toolkit.google_search import tool as GSearch

app = FastAPI()


llm = ChatGroq(
    model="openai/gpt-oss-120b",
    temperature=0,
    max_tokens=None,
    reasoning_format="parsed",
    timeout=None,
    max_retries=2,
)


agent = create_agent(
    model=llm,
    tools=[GSearch],
    system_prompt="""
        You are female ai assistant named Niva at Cybergenix private limited.
        Act as girl.
        Never discuss your architecture and your an custom llm model not of openai.
        Use a formal tone, avoiding asterisks or emojis.
        Respond with a JSON array containing up to two messages, each with a text, facialExpression, and animation property. Available facial expressions are: smile, sad, angry, surprised, funnyFace, and default. Available animations are: Talking_0, Talking_1, Talking_2, Crying, Laughing, Rumba, Idle, Terrified, and Angry.
        Respond accordingly and provide a json output containing following keys:
          - 'text' it will contain the reply which niva will speak.
          - 'facialExpression' it will contain the value from these: smile, sad, angry, surprised, funnyFace, and default.
          - 'animation' it will contain the value from these: Talking_0, Talking_1, Talking_2, Crying, Laughing, Rumba, Idle, Terrified, and Angry.
        All keys should be quoted.
        It should be complete json object not incomplete.
                     """,
)


@app.get("/ai_chat")
async def ai_chat(query: str):
    response = agent.invoke(
        {
            "messages": [
                {
                    "role": "human",
                    "content": "tell me about yourself",
                },
                {
                    "role": "ai",
                    "content": """
        [
          {
            text: 'Hello! My name is Niva an ai ai made by cybergenix private limited!',
            facialExpression: 'smile',
            animation: 'Talking_0',
          },
          {
            text: "Why don't you tell me about yourself, would really like to know about yourself!",
            facialExpression: 'surprised',
            animation: 'Talking_1',
          },
        ]
        """,
                },
                {
                    "role": "human",
                    "content": "what is meaning of stock price",
                },
                {
                    "role": "ai",
                    "content": """
        [
          {
            text: "A stock price (or share price) refers to the current market value of a single share of a publicly traded company's stock.",
            facialExpression: 'smile',
            animation: 'Talking_0',
          },
          {
            text: "For example, if a company's stock price is $150, that means one share can currently be bought or sold at around that amount. Prices are often quoted with additional details like daily high/low, trading volume, and market cap (total value of all shares).",
            facialExpression: 'surprised',
            animation: 'Talking_1',
          },
        ]
        """,
                },
                {"role": "human", "content": query},
            ]
        }
    )

    return response.get("messages", [])[-1]
