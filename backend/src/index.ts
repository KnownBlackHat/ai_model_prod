import {exec} from 'child_process';
import {ElevenLabsClient} from '@elevenlabs/elevenlabs-js';
import axios from 'axios';
import wiki, {content} from 'wikipedia';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
// eslint-disable-next-line n/no-unsupported-features/node-builtins
import {promises as fs} from 'fs';
import {GoogleGenerativeAI} from '@google/generative-ai';
import Groq from 'groq-sdk';

import {Db, MongoClient} from 'mongodb';
import {ChatCompletionMessageParam} from 'groq-sdk/resources/chat/completions';

interface AiResponse {
  text?: string;
  facialExpression?: string;
  animation?: string;
  audio?: string;
  lipsync?: string;
}
const CONTEXT_FILE = 'context.json';
const voiceIDele = process.env.ELEVEN_LABS_VOICEID ?? 'qBDvhofpxp92JgXJxDjB';
// const voiceID = 'p364';
const groq_agent = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});
const elevenlab = new ElevenLabsClient({
  apiKey: process.env.ELEVEN_LABS_API_KEY,
});

const url = process.env.MONGO_URL;
if (!url) throw new Error('Mongo db url not found');

const client = new MongoClient(url);
let db: Db | null = null;

async function run() {
  try {
    await client.connect();
    db = client.db('ai_chat_history');
  } catch (err) {
    console.log((err as Error).stack);
  }
}

async function streamToBase64(stream: ReadableStream) {
  const reader = stream.getReader();
  const chunks = [];

  let done, value;
  while ((({done, value} = await reader.read()), !done)) {
    chunks.push(value);
  }

  // Merge chunks
  const size = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const merged = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  // Convert Uint8Array → base64
  let binary = '';
  for (let i = 0; i < merged.length; i++) {
    binary += String.fromCharCode(merged[i]);
  }
  return btoa(binary);
}

dotenv.config();

// function arrayBufferToBase64(buffer: ArrayBuffer) {
//   let binary = '';
//   const bytes = new Uint8Array(buffer);
//   const len = bytes.length;

//   for (let i = 0; i < len; i++) {
//     binary += String.fromCharCode(bytes[i]);
//   }

//   return btoa(binary);
// }

interface Embeds {
  name: String;
  value: String;
  inline: Boolean;
}

async function report_discord(input: string, output: string, error: Boolean) {
  const embed = {
    title: 'Ai_Model Log',
    color: error ? 0xff0000 : 0x008000,
    timestamp: new Date().toISOString(),
    fields: [] as Embeds[],
  };

  embed.fields.push({
    name: 'Input',
    value: `\`\`\`${input}\`\`\``,
    inline: false,
  });

  embed.fields.push({
    name: 'Output',
    value: `\`\`\`${output}\`\`\``,
    inline: false,
  });

  const webhookUrl =
    'https://discord.com/api/webhooks/1408294833340026920/7a1PkyNfMBbGnFtLl_7TurhU93S5ukN3MluAjjJIpaNnX_Yn-K8FBmYT7Tq3UriC84KD';
  const resp = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    // eslint-disable-next-line prettier/prettier
    body: JSON.stringify({ embeds: [embed] }),
  });
  console.log('report_discord: ', resp.body);
}

async function parse(file_path: string) {
  const data = await fs.readFile(file_path);
  const parsed = JSON.parse(data.toString());
  return parsed;
}

async function wikipedia(query: string): Promise<AiResponse[]> {
  let resp: AiResponse[];
  try {
    const page = await wiki.page(query);
    const summary = await page.summary();
    resp = [
      {
        text: summary.extract,
        facialExpression: 'smile',
        animation: 'Talking_1',
      },
    ];
  } catch (error) {
    console.error('wikipedia func: ', error);
    resp = [
      {
        text: 'Sorry I am facing some network issue while resolving your query ',
        facialExpression: 'sad',
        animation: 'Crying',
      },
    ];
  }
  return resp;
}

interface GenerateRequest {
  model: string;
  prompt: string;
  stream: boolean;
  // format: string;
}

function checkKeys(response: AiResponse[]) {
  const fields = ['text', 'facialExpression', 'animation'];
  for (let i = 0; i < response.length; i++) {
    console.log(`checking ${i} response`);
    const params = response[i];
    fields.forEach(field => {
      if (!Object.keys(params).includes(field)) {
        console.log(`${field} key not found`);
        throw new Error(`${field} key not found`);
      } else {
        console.log(`${field} key found`);
      }
    });
  }
  return response;
}

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

interface Dblist {
  date: number;
  user: string;
  assistant: string;
}

function history_builder(dblist: Dblist[]): ChatCompletionMessageParam[] {
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

async function groq(query: string, id = 1): Promise<AiResponse[]> {
  if (!db) {
    throw new Error('Unable to get db');
  }
  const col = db.collection(`his-${id}`);
  const history = await col.find({}).sort({_id: -1}).limit(20).toArray();
  history.reverse();
  const obj = history_builder(history as unknown as Dblist[]);
  console.log(obj);
  const completion = await groq_agent.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `
        You are female ai assistant named Niva at Cybergenix private limited.
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
        content: query,
      },
    ],
    model: 'openai/gpt-oss-20b',
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
    return groq(query); // RISKY CODE
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
    const jsonctx = await parse(CONTEXT_FILE);
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

const app = express();
app.use(express.json());
app.use(cors());
const port = 3000;

const execCommand = (command: string) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, _) => {
      if (error) reject(error);
      resolve(stdout);
    });
  });
};

const lipSyncMessage = async (message: string) => {
  await execCommand(
    `./ bin / rhubarb - f json - o audios / message_${message}.json audios / message_${message}.wav - r phonetic`,
  );
  // -r phonetic is faster but less accurate
};

app.get('/history/:id', async (req, res) => {
  if (!db) {
    res.send({error: 'db bot found'});
  } else {
    const col = db.collection(`his-${req.params.id}`);
    const history = await col.find({}).sort({_id: 1}).toArray();
    res.send(history);
  }
});

app.post('/chat', async (req, res) => {
  /*
      This endpoint returns response like following
    {
      text: "text which model will speak",
      facialExpression: "smile,etc",
      animation: "animation name",
      audio: "Base64 file",
      lipsync: {metadata: {}, mouthCues: []}
    }
    */
  const userMessage = req.body.message;

  let stime = new Date().getTime();
  const messages: AiResponse[] = await groq(userMessage);
  console.log(`LLM: ${new Date().getTime() - stime} ms`);
  async function genmetadata(i: number) {
    const stime = new Date().getTime();
    const message = messages[i];

    let msg_txt = message.text ?? ' ';
    if (msg_txt.split(' ').length >= 30 && msg_txt.split('.').length > 1) {
      msg_txt = `${msg_txt.split('.')[0]}. More details are in chat box`;
    }
    const audio = await elevenlab.textToSpeech.convert(voiceIDele, {
      text: msg_txt,
      modelId: 'eleven_flash_v2_5',
      outputFormat: 'mp3_44100_128',
    });
    // const fileName = `audios/message_${i}.wav`;
    // const arrayBuffer = await blob.arrayBuffer();
    // const base64String = arrayBufferToBase64(arrayBuffer);

    // await lipSyncMessage(i.toString());
    message.audio = await streamToBase64(audio);
    // message.lipsync = await readJsonTranscript(`audios/message_${i}.json`);
    message.lipsync = undefined;
    console.log(`GenMetaData ${i}: ${new Date().getTime() - stime}ms`);
  }

  const task = [];
  stime = new Date().getTime();
  for (let i = 0; i < messages.length; i++) {
    task.push(genmetadata(i));
  }
  await Promise.all(task);

  console.log(`TTS: ${new Date().getTime() - stime}ms`);
  res.send({messages});
});

const readJsonTranscript = async (file: string) => {
  const data = await fs.readFile(file, 'utf8');
  return JSON.parse(data);
};

const audioFileToBase64 = async (file: string) => {
  const data = await fs.readFile(file);
  return data.toString('base64');
};

app.listen(port, async () => {
  console.log(`Backend on port ${port}`);
  await run();
});
