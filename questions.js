/* eslint-disable no-restricted-syntax */
/* eslint-disable no-control-regex */
const _ = require('lodash');
const fuzzy = require('fuzzy');
const chalk = require('chalk');
const fs = require('fs');
const { FilteredChoice } = require('inquirer-better-prompts');
const Choices = require('inquirer/lib/objects/choices');
const { Separator } = require('inquirer');
const buildCommit = require('./buildCommit');
const log = require('./logger');

const fuzzyOptions = {
  pre: '<<',
  post: '>>',
};

function fuzzyResultToDisplay(fuzzyString, originalString) {
  const str = originalString.split('');
  let currentMatch = -1;
  const matchLength = fuzzyOptions.pre.length + fuzzyOptions.post.length;
  // eslint-disable-next-line no-restricted-syntax
  for (const match of fuzzyString.matchAll(/<<([^<>]*)>>/g)) {
    let offset = 0;
    let i = 0;
    currentMatch += 1;
    while (i < match.index) {
      const exec = new RegExp(/^\u001b\[([0-9];?)+m/i).exec(originalString.slice(i + offset));
      if (exec) {
        offset += exec[0].length;
      } else {
        i += 1;
      }
    }
    str.splice(match.index + offset + currentMatch * 2 - currentMatch * matchLength, 0, fuzzyOptions.pre);
    str.splice(
      match.index + offset + currentMatch * 2 - currentMatch * matchLength + match[1].length + 1,
      0,
      fuzzyOptions.post
    );
  }
  return str.join('').replace(/<<([^<>]*)>>/g, chalk.bold.cyanBright('$1'));
}

function searchIssues(choices, answers, input) {
  if ((input || '') === '') {
    return null;
  }

  const realChoices = choices.realChoices.map((c, i) => new FilteredChoice(c, answers, i));
  const lastCheckedIndex = realChoices.reduce((acc, choice, index) => (choice.checked ? index : acc), -1);
  const fuzzyResult = fuzzy.filter(input, realChoices.slice(lastCheckedIndex + 1), {
    ...fuzzyOptions,
    extract: choice => choice.name.replace(/\u001b\[([0-9];?)+m/gi, ''),
  });

  return new Choices(
    realChoices
      .slice(0, lastCheckedIndex + 1)
      .map(c => {
        const choice = c;
        const match = fuzzy.match(input, choice.name, {
          ...fuzzyOptions,
          extract: s => s.replace(/\u001b\[([0-9];?)+m/gi, ''),
        });
        choice.name = match ? fuzzyResultToDisplay(match.rendered, choice.name) : choice.name;
        return choice;
      })
      .concat(
        fuzzyResult.length && lastCheckedIndex >= 0 ? new Separator() : [],
        fuzzyResult.map(el => {
          const choice = el.original;
          choice.name = fuzzyResultToDisplay(el.string, choice.name);
          return choice;
        })
      )
  );
}

const isNotWip = answers => answers.type.toLowerCase() !== 'wip';

const validateTicketNo = (type, value, config) => {
  const required = config.isTicketNumberRequired;
  if (!value.length && (required === true || (Array.isArray(required) && required.includes(type)))) {
    return 'You must specify at least one ticket.';
  }
  if (!config.ticketNumberRegExp) {
    return true;
  }
  if (
    value
      .join('')
      .replace(new RegExp(config.ticketNumberRegExp, 'g'), '')
      .replace(new RegExp(config.ticketNumberPrefix || '', 'g'), '') !== ''
  ) {
    return `Tickets do not match format ${config.ticketNumberPrefix || ''}${config.ticketNumberRegExp}.`;
  }
  return true;
};

module.exports = {
  getTimeTrackQuestions(config, cz, answers) {
    const messages = config.messages || {};
    const skipQuestions = config.skipQuestions || [];
    const ticketsNumbers =
      answers && answers.ticketNumbers && answers.ticketNumbers.length ? answers.ticketNumbers : [];
    messages.confirmCommit = messages.confirmCommit || 'Are you sure you want to proceed with the commit above?';

    let questions = [];

    if (!skipQuestions.includes('timeTracking')) {
      for (const ticket of ticketsNumbers) {
        questions.push({
          type: 'input',
          name: ticket,
          validate(value) {
            if (!value && !config.isTimeTrackingRequired) {
              return true;
            }
            if (!value && config.isTimeTrackingRequired) {
              return 'Time tracking is required';
            }

            if (value.match(/\d{1,2}(m|h(\d{2}?)?)/)) {
              return true;
            }
            return "Time doesn't match the pattern";
          },
          message: () => {
            if (config.isTimeTrackingRequired) {
              return `Enter the time for the ticket ${ticket} following the pattern (\\d{1,2}(m|h(\\d{2}?)?)) ex: 1h30, 2h, 30m ${chalk.reset(
                ' '
              )}${chalk.dim('(Time tracking is required)\n')}`;
            }
            return `Enter the time for the ticket ${ticket} following the pattern (\\d{1,2}(m|h(\\d{2}?)?)) ex: 1h30, 2h, 30m`;
          },
        });
      }
    }

    questions.push({
      type: 'expand',
      name: 'confirmCommit',
      choices: [
        { key: 'y', name: 'Yes', value: 'yes' },
        { key: 'n', name: 'Abort commit', value: 'no' },
        { key: 'e', name: 'Edit message', value: 'edit' },
      ],
      default: 0,
      message() {
        const SEP = '###--------------------------------------------------------###';
        log.info(`\n${SEP}\n${buildCommit(answers, config)}\n${SEP}\n`);
        return messages.confirmCommit;
      },
    });

    questions = questions.filter(item => !skipQuestions.includes(item.name));

    return questions;
  },
  getQuestions(config, cz) {
    // normalize config optional options
    const scopeOverrides = config.scopeOverrides || {};
    const messages = config.messages || {};
    const skipQuestions = config.skipQuestions || [];

    messages.wip = messages.wip || 'Are you done with this change ?';
    messages.type = messages.type || "Select the type of change that you're committing:";
    messages.scope = messages.scope || 'Denote the SCOPE of this change (optional):\n';
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

    const filePath = _.get(config, 'pathToJiraIssues', './.jira-issues-cache.json');
    let issuesString = '[]';
    try {
      issuesString = fs.readFileSync(filePath, 'utf-8');
    } catch (e) {
      //
    }
    const issues = JSON.parse(issuesString).map(issue => {
      const name = `${issue.key} - ${issue.summary}`.split('\n').flatMap(el =>
        // el.match(/[^\s]+\s+/g).reduce((acc, word, index) => {
        //   if (acc[index % 10]) {
        //     acc[index % 10].push(word);
        //     return acc;
        //   }
        //   acc[index % 10] = [word];
        //   return acc;
        // }, [])
        el.match(/([^\s]+\s?){1,20}/g)
      );
      const parent =
        issue.parent && issue.parent.type.name === 'Epic' ? chalk.bgBlackBright.white(` ${issue.parent.summary} `) : '';
      if (name[name.length - 1].length + parent.length > 149) {
        name.push(parent);
      } else {
        name[name.length - 1] = `${name[name.length - 1]} ${parent}`;
      }
      return {
        name: name.map((l, i) => (i > 0 ? `    ${l}` : l)).join('\n'),
        value: issue.key,
        short: issue.key,
      };
    });

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
        type: 'multiple-select-search',
        name: 'ticketNumbers',
        allowCustom: true,
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
        searchText: 'Searching...',
        emptyText: 'No issue found',
        filterMethod: searchIssues,
        choices: issues,
        pageSize: 7,
        loop: false,
        reorderOnSelect: true,
        shouldDimNotSelected: true,
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
          if (!value) {
            return 'Subject is required';
          }
          const limit = config.subjectLimit || 100;
          if (value.length > limit) {
            return `Exceed limit: ${limit}`;
          }
          return true;
        },
        filter(value) {
          if (config.lowerCaseSubject) {
            return value.toLowerCase();
          }
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
