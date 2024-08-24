import {
  LogService,
  MatrixClient,
  MessageEvent,
  MessageEventContent,
} from 'matrix-bot-sdk';
import * as htmlEscape from 'escape-html';
import * as Parser from 'rss-parser';

export async function runAddRssCommand(
  roomId: string,
  event: MessageEvent<MessageEventContent>,
  args: string[],
  client: MatrixClient,
) {
  let url = args[1].trim();
  let parser = new Parser();
  let feedTitle = '';
  try {
    let feed = await parser.parseURL(url);
    console.log(feed);
    feedTitle = feed.title;
  } catch (error) {
    LogService.error('commands/rss', error);
    let html = `Invalid url <b>${htmlEscape(url)}</b>.`;
    return client.sendMessage(roomId, {
      msgtype: 'm.notice',
      format: 'org.matrix.custom.html',
      formatted_body: html,
    });
  }

  let storage = client.storageProvider;
  let currentRssStr = await storage.readValue(`rss-${roomId}`);
  let currentRss = [];
  if (currentRssStr) {
    currentRss = JSON.parse(currentRssStr);
  }
  currentRss = currentRss.filter(item => item.url !== url);
  currentRss.push({
    url: url,
    title: feedTitle,
  });
  storage.storeValue(`rss-${roomId}`, JSON.stringify(currentRss));

  let text = `Url ${htmlEscape(url)} added to RSS list.`;
  let html = `Url <b>${htmlEscape(url)}</b> added to RSS list.`;

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
) {
  let storage = client.storageProvider;
  let currentRssStr = await storage.readValue(`rss-${roomId}`);
  let currentRss = [];
  if (currentRssStr) {
    currentRss = JSON.parse(currentRssStr);
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
) {
  let url = args[1].trim();
  let storage = client.storageProvider;
  let currentRssStr = await storage.readValue(`rss-${roomId}`);
  let currentRss = [];
  if (currentRssStr) {
    currentRss = JSON.parse(currentRssStr);
  }
  currentRss = currentRss.filter(item => item.url !== url);
  storage.storeValue(`rss-${roomId}`, JSON.stringify(currentRss));

  let text = `Url removed from RSS list.`;
  let html = `Url removed from RSS list.`;

  // Now send that message as a notice
  return client.sendMessage(roomId, {
    body: text,
    msgtype: 'm.notice',
    format: 'org.matrix.custom.html',
    formatted_body: html,
  });
}
