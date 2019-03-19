const axios = require('axios');

const gitmojiApiClient = axios.create({
  baseURL: 'https://raw.githubusercontent.com/carloscuesta/gitmoji/master',
  timeout: 5000,
  headers: {},
  params: {},
});

exports.gitmojiApiClient = gitmojiApiClient;
