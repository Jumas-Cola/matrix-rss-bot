import { LogService } from 'matrix-bot-sdk';
import OpenAI from 'openai';

class OpenAiService {
  private openAiClient: OpenAI;
  private model = 'gpt-3.5-turbo';

  constructor(
    openAiApiUrl: string,
    openAiApiKey: string | null,
    openAiApiModel?: string,
  ) {
    let config = {
      baseURL: openAiApiUrl,
    };
    if (openAiApiKey) {
      config['apiKey'] = openAiApiKey;
    }
    this.openAiClient = new OpenAI(config);
    this.model = openAiApiModel || this.model;
  }

  async makeSummary(allNewsForSummary: string) {
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
      model: this.model,
    });
  }
}

export default OpenAiService;
