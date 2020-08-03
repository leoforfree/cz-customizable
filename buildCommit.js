const _ = require('lodash');
const wrap = require('word-wrap');

const defaultSubjectSeparator = ': ';
const defaultMaxLineWidth = 100;
const defaultBreaklineChar = '|';
const defaultBreakingPrefix = 'BREAKING CHANGE:';
const defaultFooterPrefix = 'ISSUES CLOSED:';

const addTicketNumber = (ticketNumber, config) => {
  if (!ticketNumber) {
    return '';
  }
  if (config.ticketNumberPrefix) {
    return `${config.ticketNumberPrefix + ticketNumber.trim()} `;
  }
  return `${ticketNumber.trim()} `;
};

const addScope = (scope, config) => {
  const separator = _.get(config, 'subjectSeparator', defaultSubjectSeparator);

  if (!scope) return separator; // it could be type === WIP. So there is no scope

  return `(${scope.trim()})${separator}`;
};

const addSubject = subject => _.trim(subject);

const addType = (type, config) => {
  const prefix = _.get(config, 'typePrefix', '');
  const suffix = _.get(config, 'typeSuffix', '');

  return _.trim(`${prefix}${type}${suffix}`);
};

const addBreaklinesIfNeededAndWrap = (value = '', config) => {
  const breaklineChar = _.get(config, 'breaklineChar', defaultBreaklineChar);
  const wrapOptions = {
    trim: true,
    newline: '\n',
    indent: '',
    width: defaultMaxLineWidth,
  };

  return (
    value
      .split(breaklineChar)
      // Wrap each line at 100 characters
      .map(p => wrap(p, wrapOptions))
      .join('\n')
      .valueOf()
  );
};

const addBreaking = (breaking, config) => {
  const breakingPrefix = _.get(config, 'breakingPrefix', defaultBreakingPrefix);

  return `\n\n${breakingPrefix}\n${breaking}`;
};

const addFooter = (footer, config) => {
  if (config && config.footerPrefix === '') return `\n\n${addBreaklinesIfNeededAndWrap(footer, config)}`;

  const footerPrefix = _.get(config, 'footerPrefix', defaultFooterPrefix);

  return `\n\n${footerPrefix} ${addBreaklinesIfNeededAndWrap(footer, config)}`;
};

const escapeSpecialChars = result => {
  // eslint-disable-next-line no-useless-escape
  const specialChars = ['`'];

  let newResult = result;
  // eslint-disable-next-line array-callback-return
  specialChars.map(item => {
    // If user types "feat: `string`", the commit preview should show "feat: `\string\`".
    // Don't worry. The git log will be "feat: `string`"
    newResult = result.replace(new RegExp(item, 'g'), '\\`');
  });
  return newResult;
};

module.exports = (answers, config) => {
  // Hard limit this line
  // eslint-disable-next-line max-len
  const head =
    addType(answers.type, config) +
    addScope(answers.scope, config) +
    addTicketNumber(answers.ticketNumber, config) +
    addSubject(answers.subject.slice(0, config.subjectLimit));

  let result = head;
  if (answers.body) {
    result += `\n\n${addBreaklinesIfNeededAndWrap(answers.body, config)}`;
  }
  if (answers.breaking) {
    result += addBreaking(answers.breaking, config);
  }
  if (answers.footer) {
    result += addFooter(answers.footer, config);
  }

  return escapeSpecialChars(result);
};
