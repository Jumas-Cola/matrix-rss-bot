import { LogService, MatrixClient } from 'matrix-bot-sdk';
import * as Parser from 'rss-parser';
import config from '../config';
import { Collection, MongoClient } from 'mongodb';
import getCollection from '../db';
import OpenAiService from '../services/openAiService';

let openAiService = null;
if (config.openAiApiUrl.length > 0) {
  openAiService = new OpenAiService(
    config.openAiApiUrl,
    config.openAiApiKey,
    config.openAiApiModel,
  );
}

export async function runSendFeedTask(
  client: MatrixClient,
  dbClient: MongoClient,
) {
  const collection = await getCollection(dbClient);
  let rssRooms = await collection.find({}).toArray();

  let parser = new Parser();
  for (let item of rssRooms) {
    let allTitlesForSummary = '';
    for (let feed of item.rssSubs) {
      const feedUrl = feed.url;
      LogService.info('scheduler/rss', `Fetching feed ${feedUrl}`);

      try {
        let news = await getFeedNews(feedUrl, parser);
        let lastCheck = feed?.lastCheck
          ? new Date(Date.parse(feed.lastCheck))
          : null;

        for (let newsItem of news) {
          const newsDate = new Date(Date.parse(newsItem.isoDate));
          if (lastCheck === null || newsDate > lastCheck) {
            allTitlesForSummary += `${newsItem.title.replace(/<[^>]*>?/gm, '')}\n`;
            await sendNews(item.roomId, client, newsItem);
          }
        }

        lastCheck = new Date();

        await setLastCheckDate(item.roomId, collection, lastCheck);
      } catch (error) {
        LogService.error('scheduler/rss', `Error fetching feed ${feedUrl}`);
      }
    }

    try {
      if (openAiService === null || allTitlesForSummary.length === 0) {
        continue;
      }

      LogService.info('scheduler/rss', `Starting summary`);

      const chatCompletion =
        await openAiService.makeSummary(allTitlesForSummary);
      let summary = chatCompletion.choices[0]?.message?.content || '';

      if (summary) {
        summary = `#topnews\n\n${summary}`;
        await client.sendMessage(item.roomId, {
          body: summary,
          msgtype: 'm.notice',
          format: 'org.matrix.custom.html',
          formatted_body: summary,
        });
      }
    } catch (error) {
      LogService.error('scheduler/rss', `Error making summary.\n${error}`);
    }
  }
}

async function getFeedNews(feedUrl: string, parser: Parser): Promise<any[]> {
  let feed = await parser.parseURL(feedUrl);
  return feed.items.reverse();
}

async function setLastCheckDate(
  roomId: string,
  collection: Collection,
  lastCheck: Date,
) {
  let rssDoc = await collection.findOne({ roomId: roomId });
  let currentRss = [];
  if (rssDoc) {
    currentRss = rssDoc.rssSubs;
  } else {
    return;
  }
  currentRss = currentRss.map(item => {
    return { ...item, lastCheck: lastCheck };
  });
  await collection.updateOne({ roomId }, { $set: { rssSubs: currentRss } });
}

async function sendNews(roomId: string, client: MatrixClient, newsItem: any) {
  let title = newsItem.title;
  let link = newsItem.link;
  let content = newsItem.content;

  let text = `${title.replace(/<[^>]*>?/gm, '')}\n`;
  let html = `<h4>${title}</h4>`;
  if (content) {
    text += `${content.replace(/<[^>]*>?/gm, '')}\n`;
    html += `<p>${content}</p>`;
  }

  text += `${link}\n`;
  html += `<a href="${link}">${link}</a>`;

  await client.sendMessage(roomId, {
    body: text,
    msgtype: 'm.notice',
    format: 'org.matrix.custom.html',
    formatted_body: html,
  });
}
