const Fuse = require('fuse.js');

const buildCommit = require('./util/commitGenerator');
const log = require('./util/logger');
const gitEmojiProvider = require('./util/gitEmojiProvider');

const isNotWip = answers => answers.type.toLowerCase() !== 'wip';

function isValidateTicketNo(value, config) {
  if (!value) {
    return !config.isTicketNumberRequired;
  }
  if (!config.ticketNumberRegExp) {
    return true;
  }
  const reg = new RegExp(config.ticketNumberRegExp);
  if (value.replace(reg, '') !== '') {
    return false;
  }
  return true;
}

module.exports = {
  getQuestions(config, cz) {
    // normalize config optional options
    const scopeOverrides = config.scopeOverrides || {};
    const messages = config.messages || {};
    const skipQuestions = config.skipQuestions || [];

    messages.type = messages.type || "Select the type of change that you're committing:";
    messages.scope = messages.scope || '\nDenote the SCOPE of this change (optional):';
    messages.customScope = messages.customScope || 'Denote the SCOPE of this change:';
    if (!messages.ticketNumber) {
      if (config.ticketNumberRegExp) {
        messages.ticketNumber =
          messages.ticketNumberPattern ||
          `Enter the ticket number following this pattern (${config.ticketNumberRegExp})\n`;
      } else {
        messages.ticketNumber = 'Enter the ticket number:\n';
      }
    }
    messages.subject = messages.subject || 'Write a SHORT, IMPERATIVE tense description of the change:\n';
    messages.body =
      messages.body || 'Provide a LONGER description of the change (optional). Use "|" to break new line:\n';
    messages.breaking = messages.breaking || 'List any BREAKING CHANGES (optional):\n';
    messages.footer = messages.footer || 'List any ISSUES CLOSED by this change (optional). E.g.: #31, #34:\n';
    messages.confirmCommit = messages.confirmCommit || 'Are you sure you want to proceed with the commit above?';

    const fuseOption = {
      shouldSort: true,
      threshold: 0.4,
      location: 0,
      distance: 100,
      maxPatternLength: 32,
      minMatchCharLength: 1,
      keys: ['name', 'code'],
      id: 'emoji',
    };
    let questions = [
      {
        type: 'list',
        name: 'type',
        message: messages.type,
        choices: config.types,
      },
      {
        type: 'list',
        name: 'scope',
        message: messages.scope,
        choices(answers) {
          let scopes = [];
          if (scopeOverrides[answers.type]) {
            scopes = scopes.concat(scopeOverrides[answers.type]);
          } else {
            scopes = scopes.concat(config.scopes);
          }
          if (config.allowCustomScopes || scopes.length === 0) {
            scopes = scopes.concat([
              new cz.Separator(),
              { name: 'empty', value: false },
              { name: 'custom', value: 'custom' },
            ]);
          }
          return scopes;
        },
        when(answers) {
          let hasScope = false;
          if (scopeOverrides[answers.type]) {
            hasScope = !!(scopeOverrides[answers.type].length > 0);
          } else {
            hasScope = !!(config.scopes && config.scopes.length > 0);
          }
          if (!hasScope) {
            // TODO: Fix when possible
            // eslint-disable-next-line no-param-reassign
            answers.scope = 'custom';
            return false;
          }
          return isNotWip(answers);
        },
      },
      {
        type: 'input',
        name: 'scope',
        message: messages.customScope,
        when(answers) {
          return answers.scope === 'custom';
        },
      },
      {
        type: 'input',
        name: 'ticketNumber',
        message: messages.ticketNumber,
        when() {
          return !!config.allowTicketNumber; // no ticket numbers allowed unless specified
        },
        validate(value) {
          return isValidateTicketNo(value, config);
        },
      },
      {
        type: 'autocomplete',
        name: 'subject',
        suggestOnly: true,
        message: messages.subject,
        source(answersSoFar, query) {
          /* istanbul ignore else */
          if (/:[a-zA-Z]+:/.test(query) || !query) return Promise.resolve([query]);

          return gitEmojiProvider.fetchEmoji().then(emojis => new Fuse(emojis, fuseOption).search(query));
        },
        validate(value) {
          const limit = config.subjectLimit || 100;
          if (value.length > limit) {
            return `Exceed limit: ${limit}`;
          }
          return true;
        },
        filter(originalValue) {
          const value = originalValue.trim();

          const match = value.match(/^:[a-zA-Z]+:\s?/);
          const current = match ? match[0].length : 0;
          const next = current + 1;

          return (current
            ? [value.slice(0, current), value.slice(current, next).toLowerCase(), value.slice(next)]
            : [value.charAt(current).toLowerCase(), value.slice(next)]
          ).join('');
        },
      },
      {
        type: 'input',
        name: 'body',
        message: messages.body,
      },
      {
        type: 'input',
        name: 'breaking',
        message: messages.breaking,
        when(answers) {
          // eslint-disable-next-line max-len
          if (config.allowBreakingChanges && config.allowBreakingChanges.indexOf(answers.type.toLowerCase()) >= 0) {
            return true;
          }
          return false; // no breaking changes allowed unless specified
        },
      },
      {
        type: 'input',
        name: 'footer',
        message: messages.footer,
        when: isNotWip,
      },
      {
        type: 'expand',
        name: 'confirmCommit',
        choices: [
          { key: 'y', name: 'Yes', value: 'yes' },
          { key: 'n', name: 'Abort commit', value: 'no' },
          { key: 'e', name: 'Edit message', value: 'edit' },
        ],
        message(answers) {
          const SEP = '###--------------------------------------------------------###';
          log.info(`\n${SEP}\n${buildCommit(answers, config)}\n${SEP}\n`);
          return messages.confirmCommit;
        },
      },
    ];

    questions = questions.filter(item => !skipQuestions.includes(item.name));

    return questions;
  },
};
