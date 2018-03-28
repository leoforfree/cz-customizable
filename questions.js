'use strict';


var buildCommit = require('./buildCommit');
var log = require('winston');
var fuse = require('fuse.js');

var emojis = require('./lib/emojis');

var isNotWip = function(answers) {
  return answers.type.toLowerCase() !== 'wip';
};

module.exports = {
  getQuestions: function(config, cz) {
    // normalize config optional options
    var scopeOverrides = config.scopeOverrides || {};
    var messages = config.messages || {};

    messages.type = messages.type || '在你进行commit操作之前，请选择上述修改所属的类型：';
    messages.scope = messages.scope || '\n 请提供上述修改应属的范畴（可选）：';
    messages.customScope = messages.customScope || '请提供上述修改应属的范畴：';
    messages.subject = messages.subject || '针对上述修改，请写一段言简意赅的描述语：\n';
    messages.body = messages.body || '针对上述修改，请写一段详细的描述语（可选），使用“|”结束输入，并另起一行：\n';
    messages.breaking = messages.breaking || '列出那些（与之前相比）变化很大的关键点（optional）：\n';
    messages.footer = messages.footer || '列出在上述修改中被关掉的ISSUES （可选），例如: #31，#34：\n';
    messages.confirmCommit = messages.confirmCommit || '确定要提交代码？';

    var fuzzy = new fuse(emojis, {
      shouldSort: true,
      threshold: 0.4,
      location: 0,
      distance: 100,
      maxPatternLength: 32,
      minMatchCharLength: 1,
      keys: ['name', 'code'],
      id: 'emoji'
    });

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
        type: 'autocomplete',
        name: 'subject',
        suggestOnly: true,
        message: messages.subject,
        source: function (answersSoFar, query) {
          if (/:[a-zA-Z]+:/.test(query)) return Promise.resolve([query]);

          var mapCallback = function (config) {
            return config.emoji;
          };

          return Promise.resolve(query ? fuzzy.search(query) : emojis.map(mapCallback));
        },
        validate: function(value) {
          var limit = config.subjectLimit || 100;
          if (value.length > limit) {
            return 'Exceed limit: ' + limit;
          }
          return true;
        },
        filter: function(value) {
          value = value.trim();

          var match = value.match(/:[a-zA-Z]+:\s?/);
          var current = match ? match[0].length : 0;
          var next = current + 1;
          var prev = current - 1;

          return (current ? [
            value.slice(0, current),
            value.slice(current, next).toLowerCase(),
            value.slice(next)
          ] : [
            value.charAt(current).toLowerCase(),
            value.slice(next)
          ]).join('');
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
          { key: 'y', name: '提交', value: 'yes' },
          { key: 'n', name: '取消', value: 'no' },
          { key: 'e', name: '修改 commit 信息', value: 'edit' }
        ],
        message: function(answers) {
          var SEP = '----------------------------无耻的分割线----------------------------';
          log.info('\n' + SEP + '\n' + buildCommit(answers, config) + '\n' + SEP + '\n');
          return messages.confirmCommit;
        }
      }
    ];

    return questions;
  }
};
