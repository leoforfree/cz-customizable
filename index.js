
// Inspired by: https://github.com/commitizen/cz-conventional-changelog and https://github.com/commitizen/cz-cli

var CWD = process.cwd();

try {
  // Yry to find a customized version for the project
  // This file is a symlink to the real one usually placed in the root of your project.
  var config = require('./.cz-config');
} catch (err) {
  var config = require('./cz-config-EXAMPLE');
}

var wrap = require('./node_modules/word-wrap/index');


var types = config.types;
var scopes = config.scopes;
var scopeOverrides = config.scopeOverrides;


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
  var body = wrap(answers.body, wrapOptions);
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

var isWip = function(answers) {
  return answers.type !== 'WIP';
}

module.exports = {

  prompter: function(cz, commit) {

    console.log('\nLine 1 will be cropped at 100 characters. All other lines will be wrapped after 100 characters.\n');

    cz.prompt([
      {
        type: 'list',
        name: 'type',
        message: '\nSelect the type of change that you\'re committing:',
        choices: types
      },

      {
        type: 'list',
        name: 'scope',
        message: '\nDenote the SCOPE of this change:\n',
        choices: function(answers) {

          if (scopeOverrides[answers.type]) {
            return scopeOverrides[answers.type];
          }

          return scopes;
        },
        when: isWip
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
        when: isWip
      },
      {
        type: 'confirm',
        name: 'confirmCommit',
        message: function(answers) {
          var SEP = '###--------------------------------------------------------###';
          console.info('\n' + SEP + '\n' + buildCommit(answers) + '\n' + SEP + '\n');
          return 'Are you sure you want to proceed with the commit above?';
        }
      }
    ], function(answers) {
      if (!answers.confirmCommit) {
        console.info('Commit has been canceled.');
        return;
      }

      var commitStr = buildCommit(answers);
      commit(commitStr);
    });
  }
}
