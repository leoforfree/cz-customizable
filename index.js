'use strict';

// Inspired by: https://github.com/commitizen/cz-conventional-changelog and https://github.com/commitizen/cz-cli

var CZ_CONFIG_NAME = '.cz-config.js';
var CZ_CONFIG_EXAMPLE_LOCATION = './cz-config-EXAMPLE.js';
var findConfig = require('find-config');
var log = require('winston');
var editor = require('editor');
var temp = require('temp').track();
var fs = require('fs');
var path = require('path');
var buildCommit = require('./buildCommit');


/* istanbul ignore next */
function readConfigFile() {

  // First try to find the .cz-config.js config file
  var czConfig = findConfig.require(CZ_CONFIG_NAME, {home: false});
  if (czConfig) {
    return czConfig;
  }

  // fallback to locating it using the config block in the nearest package.json
  var pkg = findConfig('package.json', {home: false});
  if (pkg) {
    var pkgDir = path.dirname(pkg);
    pkg = require(pkg);

    if (pkg.config && pkg.config['cz-customizable'] && pkg.config['cz-customizable'].config) {
      // resolve relative to discovered package.json
      var pkgPath = path.resolve(pkgDir, pkg.config['cz-customizable'].config);

      console.info('>>> : 在 package.json 确定使用 cz-customizable 配置文件', pkgPath);

      return require(pkgPath);
    }
  }

  log.warn('不能找到配置文件，请参考文档来学习如何搭建: https://github.com/leonardoanalista/cz-customizable#steps "');
}

module.exports = {
  prompter: function(cz, commit) {
    var config = readConfigFile();
    var subjectLimit = config.subjectLimit || 100;

    cz.prompt.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));
    log.info('\n\n首行的字符数会限制在 ' + subjectLimit + ' 个，其它行的字符数如果超过 100，会在第 100 个字符处进行折行\n');


    var questions = require('./questions').getQuestions(config, cz);
    var confirmCommitCallback = {
      edit: function (answers, config) {
        temp.open(null, function(err, info) {
          /* istanbul ignore else */
          if (err) return;

          fs.write(info.fd, buildCommit(answers, config));
          fs.close(info.fd, function(err) {
            editor(info.path, function (code, sig) {
              if (code) {
                log.info('编辑器返回非0. 提交信息:\n' + buildCommit(answers, config));
                return;
              }

              var commitStr = fs.readFileSync(info.path, { encoding: 'utf8' });
              commit(commitStr);
            });
          });
        });
      },
      yes: function (answers, config) {
        commit(buildCommit(answers, config));
      },
      no: function (answers, config) {
        log.info('commit操作已被阻止');
      }
    };

    cz.prompt(questions).then(function (answers) {
      if (confirmCommitCallback[answers.confirmCommit]) {
        confirmCommitCallback[answers.confirmCommit](answers, config);
      }
    });
  }
};
