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

      console.info('>>> Using cz-customizable config specified in your package.json: ', pkgPath);

      return require(pkgPath);
    }
  }

  log.warn('Unable to find a configuration file. Please refer to documentation to learn how to ser up: https://github.com/leonardoanalista/cz-customizable#steps "');
}


module.exports = {

  prompter: function(cz, commit) {
    var config = readConfigFile();

    log.info('\n\nLine 1 will be cropped at 100 characters. All other lines will be wrapped after 100 characters.\n');

    var questions = require('./questions').getQuestions(config, cz);

    cz.prompt(questions).then(function(answers) {

      if (answers.confirmCommit === 'edit') {
        temp.open(null, function(err, info) {
          /* istanbul ignore else */
          if (!err) {
            fs.write(info.fd, buildCommit(answers, config));
            fs.close(info.fd, function(err) {
              editor(info.path, function (code, sig) {
                if (code === 0) {
                  var commitStr = fs.readFileSync(info.path, { encoding: 'utf8' });
                  commit(commitStr);
                } else {
                  log.info('Editor returned non zero value. Commit message was:\n' + buildCommit(answers, config));
                }
              });
            });
          }
        });
      } else if (answers.confirmCommit === 'yes') {
        commit(buildCommit(answers, config));
      } else {
        log.info('Commit has been canceled.');
      }
    });
  }
};
