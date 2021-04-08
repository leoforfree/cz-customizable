#!/usr/bin/env node
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable no-console */
const _ = {
  get: require('lodash/get'),
};

const CZ_CONFIG_NAME = '.cz-config.js';
const findConfig = require('find-config');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const log = require('./logger');

/* istanbul ignore next */
const readConfigFile = () => {
  // First try to find the .cz-config.js config file
  const czConfig = findConfig.require(CZ_CONFIG_NAME, { home: false });

  if (czConfig) {
    return czConfig;
  }

  // fallback to locating it using the config block in the nearest package.json
  let pkg = findConfig('package.json', { home: false });
  if (pkg) {
    const pkgDir = path.dirname(pkg);

    pkg = require(pkg);

    if (pkg.config && pkg.config['cz-customizable'] && pkg.config['cz-customizable'].config) {
      // resolve relative to discovered package.json
      const pkgPath = path.resolve(pkgDir, pkg.config['cz-customizable'].config);

      log.info('>>> Using cz-customizable config specified in your package.json: ', pkgPath);

      return require(pkgPath);
    }
  }

  log.warn(
    'Unable to find a configuration file. Please refer to documentation to learn how to ser up: https://github.com/leonardoanalista/cz-customizable#steps "'
  );
  return null;
};
const config = readConfigFile();

function issueToJson(data) {
  return {
    key: data.key,
    link: data.self,
    summary: data.fields.summary,
    parent: data.fields.parent ? issueToJson(data.fields.parent) : undefined,
    type: data.fields.issuetype,
  };
}

if (!config.jiraDomain || !config.jiraProjectAcronym || !config.jiraToken) {
  log.warn(
    'Missing required config property to fetch Jira issues. Please make sure to have filled "jiraDomain", "jiraProjectAcronym" and "jiraToken" (base64 of "email:apitoken", we strongly recommend to put this in your .env)'
  );
  process.exit();
}

let issues = [];
function retrieveJiraIssues(startAt) {
  axios
    .get(
      `https://${config.jiraDomain}/rest/api/3/search?jql=project=${
        config.jiraProjectAcronym
      }&fields=id,key,summary,parent&maxResults=100&startAt=${startAt}`,
      {
        headers: {
          Authorization: `Basic ${config.jiraToken}`,
        },
      }
    )
    .then(response => {
      issues = issues.concat(response.data.issues);
      console.log(chalk.dim.green(`${response.data.startAt + response.data.issues.length}/${response.data.total}`));
      if (response.data.startAt + response.data.maxResults < response.data.total - 1) {
        retrieveJiraIssues(response.data.startAt + response.data.maxResults);
      } else {
        fs.writeFileSync(
          _.get(config, 'pathToJiraIssues', './.jira-issues-cache.json'),
          JSON.stringify(issues.map(issueToJson))
        );
        log.log(chalk.green('Done retrieving issues for your project.'));
      }
    })
    .catch(e => log.warn(chalk.yellow(`Unable to retreive issues for your project. (${e.status.code})`)));
}

retrieveJiraIssues(0);
