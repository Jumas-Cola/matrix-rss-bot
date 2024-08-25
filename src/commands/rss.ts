import {
  LogService,
  MatrixClient,
  MessageEvent,
  MessageEventContent,
} from 'matrix-bot-sdk';
import * as htmlEscape from 'escape-html';
import * as Parser from 'rss-parser';
import { MongoClient } from 'mongodb';
import getCollection from '../db';

export async function runAddRssCommand(
  roomId: string,
  event: MessageEvent<MessageEventContent>,
  args: string[],
  client: MatrixClient,
  dbClient: MongoClient,
) {
  let url = args[1].trim();

  const collection = await getCollection(dbClient);
  let rssDoc = await collection.findOne({ roomId: roomId });
  let currentRss = [];
  if (rssDoc) {
    currentRss = rssDoc.rssSubs;
  }

  let foundRss = currentRss.find(item => item.url === url);
  let text = '';
  let html = '';
  if (foundRss) {
    text = `Url ${htmlEscape(url)} already added to RSS list.`;
    html = `Url <b>${htmlEscape(url)}</b> already added to RSS list.`;
  } else {
    let parser = new Parser();
    let feedTitle = '';
    try {
      let feed = await parser.parseURL(url);
      feedTitle = feed.title;
    } catch (error) {
      LogService.error('commands/rss', error);
      let text = `Invalid url ${htmlEscape(url)}.`;
      let html = `Invalid url <b>${htmlEscape(url)}</b>.`;

      return client.sendMessage(roomId, {
        body: text,
        msgtype: 'm.notice',
        format: 'org.matrix.custom.html',
        formatted_body: html,
      });
    }

    currentRss.push({
      url: url,
      title: feedTitle,
    });
    await collection.updateOne(
      { roomId: roomId },
      { $set: { rssSubs: currentRss } },
      { upsert: true },
    );

    text = `Url ${htmlEscape(url)} added to RSS list.`;
    html = `Url <b>${htmlEscape(url)}</b> added to RSS list.`;
  }

  // Now send that message as a notice
  return client.sendMessage(roomId, {
    body: text,
    msgtype: 'm.notice',
    format: 'org.matrix.custom.html',
    formatted_body: html,
  });
}

export async function runListRssCommand(
  roomId: string,
  event: MessageEvent<MessageEventContent>,
  args: string[],
  client: MatrixClient,
  dbClient: MongoClient,
) {
  const collection = await getCollection(dbClient);
  let rssDoc = await collection.findOne({ roomId: roomId });
  let currentRss = [];
  if (rssDoc) {
    currentRss = rssDoc.rssSubs;
  }

  let text = '';
  let html = '';
  for (const rss of currentRss) {
    text += `• ${rss.title} - ${rss.url}\n`;
    html += `<li><a href="${rss.url}">${rss.title}</a></li>`;
  }
  if (text === '') {
    text = 'No RSS feeds added.';
    html = 'No RSS feeds added.';
  } else {
    html = `<ul>${html}</ul>`;
  }

  // Now send that message as a notice
  return client.sendMessage(roomId, {
    body: text,
    msgtype: 'm.notice',
    format: 'org.matrix.custom.html',
    formatted_body: html,
  });
}

export async function runRemoveRssCommand(
  roomId: string,
  event: MessageEvent<MessageEventContent>,
  args: string[],
  client: MatrixClient,
  dbClient: MongoClient,
) {
  let url = args[1].trim();
  const collection = await getCollection(dbClient);
  let rssDoc = await collection.findOne({ roomId: roomId });
  let currentRss = [];

  let text = `No RSS feeds added.`;
  let html = `No RSS feeds added.`;

  if (rssDoc) {
    currentRss = rssDoc.rssSubs;
    let foundRss = currentRss.find(item => item.url === url);
    if (!foundRss) {
      text = `Url ${htmlEscape(url)} not found in RSS list.`;
      html = `Url <b>${htmlEscape(url)}</b> not found in RSS list.`;
    } else {
      currentRss = currentRss.filter(item => item.url !== url);
      await collection.updateOne(
        { roomId: roomId },
        { $set: { rssSubs: currentRss } },
      );

      text = `Url removed from RSS list.`;
      html = `Url removed from RSS list.`;
    }
  }

  // Now send that message as a notice
  return client.sendMessage(roomId, {
    body: text,
    msgtype: 'm.notice',
    format: 'org.matrix.custom.html',
    formatted_body: html,
  });
}
