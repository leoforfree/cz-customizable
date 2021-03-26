const _ = require('lodash');
const chalk = require('chalk');
const buildCommit = require('./buildCommit');
const log = require('./logger');

const isNotWip = answers => answers.type.toLowerCase() !== 'wip';

const validateTicketNo = (type, value, config) => {
  const required = config.isTicketNumberRequired;
  if (!value) {
    return !required || (Array.isArray(required) && !required.includes(type));
  }
  if (!config.ticketNumberRegExp) {
    return true;
  }
  const reg = new RegExp(config.ticketNumberRegExp);
  if (value.replace(reg, '') !== '') {
    return false;
  }
  return true;
};

module.exports = {
  getQuestions(config, cz) {
    // normalize config optional options
    const scopeOverrides = config.scopeOverrides || {};
    const messages = config.messages || {};
    const skipQuestions = config.skipQuestions || [];

    messages.wip = messages.wip || 'Are you done with this change ?';
    messages.type = messages.type || "Select the type of change that you're committing:";
    messages.scope = messages.scope || '\nDenote the SCOPE of this change (optional):';
    messages.customScope = messages.customScope || 'Denote the SCOPE of this change:';
    if (!messages.ticketNumber) {
      messages.ticketNumber = 'Enter the ticket number:\n';
      if (config.ticketNumberRegExp) {
        messages.ticketNumber =
          messages.ticketNumberPattern ||
          `Enter the ticket number following this pattern (${config.ticketNumberRegExp}):\n`;
      }
    }
    messages.subject = messages.subject || 'Write a SHORT, IMPERATIVE tense description of the change:\n';
    messages.body =
      messages.body || 'Provide a LONGER description of the change (optional). Use "|" to break new line:\n';
    messages.breaking = messages.breaking || 'List any BREAKING CHANGES (optional):\n';
    messages.footer = messages.footer || 'List any ISSUES CLOSED by this change (optional). E.g.: #31, #34:\n';
    messages.confirmCommit = messages.confirmCommit || 'Are you sure you want to proceed with the commit above?';

    const wipChoices = [{ key: 'n', name: 'No', value: true }];
    if (_.get(config, 'wipDefaultChoice', true)) {
      wipChoices.push({ key: 'y', name: 'Yes', value: false });
    } else {
      wipChoices.unshift({ key: 'y', name: 'Yes', value: false });
    }
    let questions = [
      {
        type: 'expand',
        name: 'wip',
        message: messages.wip,
        choices: wipChoices,
        default: 0,
      },
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
          const defaultChoices = [];
          if (config.allowEmptyScopes) {
            defaultChoices.push({ name: 'empty', value: false });
          }
          if (config.allowCustomScopes) {
            defaultChoices.push({ name: 'custom', value: 'custom' });
          }
          if (defaultChoices.length > 0) {
            if (config.defaultScopeInFirst) {
              scopes.unshift(...defaultChoices, new cz.Separator());
            } else {
              scopes.push(new cz.Separator(), ...defaultChoices);
            }
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
            if (config.allowCustomScopes && config.allowEmptyScopes) {
              return true;
            }
            if ((!config.allowCustomScopes && !config.allowEmptyScopes) || config.allowCustomScopes) {
              // TODO: Fix when possible
              // eslint-disable-next-line no-param-reassign
              answers.scope = 'custom';
            }
            if (config.allowEmptyScopes) {
              // TODO: Fix when possible
              // eslint-disable-next-line no-param-reassign
              answers.scope = false;
            }
            return false;
          }
          if (config.allowScopeWithWip) {
            return true;
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
        message: answers => {
          if (config.isTicketNumberRequired === true) {
            return messages.ticketNumber + chalk.reset(' ') + chalk.dim('(Ticket number is required)\n');
          }
          if (Array.isArray(config.isTicketNumberRequired) && config.isTicketNumberRequired.includes(answers.type)) {
            return (
              messages.ticketNumber +
              chalk.reset(' ') +
              chalk.dim(`(Ticket number is required with type${config.isTicketNumberRequired.length > 1 ? 's' : ''}`) +
              config.isTicketNumberRequired
                .map(type =>
                  type === answers.type
                    ? chalk.reset(' ') + chalk.cyan.bold(type) + chalk.reset('*')
                    : chalk.reset(' ') + chalk`{dim ${type}}`
                )
                .join(chalk.dim(',')) +
              chalk.dim(')\n')
            );
          }
          return messages.ticketNumber;
        },
        when() {
          return !!config.allowTicketNumber; // no ticket numbers allowed unless specifed
        },
        validate(value, answers) {
          return validateTicketNo(answers.type, value, config);
        },
      },
      {
        type: 'input',
        name: 'subject',
        message: messages.subject,
        validate(value) {
          const limit = config.subjectLimit || 100;
          if (value.length > limit) {
            return `Exceed limit: ${limit}`;
          }
          return true;
        },
        filter(value) {
          const upperCaseSubject = config.upperCaseSubject || false;

          return (upperCaseSubject ? value.charAt(0).toUpperCase() : value.charAt(0).toLowerCase()) + value.slice(1);
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
          if (
            config.askForBreakingChangeFirst ||
            (config.allowBreakingChanges && config.allowBreakingChanges.indexOf(answers.type.toLowerCase()) >= 0)
          ) {
            return true;
          }
          return false; // no breaking changes allowed unless specifed
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
        default: 0,
        message(answers) {
          const SEP = '###--------------------------------------------------------###';
          log.info(`\n${SEP}\n${buildCommit(answers, config)}\n${SEP}\n`);
          return messages.confirmCommit;
        },
      },
    ];

    questions = questions.filter(item => !skipQuestions.includes(item.name));

    if (config.askForBreakingChangeFirst) {
      const isBreaking = oneQuestion => oneQuestion.name === 'breaking';

      const breakingQuestion = _.filter(questions, isBreaking);
      const questionWithoutBreaking = _.reject(questions, isBreaking);

      questions = _.concat(breakingQuestion, questionWithoutBreaking);
    }

    return questions;
  },
};
