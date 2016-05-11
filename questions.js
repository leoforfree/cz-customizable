'use strict';


var buildCommit = require('./buildCommit');
var log = require('winston');


var isNotWip = function(answers) {
  return answers.type.toLowerCase() !== 'wip';
};

module.exports = {

  getQuestions: function(config, cz) {

    // normalize config optional options
    config.scopeOverrides = config.scopeOverrides || {};

    var questions = [
      {
        type: 'list',
        name: 'type',
        message: 'Select the type of change that you\'re committing:',
        choices: config.types
      },
      {
        type: 'list',
        name: 'scope',
        message: '\nDenote the SCOPE of this change (optional):',
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
        message: 'Denote the SCOPE of this change:',
        when: function(answers) {
          return answers.scope === 'custom';
        }
      },
      {
        type: 'input',
        name: 'subject',
        message: 'Write a SHORT, IMPERATIVE tense description of the change:\n',
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
        message: 'Provide a LONGER description of the change (optional). Use "|" to break new line:\n'
      },
      {
        type: 'input',
        name: 'breaking',
        message: 'List any BREAKING CHANGES (optional):\n',
        when: function(answers) {
          if (config.allowBreakingChanges && config.allowBreakingChanges.indexOf(answers.type.toLowerCase()) >= 0) {
            return true;
          }
          return false; // no breaking changes allowed unless specifed
        }
      },
      {
        type: 'input',
        name: 'footer',
        message: 'List any ISSUES CLOSED by this change (optional). E.g.: #31, #34:\n',
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
    ];

    return questions;
  }
};
