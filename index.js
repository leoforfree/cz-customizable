'use strict';

// Inspired by: https://github.com/commitizen/cz-conventional-changelog and https://github.com/commitizen/cz-cli

var wrap = require('./node_modules/word-wrap/index');
var SYMLINK_CONFIG_NAME = 'cz-config';
var log = require('winston');


/* istanbul ignore next */
function readConfigFile() {
  // this function is replaced in test.
  var config;
  try {
    // Try to find a customized version for the project
    // This file is a symlink to the real one usually placed in the root of your project.
    config = require('./' + SYMLINK_CONFIG_NAME);
  } catch (err) {
    log.warn('You don\'t have a file "' + SYMLINK_CONFIG_NAME + '" in your porject root directory. We will use the default configuration file inside this directory: ' + __dirname);
    log.warn('You should go to your "node_modules/cz-customizable" and run "npm run postinstall" to fix it up. Please report on Github if this doenst work.');

    config = require('./cz-config-EXAMPLE');
  }
  return config;
}


function buildCommit(answers) {
  var maxLineWidth = 100;

  var wrapOptions = {
    trim: true,
    newline: '\n',
    indent:'',
    width: maxLineWidth
  };

  function addScope(scope) {
    if (!scope) return ': '; //it could be type === WIP. So there is no scope

    return '(' + scope.trim() + '): ';
  }

  function addSubject(subject) {
    return subject.trim();
  }

  // Hard limit this line
  var head = (answers.type + addScope(answers.scope) + addSubject(answers.subject)).slice(0, maxLineWidth);

  // Wrap these lines at 100 characters
  var body = wrap(answers.body, wrapOptions) || '';
  body = body.split('|').join('\n');

  var footer = wrap(answers.footer, wrapOptions);

  var result = head;
  if (body) {
    result += '\n\n' + body;
  }
  if (footer) {
    result += '\n\n' + footer;
  }

  return result;
}

var isNotWip = function(answers) {
  return answers.type.toLowerCase() !== 'wip';
};


module.exports = {

  prompter: function(cz, commit) {
    var config = readConfigFile();
    config.scopeOverrides = config.scopeOverrides || {};

    log.info('\n\nLine 1 will be cropped at 100 characters. All other lines will be wrapped after 100 characters.\n');

    cz.prompt([
      {
        type: 'list',
        name: 'type',
        message: '\nSelect the type of change that you\'re committing:',
        choices: config.types
      },

      {
        type: 'list',
        name: 'scope',
        message: '\nDenote the SCOPE of this change:\n',
        choices: function(answers) {
          if (config.scopeOverrides[answers.type]) {
            return config.scopeOverrides[answers.type];
          }
          return config.scopes;
        },
        when: isNotWip
      },
      {
        type: 'input',
        name: 'subject',
        message: '\nWrite a SHORT, IMPERATIVE tense description of the change:\n',
        validate: function(value) {
          return !!value;
        }
      }, {
        type: 'input',
        name: 'body',
        message: '\nProvide a LONGER description of the change (optional). Use "|" to break new line:\n'
      }, {
        type: 'input',
        name: 'footer',
        message: '\nList any BREAKING CHANGES or ISSUES CLOSED by this change (optional):\n',
        when: isNotWip
      },
      {
        type: 'confirm',
        name: 'confirmCommit',
        message: function(answers) {
          var SEP = '###--------------------------------------------------------###';
          log.info('\n' + SEP + '\n' + buildCommit(answers) + '\n' + SEP + '\n');
          return 'Are you sure you want to proceed with the commit above?';
        }
      }
    ], function(answers) {
      if (!answers.confirmCommit) {
        log.info('Commit has been canceled.');
        return;
      }

      var commitStr = buildCommit(answers);
      commit(commitStr);
    });
  }
};
