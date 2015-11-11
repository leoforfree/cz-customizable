
// Inspired by: https://github.com/commitizen/cz-conventional-changelog and https://github.com/commitizen/cz-cli

var wrap = require('./node_modules/word-wrap/index');


function readConfigFile(){
  var config;
  try {
    // Yry to find a customized version for the project
    // This file is a symlink to the real one usually placed in the root of your project.
    config = require('./.cz-config');
  } catch (err) {
    config = require('./cz-config-EXAMPLE');
  }
  return config;
}
var config = readConfigFile();

function buildCommit(answers) {
  var maxLineWidth = 100;

  var wrapOptions = {
    trim: true,
    newline: '\n',
    indent:'',
    width: maxLineWidth
  };

  function addScope(scope) {
    if (!scope) return '';

    return '(' + scope.trim() + '): '
  }

  function addSubject(subject) {
    if (!subject) return '';

    if(!answers.scope)
      return ': ' + subject.trim();

    return subject.trim();
  }

  // Hard limit this line
  var head = (answers.type + addScope(answers.scope) + addSubject(answers.subject)).slice(0, maxLineWidth);

  // Wrap these lines at 100 characters
  var body = wrap(answers.body, wrapOptions) || '';
  body = body.split('|').join('\n');

  var footer = wrap(answers.footer, wrapOptions);

  var result = head
  if(body) {
    result += '\n\n' + body;
  }
  if(footer) {
    result += '\n\n' + footer;
  }

  return result;
}

var isNotWip = function(answers) {
  return answers.type.toLowerCase() !== 'wip';
}

var logger = function(arguments) {
  console.info(arguments);
}

module.exports = {

  prompter: function(cz, commit) {

    // console.info('\nLine 1 will be cropped at 100 characters. All other lines will be wrapped after 100 characters.\n');
    logger('\nLine 1 will be cropped at 100 characters. All other lines will be wrapped after 100 characters.\n');

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
        message: '\nDenote the SCOPE of this change:\n',
        choices: function(answers) {

          if (config.scopeOverrides[answers.type]) {
            return config.scopeOverrides[answers.type];
          }

          return config.scopes;
        },
        when: isNotWip
      },
      {
        type: 'input',
        name: 'subject',
        message: '\nWrite a SHORT, IMPERATIVE tense description of the change:\n',
        validate: function(value) {
          return !!value;
        }
      }, {
        type: 'input',
        name: 'body',
        message: '\nProvide a LONGER description of the change (optional). Use "|" to break new line:\n'
      }, {
        type: 'input',
        name: 'footer',
        message: '\nList any BREAKING CHANGES or ISSUES CLOSED by this change (optional):\n',
        when: isNotWip
      },
      {
        type: 'confirm',
        name: 'confirmCommit',
        message: function(answers) {
          var SEP = '###--------------------------------------------------------###';
          logger('\n' + SEP + '\n' + buildCommit(answers) + '\n' + SEP + '\n');
          return 'Are you sure you want to proceed with the commit above?';
        }
      }
    ], function(answers) {
      if (!answers.confirmCommit) {
        logger('Commit has been canceled.');
        return;
      }

      var commitStr = buildCommit(answers);
      commit(commitStr);
    });
  }
}
