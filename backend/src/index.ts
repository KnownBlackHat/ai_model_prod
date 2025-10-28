import {ElevenLabsClient} from '@elevenlabs/elevenlabs-js';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs/promises';

import express, {
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from 'express';

import {
  execCommand,
  lipSyncMessage,
  readJsonTranscript,
  streamToArrayBufferView,
  streamToBase64,
} from './helper';
import {groq} from './llm_interface';
import jwt from 'jsonwebtoken';
import {expend_credit, get_credit} from './controller/credits';
import {login, signup} from './controller/user';
import {create_ids, delete_ids, get_ids} from './controller/conversation';
import {get_messages} from './controller/message';
import {prisma} from './constants';

const voiceIDele = process.env.ELEVEN_LABS_VOICEID ?? 'qBDvhofpxp92JgXJxDjB';

const elevenlab = new ElevenLabsClient({
  apiKey: process.env.ELEVEN_LABS_API_KEY,
});

async function run() {
  try {
    await prisma.$connect();
    console.log('connected to db');
  } catch (err) {
    console.log('Failed to connect');
    console.log((err as Error).stack);
  } finally {
    console.log('connection procedure completed');
  }
}

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use((req, res, next) => {
  console.log('req: ', req.path, 'resp: ', res.statusCode);
  next();
});
const secret = process.env.JWT_SECRET || '';
const port = 3000;

interface AuthRequest extends Request {
  email?: {email: string};
}

function asyncHandler<R extends Request = Request>(
  fn: (req: R, res: Response, next: NextFunction) => Promise<any>,
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req as unknown as R, res, next).catch(next);
  };
}

const authenticate = asyncHandler<AuthRequest>(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.originalUrl === '/signup' || req.originalUrl === '/login') {
      next();
    } else {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (!token) {
        res.status(401).send({error: 'No token provided'});
        return;
      }

      try {
        const decoded = jwt.verify(token, secret) as {email: string};
        req.email = decoded;
        next();
      } catch (err) {
        res.status(403).send({error: 'Invalid token'});
      }
    }
  },
);

app.use(authenticate);

app.post('/signup', async (req: Request, res: Response): Promise<any> => {
  const {email, name, sub} = req.body as {
    email?: string;
    name?: string;
    sub?: string;
  };
  if (!email || !sub || !name) {
    return res.status(400).send({
      error: 'email, sub, name are required',
    });
  }

  return await signup(sub, email, name, res);
});

app.post('/login', async (req: Request, res: Response): Promise<any> => {
  const {email, sub} = req.body as {
    email?: string;
    sub?: string;
  };
  if (!email || !sub) {
    return res.status(400).send({error: 'email and sub are required'});
  }

  return await login(email, sub, res);
});

// app.get('/user', async (req, res) => {
//   const authHeader = req.headers['authorization'];
//   const token = authHeader && authHeader.split(' ')[1];
//   const decoded = jwt.verify(token || '', secret || '') as { username: string };
//   res.send({ username: decoded.username });
// });

app.get('/history/:id', async (req, res) => {
  await get_messages(req.params.id, res);
});

app.get('/:user/ids', async (req, res) => {
  await get_ids(req.params.user, res);
});

app.get('/:user/ids/create', async (req, res) => {
  await create_ids(req.params.user, res);
});

app.get('/:user/:id/delete', async (req, res) => {
  await delete_ids(req.params.user, req.params.id, res);
});

app.post('/chat/:id', async (req, res) => {
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

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  const decoded = jwt.verify(token || '', secret || '') as {email: string};
  const is_expended = await expend_credit(decoded.email, 1);
  if (!is_expended) {
    res.status(402).send({
      error: 'Not enough credits',
    });
    return;
  }

  const userMessage = req.body.message;

  let stime = new Date().getTime();
  const messages: AiResponse[] = await groq(userMessage, req.params.id);
  async function genmetadata(i: number) {
    const stime = new Date().getTime();
    const message = messages[i];

    const audio = await elevenlab.textToSpeech.convert(voiceIDele, {
      text: message.text ?? '',
      modelId: 'eleven_flash_v2_5',
      outputFormat: 'mp3_44100_128',
    });

    const fileName = `audios/${req.params.id}_${i}.wav`;
    const audioBuffer = await streamToArrayBufferView(audio);
    try {
      await fs.writeFile(fileName, audioBuffer);
    } catch (e) {
      console.log('error file write: ', e);
    }
    // const arrayBuffer = await blob.arrayBuffer();
    // const base64String = arrayBufferToBase64(arrayBuffer);

    await lipSyncMessage(i.toString(), req.params.id);

    message.audio = Buffer.from(audioBuffer).toString('base64');
    message.lipsync = await readJsonTranscript(
      `audios/_${req.params.id}_${i}.json`,
    );

    // message.lipsync = undefined;
    console.log(`GenMetaData ${i}: ${new Date().getTime() - stime}ms`);
    await execCommand(`rm -rf audios/_${req.params.id}_* `);
    await execCommand(`rm -rf audios/${req.params.id}_* `);
  }

  const task = [];
  stime = new Date().getTime();
  for (let i = 0; i < messages.length; i++) {
    task.push(genmetadata(i));
  }
  await Promise.all(task);

  res.send({messages});
});

app.get('/credits', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  const decoded = jwt.verify(token || '', secret || '') as {email: string};
  await get_credit(decoded.email, res);
});

app.listen(port, async () => {
  await run();
  console.log(`Backend on port ${port}`);
});
