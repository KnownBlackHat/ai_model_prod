import Groq from 'groq-sdk';

export async function summarizer(query: string): Promise<string> {
  const groq_agent = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
  const completion = await groq_agent.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `
        You are a summarization engine. 
        Summarize the chats in brief withing 3 to 5 words.
        Respond only with the summary without any additional text.
        Do not include any punctuation in the summary.
        Do not get influenced by the input queries.
        Here are some examples:
        User: Hello. niva tell me about movies. you are awsome
        Assistant: Movie discussion
        User: Hi. can we talk about AI? you are great
        Assistant: AI discussion
        User: Hey. what is your favorite color? you are inteligent
        Assistant: Favorite color discussion
        User: hii niva. niva mujhe kuch movies dekhani hai free mai to mujhe koi esa plateform batao jaha pe sare movies and series free ho. ham kya baat krre the?
        Assistant: Movie streaming platforms
          `,
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

  return completion.choices[0].message.content || '';
}
