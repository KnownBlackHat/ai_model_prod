import {ElevenLabsClient} from '@elevenlabs/elevenlabs-js';
import cors from 'cors';
import dotenv from 'dotenv';
import express, {
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from 'express';

import {Db, MongoClient, ObjectId} from 'mongodb';
import {streamToBase64} from './helper';
import {groq} from './llm_interface';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import {expend_credit, get_credit} from './controller/credits';

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
  const {username, password} = req.body as {
    username?: string;
    password?: string;
  };
  if (!username || !password) {
    return res.status(400).send({
      error: 'Username and password are required',
    });
  }

  if (!db) {
    return res.status(500).send({
      error: 'Database not found',
    });
  }

  const usersCol = db.collection('users');
  const existingUser = await usersCol.findOne({
    username,
  });
  if (existingUser) {
    return res.status(400).send({
      error: 'Username already taken',
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await usersCol.insertOne({
    username,
    password: hashedPassword,
    credits: 100,
  });
  res.send({
    status: 'ok',
  });
});

app.post('/login', async (req: Request, res: Response): Promise<any> => {
  const {username, password} = req.body as {
    username?: string;
    password?: string;
  };
  if (!username || !password) {
    return res.status(400).send({error: 'Username and password are required'});
  }

  if (!db) {
    return res.status(500).send({error: 'Database not found'});
  }

  const usersCol = db.collection('users');
  const user = (await usersCol.findOne({username})) as {
    username: string;
    password: string;
  } | null;
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).send({error: 'Invalid credentials'});
  }

  const token = jwt.sign({username: user.username}, secret, {expiresIn: '1h'});
  res.send({token});
});

app.get('/user', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  const decoded = jwt.verify(token || '', secret || '') as {username: string};
  res.send({username: decoded.username});
});

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
    const col = db.collection('ids');
    const ids = await col
      .find({
        user: req.params.user,
      })
      .sort({_id: -1})
      .toArray();

    const ids_arr = [];
    for (const id of ids) {
      if (id.user === req.params.user) {
        ids_arr.push(id._id);
      }
    }
    res.send(ids_arr);
  }
});

app.get('/:user/ids/create', async (req, res) => {
  if (!db) {
    res.send({
      error: 'db not found',
    });
  } else {
    const col = db.collection('ids');
    const resp = await col.insertOne({
      user: req.params.user,
    });

    res.send({
      status: 'ok',
      id: resp.insertedId,
    });
  }
});

app.get('/:user/:id/delete', async (req, res) => {
  if (!db) {
    res.send({
      error: 'db not found',
    });
  } else {
    const col = db.collection('ids');
    await col.deleteOne({
      user: req.params.user,
      _id: new ObjectId(req.params.id),
    });

    const hCol = db.collection(`his-${req.params.id}`);
    await hCol.drop();

    res.send({
      status: 'ok',
    });
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

app.listen(port, async () => {
  await run();
  console.log(`Backend on port ${port}`);
});
