# cz-customizable

This is a customizable Commitizen plugin. You can specify the commit types, scopes and override scopes for specific types.

[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/) [![Build Status](https://travis-ci.org/leonardoanalista/cz-customizable.svg)](https://travis-ci.org/leonardoanalista/cz-customizable) [![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release) [![codecov.io](https://codecov.io/github/leonardoanalista/cz-customizable/coverage.svg?branch=master)](https://codecov.io/github/leonardoanalista/cz-customizable?branch=master) [![npm monthly downloads](https://img.shields.io/npm/dm/cz-customizable.svg?style=flat-square)](https://www.npmjs.com/package/cz-customizable)


## Steps:
- install commitizen in case you don't have it: `npm install -g commitizen`
- install the cz-customizable: `npm install cz-customizable --save-dev`
- configure `commitizen` to use `cz-customizable` as plugin. Add those lines to your `package.json`:
  ```
  ...
  "config": {
    "commitizen": {
      "path": "node_modules/cz-customizable"
    }
  }
  ```
  
- you should commit your `.cz-config.js` file to your git. Run `cp ./node_modules/cz-customizable/cz-config-EXAMPLE.js ./.cz-config.js` in a project root directory to get a template.

* if you don't provide a config file, this adapter will use the contents of the default file `node_modules/cz-customizable/cz-config-EXAMPLE.js`


From now on, instead of `git commit` you type `git cz` and let the tool do the work for you.

Hopefully this will help you to have consistent commit messages and have a fully automated deployemnt without any human intervention.

## Related tools:
- (https://github.com/commitizen/cz-cli)
- (https://github.com/stevemao/conventional-recommended-bump)
- (https://github.com/semantic-release/semantic-release)


It prompts for [conventional changelog](https://github.com/ajoslin/conventional-changelog/blob/master/conventions/angular.md) standard.


## CONTRIBUTING

Please refer to the [Contributor Guidelines](https://github.com/angular/angular.js/blob/master/CONTRIBUTING.md) and [Conduct of Code](https://github.com/angular/code-of-conduct/blob/master/CODE_OF_CONDUCT.md) from [AngularJs](https://github.com/angular/angular.js) project.




Leonardo Correa
