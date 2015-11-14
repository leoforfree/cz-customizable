# cz-customizable

This is a customizable Commitizen plugin. You can specify the commit types, scopes and override scopes for specific types.

[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

[![Build Status](https://travis-ci.org/leonardoanalista/cz-customizable.svg)](https://travis-ci.org/leonardoanalista/cz-customizable)

[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

[![npm monthly downloads](https://img.shields.io/npm/dm/cz-customizable.svg?style=flat-square)](https://www.npmjs.com/package/cz-customizable)


Steps:
- install commitizen case you don't have it: `npm install -g commitizen`
- install the cz-customizable: `npm install cz-customizable --save-dev`
- configure `commitizen` to use `cz-customizable` as plugin. There are a few ways to do this.
  - Option 1: change your `package.json`
  ```
  ...
  "config": {
    "commitizen": {
      "path": "node_modules/cz-customizable"
    }
  }
  ```
  - Option 2: Create a file called `.cz.json`
  ```
  {
  "path": "node_modules/cz-customizable"
  }
  ```

- Optionall step - Override the commit types and scopes:
  - copy the file `.cz-config-EXAMPLE.js` to the root of your project.
  - rename the file to `.cz-config.js` and modify the options and scopes as you like.
  - Now create a symlink to your config file: (I am sorry about this I am working on getting around the `require(../../.cz-config)` in a nice way. If you know a better way please let me know. I definitelly want to learn how to do this better)
    - Linux ```ln -nsf ../../.cz-config.js node_modules/cz-customizable/.cz-config.js```
    - Windows (something like this): ```mklink /D node_modules\cz-customizable\.cz-config.js ..\..\.cz-config.js```

- you should commit your `.cz-config.js` file to git.
* if you don't override, this plugin will use the contents of file `node_modules/cz-customizable/.cz-config-EXAMPLE.js`


From now on, instead of `git commit` you type `git cz` and let the tool do the work for you.

Hopefully this will help you to have consistent commit messages and have a fully automated deployemnt without any human intervention.

Related tools:
- https://github.com/commitizen/cz-cli
- https://github.com/stevemao/conventional-recommended-bump
- https://github.com/semantic-release/semantic-release


It prompts for [conventional changelog](https://github.com/ajoslin/conventional-changelog/blob/master/conventions/angular.md) standard.


Please feel free to send any suggestion.



