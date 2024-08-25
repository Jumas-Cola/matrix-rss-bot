let error = true;

let res = [
  db.rss.drop(),
  db.rss.insertOne({ roomId: 'test', rssSubs: [] }),
  db.rss.deleteOne({ roomId: 'test' }),
];

printjson(res);
