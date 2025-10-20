import {ElevenLabsClient} from '@elevenlabs/elevenlabs-js';
import cors from 'cors';
import dotenv from 'dotenv';
import express, {
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from 'express';

import {Db, MongoClient} from 'mongodb';
import {streamToBase64} from './helper';
import {groq} from './llm_interface';
import jwt from 'jsonwebtoken';
import {expend_credit, get_credit} from './controller/credits';
import {get_gist_name} from './controller/misc';
import {login, signup} from './controller/user';
import {create_ids, delete_ids, get_ids} from './controller/conversation';

const voiceIDele = process.env.ELEVEN_LABS_VOICEID ?? 'qBDvhofpxp92JgXJxDjB';

const elevenlab = new ElevenLabsClient({
  apiKey: process.env.ELEVEN_LABS_API_KEY,
});

const url = process.env.MONGO_URL;
if (!url) throw new Error('Mongo db url not found');

const client = new MongoClient(url);
let db: Db | undefined = undefined;

async function run() {
  try {
    await client.connect();
    db = client.db('ai_chat_history');
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
  user?: {username: string};
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
        const decoded = jwt.verify(token, secret) as {username: string};
        req.user = decoded;
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

  if (!db) {
    return res.status(500).send({
      error: 'Database not found',
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

  if (!db) {
    return res.status(500).send({error: 'Database not found'});
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
  if (!db) {
    res.send({
      error: 'db bot found',
    });
  } else {
    const col = db.collection(`his-${req.params.id}`);
    const history = await col
      .find({})
      .sort({
        _id: 1,
      })
      .toArray();
    res.send(history);
  }
});

app.get('/:user/ids', async (req, res) => {
  if (!db) {
    res.send({
      error: 'db not found',
    });
  } else {
    await get_ids(req.params.user, res);
  }
});

app.get('/:user/ids/create', async (req, res) => {
  if (!db) {
    res.send({
      error: 'db not found',
    });
  } else {
    await create_ids(req.params.user, res);
  }
});

app.get('/:user/:id/delete', async (req, res) => {
  if (!db) {
    res.send({
      error: 'db not found',
    });
  } else {
    await delete_ids(req.params.user, req.params.id, res);
  }
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
  const decoded = jwt.verify(token || '', secret || '') as {username: string};
  const is_expended = await expend_credit(db as Db, decoded.username, 1);
  if (!is_expended) {
    res.status(402).send({
      error: 'Not enough credits',
    });
    return;
  }

  const userMessage = req.body.message;

  let stime = new Date().getTime();
  const messages: AiResponse[] = await groq(userMessage, db, req.params.id);
  console.log(`LLM: ${new Date().getTime() - stime} ms`);
  async function genmetadata(i: number) {
    const stime = new Date().getTime();
    const message = messages[i];

    const audio = await elevenlab.textToSpeech.convert(voiceIDele, {
      text: message.text ?? '',
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

app.get('/credits', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  const decoded = jwt.verify(token || '', secret || '') as {username: string};
  if (!db) {
    res.send({
      error: 'db not found',
    });
  }
  res.send({
    credits: await get_credit(db as Db, decoded.username),
  });
});

app.get('/gist_name/:id', async (req, res) => {
  if (!db) {
    res.send({
      error: 'db not found',
    });
  }
  await get_gist_name(db as Db, req.params.id);
});

app.listen(port, async () => {
  await run();
  console.log(`Backend on port ${port}`);
});
