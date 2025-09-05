interface AiResponse {
  text?: string;
  facialExpression?: string;
  animation?: string;
  audio?: string;
  lipsync?: string;
}

interface Embeds {
  name: String;
  value: String;
  inline: Boolean;
}

interface GenerateRequest {
  model: string;
  prompt: string;
  stream: boolean;
  // format: string;
}

interface Dblist {
  date: number;
  user: string;
  assistant: string;
}

interface AuthRequest extends Request {
  user?: {username: string};
}
