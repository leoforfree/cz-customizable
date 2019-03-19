const wrap = require('word-wrap');

function addTicketNumber(ticketNumber, config) {
  if (!ticketNumber) {
    return '';
  }
  if (config.ticketNumberPrefix) {
    return `${config.ticketNumberPrefix + ticketNumber.trim()} `;
  }
  return `${ticketNumber.trim()} `;
}

module.exports = function buildCommit(answers, config) {
  const maxLineWidth = 100;

  const wrapOptions = {
    trim: true,
    newline: '\n',
    indent: '',
    width: maxLineWidth,
  };

  function addScope(scope) {
    if (!scope) return ': '; // it could be type === WIP. So there is no scope

    return `(${scope.trim()}): `;
  }

  function addSubject(subject) {
    return subject.trim();
  }

  function escapeSpecialChars(result) {
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
  }

  // Hard limit this line
  // eslint-disable-next-line max-len
  const head = (
    answers.type +
    addScope(answers.scope) +
    addTicketNumber(answers.ticketNumber, config) +
    addSubject(answers.subject)
  ).slice(0, maxLineWidth);

  // Wrap these lines at 100 characters
  let body = wrap(answers.body, wrapOptions) || '';
  body = body.split('|').join('\n');

  const breaking = wrap(answers.breaking, wrapOptions);
  const footer = wrap(answers.footer, wrapOptions);

  let result = head;
  if (body) {
    result += `\n\n${body}`;
  }
  if (breaking) {
    const breakingPrefix = config && config.breakingPrefix ? config.breakingPrefix : 'BREAKING CHANGE:';
    result += `\n\n${breakingPrefix}\n${breaking}`;
  }
  if (footer) {
    const footerPrefix = config && config.footerPrefix ? config.footerPrefix : 'ISSUES CLOSED:';
    result += `\n\n${footerPrefix} ${footer}`;
  }

  return escapeSpecialChars(result);
};
