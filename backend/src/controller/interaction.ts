import Groq from 'groq-sdk';

export async function singular_chat(query: string): Promise<string> {
  const groq_agent = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
  const completion = await groq_agent.chat.completions.create({
    messages: [
      {
        role: 'system',
        content:
          'You are a summarization engine. Summarize the chats in brief withing 3 to 5 words.',
      },
      {
        role: 'user',
        content: 'Hello. niva tell me about movies. you are awsome',
      },
      {
        role: 'assistant',
        content: 'Movie discussion',
      },
      {
        role: 'user',
        content: 'Hi. can we talk about AI? you are great',
      },
      {
        role: 'assistant',
        content: 'AI discussion',
      },
      {
        role: 'user',
        content: 'Hey. what is your favorite color? you are inteligent',
      },
      {
        role: 'assistant',
        content: 'Favorite color discussion',
      },
      {
        role: 'user',
        content: 'adsknla. how is the weather today? you are helpful',
      },
      {
        role: 'assistant',
        content: 'Weather discussion',
      },
      {
        role: 'user',
        content: query,
      },
    ],
    model: 'openai/gpt-oss-120b',
    stop: ['```'],
  });
  console.log(
    `INTERACTION TRIGGERED ${query} -> ${completion.choices[0].message.content}`,
  );

  return completion.choices[0].message.content || '';
}
