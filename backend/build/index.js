"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const axios_1 = __importDefault(require("axios"));
const wikipedia_1 = __importDefault(require("wikipedia"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
// eslint-disable-next-line n/no-unsupported-features/node-builtins
const fs_1 = require("fs");
const generative_ai_1 = require("@google/generative-ai");
const groq_sdk_1 = __importDefault(require("groq-sdk"));
const CONTEXT_FILE = 'context.json';
// const voiceID = '9BWtsMINqrJLrRacOk9x';
const voiceID = 'p364';
const groq_agent = new groq_sdk_1.default({ apiKey: process.env.GROQ_API_KEY });
dotenv_1.default.config();
// function arrayBufferToBase64(buffer: ArrayBuffer) {
//   let binary = '';
//   const bytes = new Uint8Array(buffer);
//   const len = bytes.length;
//   for (let i = 0; i < len; i++) {
//     binary += String.fromCharCode(bytes[i]);
//   }
//   return btoa(binary);
// }
function parse(file_path) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield fs_1.promises.readFile(file_path);
        const parsed = JSON.parse(data.toString());
        return parsed;
    });
}
function generateRandomLine() {
    const lines = [
        {
            text: 'Hi, I’m Millie. I provide information about the Galgotias tech council and upcoming events and activities.',
            facialExpression: 'default',
            animation: 'Talking_0',
        },
        {
            text: 'Hello, I’m Millie. I’m here to assist you with details about the Galgotias tech council and upcoming fests.',
            facialExpression: 'default',
            animation: 'Talking_1',
        },
        {
            text: 'Hi, I’m Millie. I’m designed to help with university-related queries.',
            facialExpression: 'default',
            animation: 'Talking_2',
        },
        {
            text: 'Hello, I’m Millie. I offer real-time information on the Galgotias tech council and events.',
            facialExpression: 'default',
            animation: 'Talking_0',
        },
        {
            text: 'Hi, I’m Millie. I’m here to provide quick, accurate answers regarding university activities.',
            facialExpression: 'smile',
            animation: 'Talking_1',
        },
        {
            text: 'Hello, I’m Millie. I assist with inquiries related to Galgotias’s upcoming fests and initiatives.',
            facialExpression: 'default',
            animation: 'Talking_2',
        },
        {
            text: 'Hi, I’m Millie. I provide detailed responses about university events, fests, and more.',
            facialExpression: 'surprised',
            animation: 'Talking_0',
        },
        {
            text: 'Hello, I’m Millie. I’m your go-to for any information regarding Galgotias functions and events.',
            facialExpression: 'smile',
            animation: 'Talking_1',
        },
        {
            text: 'Hi, I’m Millie. I’m designed to assist with queries related to Galgotias’s activities and fests.',
            facialExpression: 'default',
            animation: 'Talking_2',
        },
        {
            text: 'Hello, I’m Millie. I provide accessible, real-time answers about the university’s events and initiatives.',
            facialExpression: 'smile',
            animation: 'Talking_0',
        },
    ];
    const randomIndex = Math.floor(Math.random() * lines.length);
    return lines[randomIndex];
}
function wikipedia(query) {
    return __awaiter(this, void 0, void 0, function* () {
        let resp;
        try {
            const page = yield wikipedia_1.default.page(query);
            const summary = yield page.summary();
            resp = [
                {
                    text: summary.extract,
                    facialExpression: 'smile',
                    animation: 'Talking_1',
                },
            ];
        }
        catch (error) {
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
    });
}
function checkKeys(response) {
    const fields = ['text', 'facialExpression', 'animation'];
    for (let i = 0; i < response.length; i++) {
        console.log(`checking ${i} response`);
        const params = response[i];
        fields.forEach(field => {
            if (!Object.keys(params).includes(field)) {
                console.log(`${field} key not found`);
                throw new Error(`${field} key not found`);
            }
            else {
                console.log(`${field} key found`);
            }
        });
    }
    return response;
}
function ollama(request) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`user: ${request.prompt}`);
        if (request.prompt.includes('intro') && request.prompt.includes('yourself')) {
            console.log(`Auto response: ${request.prompt}`);
            return [generateRandomLine()];
        }
        try {
            const response = yield axios_1.default.post(`${process.env.OLLAMA_SERVER}/api/generate`, request);
            const resp = response.data.response;
            console.log(`Ollama: ${resp}`);
            try {
                const response = JSON.parse(resp);
                checkKeys(response);
                // const {text, facialExpression, animation, audio, lipsync} = response;
                // const toCheck = [text, facialExpression, animation, audio, lipsync];
                // for (let i = 0; i < toCheck.length; i++) {
                //   if (isNaN(toCheck[i])) throw Error();
                // }
                return response;
            }
            catch (_a) {
                return [
                    {
                        text: 'Sorry i was not able to hear you, could you please repeat your query!',
                        facialExpression: 'sad',
                        animation: 'Crying',
                    },
                ];
            }
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                console.error(`Error: ${error.message}`);
            }
            else {
                console.error(`Unexpected error: ${error}`);
            }
            throw error;
        }
    });
}
function groq(query) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const completion = yield groq_agent.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: `
        You are a chatbot for Cybergenix, responsible for sharing details about events involving our product, Niva, at Cybergenix private limited.
        Rely solely on the provided context for recent information. Use a formal tone, avoiding asterisks or emojis.
        Respond with a JSON array containing up to two messages, each with a text, facialExpression, and animation property. Available facial expressions are: smile, sad, angry, surprised, funnyFace, and default. Available animations are: Talking_0, Talking_1, Talking_2, Crying, Laughing, Rumba, Idle, Terrified, and Angry.
        Respond accordingly and provide a json output containing following keys:
          - 'text' it will contain the reply which niva will speak.
          - 'facialExpression' it will contain the value from these: smile, sad, angry, surprised, funnyFace, and default.
          - 'animation' it will contain the value from these: Talking_0, Talking_1, Talking_2, Crying, Laughing, Rumba, Idle, Terrified, and Angry.
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
                    content: query,
                },
            ],
            model: 'openai/gpt-oss-20b',
            stop: ['```'],
        });
        const raw_response = ((_b = (_a = completion.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) || '';
        try {
            const response = JSON.parse(raw_response);
            checkKeys(response);
            console.log('groq: ', response);
            return response;
        }
        catch (e) {
            console.log('error:', e);
            return [
                {
                    text: 'Sorry i was not able to hear you, could you please repeat your query!',
                    facialExpression: 'sad',
                    animation: 'Crying',
                },
            ];
        }
    });
}
function gemini_chat(query) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('Gemini api key not defined');
        }
        console.log(`user: ${query}`);
        if (query.includes('intro') && query.includes('yourself')) {
            return [generateRandomLine()];
        }
        let resp;
        try {
            const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({
                model: 'gemini-1.5-pro-002',
                systemInstruction: `
      You are a chat bot of galgotias university who provides details about an event taking place in our college.
        take recent info from context given. don't include * in text or any emoji, and be formal
        You will always reply with a JSON array of messages. With a maximum of 2 messages. and don't quote it with \`\`\`json and message should be concise
        Each message has a text, facialExpression, and animation property.
        The different facial expressions are: smile, sad, angry, surprised, funnyFace, and default.
        The different animations are: Talking_0, Talking_1, Talking_2, Crying, Laughing, Rumba, Idle, Terrified, and Angry.
        `,
            });
            const jsonctx = yield parse(CONTEXT_FILE);
            const chat = model.startChat({
                history: jsonctx,
            });
            const result = yield chat.sendMessage(query);
            console.log(`gemini: ${result.response.text()}`);
            resp = JSON.parse(result.response.text());
        }
        catch (e) {
            console.error('gemini_chat func: ', e);
            resp = yield wikipedia(query);
            console.log(`wiki: ${JSON.stringify(resp)}`);
        }
        return resp;
    });
}
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
const port = 3000;
const execCommand = (command) => {
    return new Promise((resolve, reject) => {
        (0, child_process_1.exec)(command, (error, stdout, _) => {
            if (error)
                reject(error);
            resolve(stdout);
        });
    });
};
const lipSyncMessage = (message) => __awaiter(void 0, void 0, void 0, function* () {
    yield execCommand(`./bin/rhubarb -f json -o audios/message_${message}.json audios/message_${message}.wav -r phonetic`);
    // -r phonetic is faster but less accurate
});
app.post('/chat', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
    const messages = yield groq(userMessage);
    console.log(`LLM: ${new Date().getTime() - stime}ms`);
    function genmetadata(i) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const stime = new Date().getTime();
            const message = messages[i];
            const url = `http://loadbalancer:4000/api/tts?text=${encodeURI((_a = message.text) !== null && _a !== void 0 ? _a : '')}&speaker_id=${voiceID}&style_wav=&language_id=`;
            // write this wav file into a file
            const fileName = `audios/message_${i}.wav`;
            const resp = yield axios_1.default.get(url, {
                method: 'get',
                url,
                responseType: 'stream',
            });
            yield fs_1.promises.writeFile(fileName, resp.data);
            // const arrayBuffer = await blob.arrayBuffer();
            // const base64String = arrayBufferToBase64(arrayBuffer);
            yield lipSyncMessage(i.toString());
            message.audio = yield audioFileToBase64(fileName);
            // message.audio = base64String;
            message.lipsync = yield readJsonTranscript(`audios/message_${i}.json`);
            // message.lipsync = undefined;
            console.log(`GenMetaData ${i}: ${new Date().getTime() - stime}ms`);
        });
    }
    const task = [];
    stime = new Date().getTime();
    for (let i = 0; i < messages.length; i++) {
        task.push(genmetadata(i));
    }
    yield Promise.all(task);
    console.log(`TTS: ${new Date().getTime() - stime}ms`);
    res.send({ messages });
}));
const readJsonTranscript = (file) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield fs_1.promises.readFile(file, 'utf8');
    return JSON.parse(data);
});
const audioFileToBase64 = (file) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield fs_1.promises.readFile(file);
    return data.toString('base64');
});
app.listen(port, () => {
    console.log(`Backend on port ${port}`);
});
