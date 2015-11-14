# cz-customizable

This is a customizable Commitizen plugin. You can specify the commit types, scopes and override scopes for specific types.

[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/) [![Build Status](https://travis-ci.org/leonardoanalista/cz-customizable.svg)](https://travis-ci.org/leonardoanalista/cz-customizable) [![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release) [![codecov.io](https://codecov.io/github/leonardoanalista/cz-customizable/coverage.svg?branch=master)](https://codecov.io/github/leonardoanalista/cz-customizable?branch=master) [![npm monthly downloads](https://img.shields.io/npm/dm/cz-customizable.svg?style=flat-square)](https://www.npmjs.com/package/cz-customizable)


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
- the `postinstall` script will automatically create a `.cz-config` in the root of your project. It also crates a symlink inside `node_modules/cz-customizable` to point to your config file.

- you should commit your `.cz-config.js` file to your git.
* if you don't provide a config file, this adapter will use the contents of the default file `node_modules/cz-customizable/cz-config-EXAMPLE.js`


From now on, instead of `git commit` you type `git cz` and let the tool do the work for you.

Hopefully this will help you to have consistent commit messages and have a fully automated deployemnt without any human intervention.

Related tools:
- https://github.com/commitizen/cz-cli
- https://github.com/stevemao/conventional-recommended-bump
- https://github.com/semantic-release/semantic-release


It prompts for [conventional changelog](https://github.com/ajoslin/conventional-changelog/blob/master/conventions/angular.md) standard.


Troubleshooting: 
- you can't see the file `.cz-config` in the root of your porject.
  - you can manually copy from `node_modules/cz-customizable/cz-config-EXAMPLE.js` to your project root (where your package.json is) and rename to `.cz-config.js`

- you edited the contents of `.cz-config.js` but `git cz` still doesn't show your values
  - probably the post install script didn't create the symlink properly.
    - Manual symlink creation:
      - copy the file `cz-config-EXAMPLE.js` to the root of your project.
      - rename the file to `.cz-config.js` and modify the options and scopes as you like.
      - Now create a symlink to your config file:
        - Linux ```ln -nsf ../../.cz-config.js node_modules/cz-customizable/.cz-config.js```
        - Windows (something like this): ```mklink /D node_modules\cz-customizable\.cz-config.js ..\..\.cz-config.js```


Please feel free to send any suggestion.
