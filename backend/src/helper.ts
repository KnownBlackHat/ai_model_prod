import axios from 'axios';
import { exec } from 'child_process';
import wiki from 'wikipedia';
import * as fs from 'fs';

export function checkKeys(response: AiResponse[]) {
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

export async function streamToBase64(stream: ReadableStream) {
  const reader = stream.getReader();
  const chunks = [];

  let done, value;

  while ((({ done, value } = await reader.read()), !done)) {
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

export async function report_discord(
  input: string,
  output: string,
  error: Boolean,
) {
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

export async function parse(file_path: string) {
  // eslint-disable-next-line n/no-unsupported-features/node-builtins
  const data = await fs.promises.readFile(file_path);
  const parsed = JSON.parse(data.toString());
  return parsed;
}

export async function wikipedia(query: string): Promise<AiResponse[]> {
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

const lipSyncMessage = async (message: string) => {
  await execCommand(
    `./ bin / rhubarb - f json - o audios / message_${message}.json audios / message_${message}.wav - r phonetic`,
  );
  // -r phonetic is faster but less accurate
};

const execCommand = (command: string) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, _) => {
      if (error) reject(error);
      resolve(stdout);
    });
  });
};

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.length;

  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
}

// async function readJsonTranscript(file: string) {
//   return JSON.parse(fs.readFile(file, 'utf8') || '');
// }

// const audioFileToBase64 = async (file: string) => {
//   const data = fs.readFile(file);
//   return data.toString('base64');
// };
