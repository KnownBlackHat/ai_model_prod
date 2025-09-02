import axios from 'axios';
import {ChatCompletionMessageParam} from 'groq-sdk/resources/chat/completions';
import {GoogleGenerativeAI} from '@google/generative-ai';
import {parse, checkKeys, report_discord, wikipedia} from './helper';
import Groq from 'groq-sdk';
import {Db} from 'mongodb';

const groq_agent = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const db: Db | null = null;

async function ollama(request: GenerateRequest): Promise<AiResponse[]> {
  console.log(`user: ${request.prompt}`);
  try {
    const response = await axios.post(
      `${process.env.OLLAMA_SERVER}/api/generate`,
      request,
    );
    const resp = response.data.response;
    console.log(`Ollama: ${resp}`);

    try {
      const response: AiResponse[] = JSON.parse(resp);
      checkKeys(response);

      // const {text, facialExpression, animation, audio, lipsync} = response;
      // const toCheck = [text, facialExpression, animation, audio, lipsync];
      // for (let i = 0; i < toCheck.length; i++) {
      //   if (isNaN(toCheck[i])) throw Error();
      // }

      return response;
    } catch {
      return [
        {
          text: 'Sorry i was not able to hear you, could you please repeat your query!',
          facialExpression: 'sad',
          animation: 'Crying',
        },
      ];
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error(`Unexpected error: ${error}`);
    }
    throw error;
  }
}

function groq_history_builder(dblist: Dblist[]): ChatCompletionMessageParam[] {
  const response: ChatCompletionMessageParam[] = [];
  for (const dbent of dblist) {
    response.push({
      role: 'user',
      content: dbent.user,
    });
    response.push({
      role: 'assistant',
      content: dbent.assistant,
    });
  }
  return response;
}

export async function groq(query: string, id = '1'): Promise<AiResponse[]> {
  if (!db) {
    throw new Error('Unable to get db');
  }
  const col = db.collection(`his-${id}`);
  const history = await col.find({}).sort({_id: -1}).limit(20).toArray();
  history.reverse();
  const obj = groq_history_builder(history as unknown as Dblist[]);
  console.log(obj);
  const completion = await groq_agent.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `
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

`,
      },
      {
        role: 'user',
        content: 'tell me about yourself',
      },
      {
        role: 'assistant',
        content: `
        [
          {
            text: 'Hello! My name is Niva an ai assistant made by cybergenix private limited!',
            facialExpression: 'smile',
            animation: 'Talking_0',
          },
          {
            text: "Why don't you tell me about yourself, would really like to know about yourself!",
            facialExpression: 'surprised',
            animation: 'Talking_1',
          },
        ]
        `,
      },
      {
        role: 'user',
        content: 'what is stock price',
      },
      {
        role: 'assistant',
        content: `
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
        `,
      },
      ...obj,
      {
        role: 'user',
        content: query.slice(0, 500),
      },
    ],
    model: 'openai/gpt-oss-120b',
    stop: ['```'],
  });
  const raw_response = completion.choices[0]?.message?.content || '';
  try {
    const response: AiResponse[] = JSON.parse(raw_response);
    checkKeys(response);
    console.log('groq: ', response);
    await report_discord(query, JSON.stringify(response), false);
    await col.insertOne({
      date: Date.now(),
      user: query,
      assistant: JSON.stringify(response),
    });
    return response;
  } catch (e) {
    console.log('error:', e);
    await report_discord(
      query,
      `
      Error: ${e}
      Raw Response: ${raw_response}
      `,
      true,
    );
    return groq(query, id); // RISKY CODE
    return [
      {
        text: 'Sorry i was not able to hear you, could you please repeat your query!',
        facialExpression: 'sad',
        animation: 'Crying',
      },
    ];
  }
}

async function gemini_chat(query: string): Promise<AiResponse[]> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Gemini api key not defined');
  }

  console.log(`user: ${query}`);

  let resp: AiResponse[];

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-pro-002',
      systemInstruction: `
      You are a chat bot of galgotias university who provides details about an event taking place in our college.
        take recent info from context given.don't include * in text or any emoji, and be formal
        You will always reply with a JSON array of messages.With a maximum of 2 messages.and don't quote it with \`\`\`json and message should be concise
        Each message has a text, facialExpression, and animation property.
        The different facial expressions are: smile, sad, angry, surprised, funnyFace, and default.
        The different animations are: Talking_0, Talking_1, Talking_2, Crying, Laughing, Rumba, Idle, Terrified, and Angry.
        `,
    });
    const jsonctx = await parse('../context.json');
    const chat = model.startChat({
      history: jsonctx,
    });
    const result = await chat.sendMessage(query);
    console.log(`gemini: ${result.response.text()} `);
    resp = JSON.parse(result.response.text());
  } catch (e) {
    console.error('gemini_chat func: ', e);
    resp = await wikipedia(query);
    console.log(`wiki: ${JSON.stringify(resp)} `);
  }
  return resp;
}
