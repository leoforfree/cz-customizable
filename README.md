# cz-customizable

This is a customizable Commitizen plugin. You can specify the commit types, scopes and override scopes for specific types.

Steps:
- install commitizen case you don't have it: `npm install -g commitizen`
- install the cz-customizable: `npm install cz-customizable`
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
- copy the file `.cz-config-EXAMPLE.js` to the root of your project.
- rename the file to `.cz-config.js` and modify the options and scopes as you like.

From now on, instead of `git commit` you type `git cz` and let the tool do the work for you.

Hopefully this will help you to have consistent commit messages and have a fully automated deployemnt without any human intervention.

Related tools:
- https://github.com/stevemao/conventional-recommended-bump
- https://github.com/semantic-release/semantic-release

Part of the [commitizen](https://github.com/commitizen/cz-cli) family. Prompts for [conventional changelog](https://github.com/ajoslin/conventional-changelog/blob/master/conventions/angular.md) standard.


Please feel free to send any any suggestion.

TODO:
- unit tests
- set up semantic releases

