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

  // First try to find config block in the nearest package.json
  var pkg = findConfig.require('package.json', {home: false});
  if (pkg) {
    if (pkg.config && pkg.config['cz-customizable'] && pkg.config['cz-customizable'].config) {
      var pkgPath = path.resolve(pkg.config['cz-customizable'].config);

      console.info('>>> Using cz-customizable config specified in your package.json: ', pkgPath);

      config = require(pkgPath);
      return config;
    }
  }

  // Second attempt is the nearest .cz-config.js.
  var config = findConfig.require(CZ_CONFIG_NAME, {home: false});

  if (config) {
    console.info('>>> cz-customizable config file has been found.');
    return config;
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
            fs.write(info.fd, buildCommit(answers));
            fs.close(info.fd, function(err) {
              editor(info.path, function (code, sig) {
                if (code === 0) {
                  var commitStr = fs.readFileSync(info.path, { encoding: 'utf8' });
                  commit(commitStr);
                } else {
                  log.info('Editor returned non zero value. Commit message was:\n' + buildCommit(answers));
                }
              });
            });
          }
        });
      } else if (answers.confirmCommit === 'yes') {
        commit(buildCommit(answers));
      } else {
        log.info('Commit has been canceled.');
      }
    });
  }
};
