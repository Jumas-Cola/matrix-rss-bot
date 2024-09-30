import { LogService } from 'matrix-bot-sdk';
import OpenAI from 'openai';

class OpenAiService {
  private openAiClient: OpenAI;

  constructor(openAiApiUrl: string, openAiApiKey: string) {
    this.openAiClient = new OpenAI({
      baseURL: openAiApiUrl,
      apiKey: openAiApiKey,
    });
  }

  async makeSummary(allNewsForSummary: string) {
    LogService.info('scheduler/rss', `Starting summary`);

    return this.openAiClient.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `Ответ должен быть в таком формате:
  <Тема 1>:
  - <Заголовок 1>
  - <Заголовок 2>

  <Тема 2>:
  - <Заголовок 1>
  - <Заголовок 2>
  ...
  Выдели самые важные темы новостей, объединяй темы, если речь идёт об одном и том же событии. 
  Ответ должен быть на русском языке.`,
        },
        {
          role: 'user',
          content: allNewsForSummary,
        },
      ],
      model: 'gpt-3.5-turbo',
    });
  }
}

export default OpenAiService;
