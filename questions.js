'use strict';


var fs = require('fs');
var path = require('path');
var buildCommit = require('./buildCommit');
var log = require('winston');


var isNotWip = function(answers) {
  return answers.type.toLowerCase() !== 'wip';
};

var cwd = fs.realpathSync(process.cwd());
var packageData = require(path.join(cwd, 'package.json'));

function isValidateTicketNo(value, config) {
  if (!value) {
    return config.isTicketNumberRequired ? false : true;
  }
  if (!config.ticketNumberRegExp) {
    return true;
  }
  var reg = new RegExp(config.ticketNumberRegExp);
  if (value.replace(reg, '') !== '') {
    return false;
  }
  return true;
}

module.exports = {

  getQuestions: function(config, cz) {

    // normalize config optional options
    var scopeOverrides = config.scopeOverrides || {};
    var messages = config.messages || {};
    var skipQuestions = config.skipQuestions || [];

    messages.type = messages.type || 'Select the type of change that you\'re committing:';
    messages.scope = messages.scope || '\nDenote the SCOPE of this change (optional):';
    messages.customScope = messages.customScope || 'Denote the SCOPE of this change:';
    if (!messages.ticketNumber) {
      if (config.ticketNumberRegExp) {
        messages.ticketNumber = messages.ticketNumberPattern || 'Enter the ticket number folloing this patter (' + config.ticketNumberRegExp + ')\n';
      } else {
        messages.ticketNumber = 'Enter the ticket number:\n';
      }
    }
    messages.subject = messages.subject || 'Write a SHORT, IMPERATIVE tense description of the change:\n';
    messages.body = messages.body || 'Provide a LONGER description of the change (optional). Use "|" to break new line:\n';
    messages.breaking = messages.breaking || 'List any BREAKING CHANGES (optional):\n';
    messages.footer = messages.footer || 'List any ISSUES CLOSED by this change (optional). E.g.: #31, #34:\n';
    messages.confirmCommit = messages.confirmCommit || 'Are you sure you want to proceed with the commit above?';

    var questions = [
      {
        type: 'list',
        name: 'type',
        message: messages.type,
        choices: config.types
      },
      {
        type: 'list',
        name: 'scope',
        message: messages.scope,
        choices: function(answers) {
          var scopes = [];
          if (scopeOverrides[answers.type]) {
            scopes = scopes.concat(scopeOverrides[answers.type]);
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
          if (scopeOverrides[answers.type]) {
            hasScope = !!(scopeOverrides[answers.type].length > 0);
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
        message: messages.customScope,
        when: function(answers) {
          return answers.scope === 'custom';
        }
      },
      {
        type: 'input',
        name: 'ticketNumber',
        message: messages.ticketNumber,
        when: function() {
          return !!config.allowTicketNumber; // no ticket numbers allowed unless specifed
        },
        validate: function (value) {
          return isValidateTicketNo(value, config);
        }
      },
      {
        type: 'input',
        name: 'subject',
        message: messages.subject,
        validate: function(value) {
          var limit = config.subjectLimit || 100;
          if (value.length > limit) {
            return 'Exceed limit: ' + limit;
          }
          return true;
        },
        filter: function(value) {
          return value.charAt(0).toLowerCase() + value.slice(1);
        }
      },
      {
        type: 'input',
        name: 'body',
        message: messages.body
      },
      {
        type: 'input',
        name: 'breaking',
        message: messages.breaking,
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
        message: messages.footer,
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
          log.info('\n' + SEP + '\n' + buildCommit(answers, config) + '\n' + SEP + '\n');
          return messages.confirmCommit;
        }
      }
    ];

    questions = questions.filter(function(item) {
      return !skipQuestions.includes(item.name);
    });

    return questions;
  }
};
