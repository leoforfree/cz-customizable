'use strict';

// Inspired by: https://github.com/commitizen/cz-conventional-changelog and https://github.com/commitizen/cz-cli

var CZ_CONFIG_NAME = '.cz-config.js';
var CZ_CONFIG_EXAMPLE_LOCATION = './cz-config-EXAMPLE.js';
var wrap = require('word-wrap');
var findConfig = require('find-config');
var log = require('winston');
var editor = require('editor');
var temp = require('temp').track();
var fs = require('fs');
var path = require('path');

/* istanbul ignore next */
function readConfigFile() {
  // this function is replaced in test.
  var config = findConfig.require(CZ_CONFIG_NAME, {home: false});

  if (!config) {
    log.warn('Unable to find a config file "' + CZ_CONFIG_NAME + '". Default configuration would be used.');
    log.warn('Copy and use it as template by running in a project root directory:\n      "cp '
      + path.resolve(CZ_CONFIG_EXAMPLE_LOCATION) + ' ' + path.join('.', CZ_CONFIG_NAME) + '"');

    config = require(CZ_CONFIG_EXAMPLE_LOCATION);
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

  function escapeSpecialChars(result) {
    var specialChars = ['\`'];

    specialChars.map(function (item){
      // For some strange reason, we have to pass additional '\' slash to commitizen. Total slashes are 4.
      // If user types "feat: `string`", the commit preview should show "feat: `\\string\\`".
      // Don't worry. The git log will be "feat: `string`"
      result = result.replace(new RegExp(item, 'g'), '\\\\`');
    });
    return result;
  }

  // Hard limit this line
  var head = (answers.type + addScope(answers.scope) + addSubject(answers.subject)).slice(0, maxLineWidth);

  // Wrap these lines at 100 characters
  var body = wrap(answers.body, wrapOptions) || '';
  body = body.split('|').join('\n');

  var breaking = wrap(answers.breaking, wrapOptions);
  var footer = wrap(answers.footer, wrapOptions);

  var result = head;
  if (body) {
    result += '\n\n' + body;
  }
  if (breaking) {
    result += '\n\n' + 'BREAKING CHANGE:\n' + breaking;
  }
  if (footer) {
    result += '\n\n' + footer;
  }

  return escapeSpecialChars(result);
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
        message: '\nDenote the SCOPE of this change (optional):\n',
        choices: function(answers) {
          var scopes = [];
          if (config.scopeOverrides[answers.type]) {
            scopes = scopes.concat(config.scopeOverrides[answers.type]);
          } else {
            scopes = scopes.concat(config.scopes);
          }
          if (config.allowCustomScopes || scopes.length === 0) {
            scopes = scopes.concat([
              new cz.Separator(),
              { name: 'empty', value: false },
              { name: 'custom', value: 'custom' }
            ]);
          }
          return scopes;
        },
        when: function(answers) {
          var hasScope = false;
          if (config.scopeOverrides[answers.type]) {
            hasScope = !!(config.scopeOverrides[answers.type].length > 0);
          } else {
            hasScope = !!(config.scopes && (config.scopes.length > 0));
          }
          if (!hasScope) {
            answers.scope = 'custom';
            return false;
          } else {
            return isNotWip(answers);
          }
        }
      },
      {
        type: 'input',
        name: 'scope',
        message: '\nDenote the SCOPE of this change:\n',
        when: function(answers) {
          return answers.scope === 'custom';
        }
      },
      {
        type: 'input',
        name: 'subject',
        message: '\nWrite a SHORT, IMPERATIVE tense description of the change:\n',
        validate: function(value) {
          return !!value;
        },
        filter: function(value) {
          return value.charAt(0).toLowerCase() + value.slice(1);
        }
      },
      {
        type: 'input',
        name: 'body',
        message: '\nProvide a LONGER description of the change (optional). Use "|" to break new line:\n'
      },
      {
        type: 'input',
        name: 'breaking',
        message: '\nList any BREAKING CHANGES (optional):\n',
        when: function(answers) {
          if (config.allowBreakingChanges) {
            return config.allowBreakingChanges.indexOf(answers.type.toLowerCase()) >= 0;
          }

          return true;
        }
      },
      {
        type: 'input',
        name: 'footer',
        message: '\nList any ISSUES CLOSED by this change (optional):\n',
        when: isNotWip
      },
      {
        type: 'expand',
        name: 'confirmCommit',
        choices: [
          { key: 'y', name: 'Yes', value: 'yes' },
          { key: 'n', name: 'Abort commit', value: 'no' },
          { key: 'e', name: 'Edit message', value: 'edit' }
        ],
        message: function(answers) {
          var SEP = '###--------------------------------------------------------###';
          log.info('\n' + SEP + '\n' + buildCommit(answers) + '\n' + SEP + '\n');
          return 'Are you sure you want to proceed with the commit above?';
        }
      }
    ], function(answers) {
      if (answers.confirmCommit === 'edit') {
        temp.open(null, function(err, info) {
          /* istanbul ignore else */
          if (!err) {
            fs.write(info.fd, buildCommit(answers));
            fs.close(info.fd, function(err) {
              editor(info.path, function (code, sig) {
                if (code === 0) {
                  var commitStr = fs.readFileSync(info.path, { encoding: 'utf8' });
                  commit(commitStr);
                } else {
                  log.info('Editor returned non zero value. Commit message was:\n' + buildCommit(answers));
                }
              });
            });
          }
        });
      } else if (answers.confirmCommit === 'yes') {
        commit(buildCommit(answers));
      } else {
        log.info('Commit has been canceled.');
      }
    });
  }
};
