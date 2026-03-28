#!/usr/bin/env node

const { spawnSync } = require('child_process');
const inquirer = require('inquirer');

const app = require('./index');
const log = require('./lib/logger');

log.info('cz-customizable standalone version');

const commit = (commitMessage) => {
  const result = spawnSync('git', ['commit', '-m', commitMessage], { stdio: 'inherit' });
  if (result.status !== 0) {
    log.error('>>> ERROR', result.error);
  }
};

app.prompter(inquirer, commit);
