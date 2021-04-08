const _ = require('lodash');
const wrap = require('word-wrap');

const defaultSubjectSeparator = ': ';
const defaultMaxLineWidth = 100;
const defaultBreaklineChar = '|';

const getTicketNumbers = (ticketNumbers, config) => {
  if (!ticketNumbers) {
    return undefined;
  }

  const ticketPrefix = _.get(config, 'ticketNumberPrefix', '');
  return `${ticketNumbers.length > 0 ? _.get(config, 'ticketNumberPositionPrefix', '') : ''}${ticketNumbers
    .map(ticket => {
      let ticketNumber = ticket.trim();
      if (ticketPrefix !== '') {
        ticketNumber = ticketNumber.replace(ticketPrefix, '');
      }
      return ticketPrefix + ticketNumber;
    })
    .join(_.get(config, 'ticketNumberSeparator', ' '))}${
    ticketNumbers.length > 0 ? _.get(config, 'ticketNumberPositionSuffix', '') || '' : ''
  }`;
};

const addTicketNumbersToHead = (ticketNumbers, position, config) => {
  if (!ticketNumbers || config !== position) {
    return '';
  }
  return `${position === 'inline-append' ? ' ' : ''}${ticketNumbers}${position === 'inline-prepend' ? ' ' : ''}`;
};

const addScope = (scope, config) => {
  const separator = _.get(config, 'subjectSeparator', defaultSubjectSeparator);

  if (!scope) return separator; // it could be type === WIP. So there is no scope

  return `(${scope.trim()})${separator}`;
};

const addSubject = subject => _.trim(subject);

const addWip = (wip, config) => {
  const wipPrefix = wip ? _.get(config, 'wipPrefix', 'w') : '';

  return _.trim(wipPrefix);
};

const addType = (type, config) => {
  const prefix = _.get(config, 'typePrefix', '');
  const suffix = _.get(config, 'typeSuffix', '');

  return _.trim(`${prefix}${type}${suffix}`);
};

const addBreaklinesIfNeeded = (value, breaklineChar = defaultBreaklineChar) =>
  value
    .split(breaklineChar)
    .join('\n')
    .valueOf();

const addFooter = (footer, config) => {
  if (config && config.footerPrefix === '') return `\n\n${footer}`;

  const footerPrefix = config && config.footerPrefix ? config.footerPrefix : 'ISSUES CLOSED:';

  return `\n\n${footerPrefix} ${addBreaklinesIfNeeded(footer, config.breaklineChar)}`;
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
  const wrapOptions = {
    trim: true,
    newline: '\n',
    indent: '',
    width: defaultMaxLineWidth,
  };

  const ticketNumbers = getTicketNumbers(answers.ticketNumbers, config);
  const ticketNumberPosition = config && config.ticketNumberPosition ? config.ticketNumberPosition : 'inline-prepend';

  // Hard limit this line
  // eslint-disable-next-line max-len
  const head = (
    addWip(answers.wip, config) +
    addType(answers.type, config) +
    addScope(answers.scope, config) +
    addTicketNumbersToHead(ticketNumbers, 'inline-prepend', ticketNumberPosition) +
    addSubject(answers.subject) +
    addTicketNumbersToHead(ticketNumbers, 'inline-append', ticketNumberPosition)
  ).slice(0, defaultMaxLineWidth);

  // Wrap these lines at 100 characters
  let body = wrap(answers.body, wrapOptions) || '';
  body = addBreaklinesIfNeeded(body, config.breaklineChar);

  const footerTickets = ticketNumberPosition === 'footer' ? wrap(ticketNumbers) : null;
  const breaking = wrap(answers.breaking, wrapOptions);
  const footer = wrap(answers.footer, wrapOptions);

  let result = head;
  if (footerTickets) {
    result += `\n\n${footerTickets}`;
  }
  if (body) {
    result += `\n\n${body}`;
  }
  if (breaking) {
    const breakingPrefix = config && config.breakingPrefix ? config.breakingPrefix : 'BREAKING CHANGE:';
    result += `\n\n${breakingPrefix}\n${breaking}`;
  }
  if (footer) {
    result += addFooter(footer, config);
  }

  return escapeSpecialChars(result);
};
