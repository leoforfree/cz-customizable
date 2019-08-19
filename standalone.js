#!/usr/bin/env node

const { execSync } = require('child_process');
const inquirer = require('inquirer');

const app = require('./index');
const log = require('./logger');

log.info('cz-customizable standalone version');

const commit = (commitMessage, options) => {
  try {
    const args = [`commit`, `-m`, `"${commitMessage}"`, ...((options && options.args) || [])];
    const argsString = args.toString().replace(/,/g, ' ');
    execSync(`git ${argsString}`, { stdio: 'inherit' });
  } catch (error) {
    log.error('>>> ERROR', error.error);
  }
};

app.prompter(inquirer, commit);
