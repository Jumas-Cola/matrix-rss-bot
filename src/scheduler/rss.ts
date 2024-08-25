import { LogService, MatrixClient } from 'matrix-bot-sdk';
import * as htmlEscape from 'escape-html';
import * as Parser from 'rss-parser';
import * as path from 'path';
import config from '../config';
import * as fs from 'fs';
import { Collection, MongoClient } from 'mongodb';
import getCollection from '../db';

export async function runSendFeedTask(
  client: MatrixClient,
  dbClient: MongoClient,
) {
  const collection = await getCollection(dbClient);
  let rssRooms = await collection.find({}).toArray();

  let parser = new Parser();
  for (let item of rssRooms) {
    for (let feed of item.rssSubs) {
      const feedUrl = feed.url;
      LogService.info('index', `Fetching feed ${feedUrl}`);
      let news = await getFeedNews(feedUrl, parser);
      let lastCheck = feed?.lastCheck
        ? new Date(Date.parse(feed.lastCheck))
        : null;

      for (let newsItem of news) {
        const newsDate = new Date(Date.parse(newsItem.isoDate));
        if (lastCheck === null || newsDate > lastCheck) {
          await sendNews(item.roomId, client, newsItem);
        }
      }

      lastCheck = new Date();

      await setLastCheckDate(item.roomId, collection, lastCheck);
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
