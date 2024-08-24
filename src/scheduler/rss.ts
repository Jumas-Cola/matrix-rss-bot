import { LogService, MatrixClient } from 'matrix-bot-sdk';
import * as htmlEscape from 'escape-html';
import * as Parser from 'rss-parser';
import * as path from 'path';
import config from '../config';
import * as fs from 'fs';

export async function runSendFeedTask(client: MatrixClient) {
  const storageFilePath = path.join(config.dataPath, 'bot.json');
  const data = fs.readFileSync(storageFilePath, 'utf-8');
  const storageData = JSON.parse(data); // Возвращаем объект с данными
  const filteredStorage = Object.entries(storageData.kvStore).filter(item => {
    const [k, v] = item;
    return k.startsWith('rss-');
  });
  let parser = new Parser();
  for (let item of filteredStorage) {
    const [key, value] = item;
    const roomId = key.replace(/^rss-/i, '');
    let feeds = JSON.parse(`${value}`);

    for (let feed of feeds) {
      const feedUrl = feed.url;
      LogService.info('index', `Fetching feed ${feedUrl}`);
      let news = await getFeedNews(feedUrl, parser);
      let lastCheck = feed?.lastCheck
        ? new Date(Date.parse(feed.lastCheck))
        : null;

      for (let newsItem of news) {
        const newsDate = new Date(Date.parse(newsItem.isoDate));
        if (lastCheck === null || newsDate > lastCheck) {
          await sendNews(roomId, client, newsItem);
        }
      }

      lastCheck = new Date();

      await setLastCheckDate(roomId, client, lastCheck);
    }
  }
}

async function getFeedNews(feedUrl: string, parser: Parser): Promise<any[]> {
  let feed = await parser.parseURL(feedUrl);
  return feed.items.reverse();
}

async function setLastCheckDate(
  roomId: string,
  client: MatrixClient,
  lastCheck: Date,
) {
  let storage = client.storageProvider;
  let currentRssStr = await storage.readValue(`rss-${roomId}`);
  let currentRss = [];
  if (currentRssStr) {
    currentRss = JSON.parse(currentRssStr);
  }
  currentRss = currentRss.map(item => {
    return { ...item, lastCheck: lastCheck };
  });
  storage.storeValue(`rss-${roomId}`, JSON.stringify(currentRss));
}

async function sendNews(roomId: string, client: MatrixClient, newsItem: any) {
  let title = newsItem.title;
  let link = newsItem.link;
  let content = newsItem.content;
  let pubDate = new Date(Date.parse(newsItem.pubDate));

  let html = `<h4>${htmlEscape(title)}</h4>`;
  if (content) {
    html += `<p>${htmlEscape(content)}</p>`;
  }

  html += `<a href="${link}">${link}</a>
    <p>${pubDate.toLocaleDateString('ru-RU')}</p>`;

  await client.sendMessage(roomId, {
    msgtype: 'm.notice',
    format: 'org.matrix.custom.html',
    formatted_body: html,
  });
}
