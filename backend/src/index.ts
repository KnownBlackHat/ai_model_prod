import {ElevenLabsClient} from '@elevenlabs/elevenlabs-js';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

import {Db, MongoClient, ObjectId} from 'mongodb';
import {streamToBase64} from './helper';
import {groq} from './llm_interface';

const voiceIDele = process.env.ELEVEN_LABS_VOICEID ?? 'qBDvhofpxp92JgXJxDjB';

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

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
const port = 3000;

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

  const userMessage = req.body.message;

  let stime = new Date().getTime();
  const messages: AiResponse[] = await groq(userMessage, req.params.id);
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

app.listen(port, async () => {
  console.log(`Backend on port ${port}`);
  await run();
});
