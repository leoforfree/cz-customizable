const fs = require('fs');
const path = require('path');
const pathExists = require('path-exists');

const { gitmojiApiClient } = require('./http');
const log = require('./logger');

const getCachedEmojiPath = () => {
  const home = process.env.HOME || /* istanbul ignore next */ process.env.USERPROFILE;
  return path.join(home, '.gitmoji', 'gitmojis.json');
};

/* istanbul ignore next */
const isCachedEmojiAvailable = cachedEmojiPath => pathExists.sync(cachedEmojiPath);

/* istanbul ignore next */
const fetchCachedEmoji = cachedEmojiPath => Promise.resolve(JSON.parse(fs.readFileSync(cachedEmojiPath)));

const fetchRemoteEmoji = () => {
  return gitmojiApiClient
    .request({
      method: 'GET',
      url: '/src/data/gitmojis.json',
    })
    .then(res => {
      log.info('Git emoji updated successfully!');
      return res.data.gitmojis;
    })
    .catch(error => {
      const message = error.code || /* istanbul ignore next */ error;
      log.error(`Network connection not found - ${message}`);
    });
};

/* istanbul ignore next */
const createCacheForEmoji = (cachedEmojiPath, emojis) => {
  if (!emojis) return;

  const cacheDir = path.dirname(cachedEmojiPath);
  if (!pathExists.sync(cacheDir)) {
    fs.mkdirSync(cacheDir);
  }

  fs.writeFileSync(cachedEmojiPath, JSON.stringify(emojis));
};

const fetchEmoji = () => {
  const cachedEmojiPath = getCachedEmojiPath();

  /* istanbul ignore else */
  if (isCachedEmojiAvailable(cachedEmojiPath)) {
    return fetchCachedEmoji(cachedEmojiPath);
  }

  return fetchRemoteEmoji().then(emojis => {
    createCacheForEmoji(cachedEmojiPath, emojis);
    return emojis || /* istanbul ignore next */ [];
  });
};

module.exports = {
  fetchEmoji,
};
