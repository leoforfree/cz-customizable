'use strict';


describe('cz-customizable', function() {

  var module, cz, commit;
  var rewire = require('rewire');

  beforeEach(function() {
    module = rewire('../index.js');

    module.__set__({
      // it mocks winston logging tool
      log: {
        info: function() {}
      },

      readConfigFile: function() {
        return {
          types: [{value: 'feat', name: 'feat: my feat'}],
          scopes: [{name: 'myScope'}],
          scopeOverrides: {
            fix: [{name: 'fixOverride'}]
          },
          allowCustomScopes: true,
          allowBreakingChanges: ['feat']
        };
      }
    });

    cz = jasmine.createSpyObj('cz', ['prompt', 'Separator']);
    commit = jasmine.createSpy();
  });


  it('should call cz.prompt with questions', function() {
    module.prompter(cz, commit);

    var getQuestion = function(number) {
      return cz.prompt.mostRecentCall.args[0][number - 1];
    };

    //question 1
    expect(getQuestion(1).name).toEqual('type');
    expect(getQuestion(1).type).toEqual('list');
    expect(getQuestion(1).choices[0]).toEqual({value: 'feat', name: 'feat: my feat'});

    //question 2
    expect(getQuestion(2).name).toEqual('scope');
    expect(getQuestion(2).choices({})[0]).toEqual({name: 'myScope'});
    expect(getQuestion(2).choices({type: 'fix'})[0]).toEqual({name: 'fixOverride'}); //should override scope
    expect(getQuestion(2).when({type: 'fix'})).toEqual(true);
    expect(getQuestion(2).when({type: 'WIP'})).toEqual(false);
    expect(getQuestion(2).when({type: 'wip'})).toEqual(false);

    //question 3
    expect(getQuestion(3).name).toEqual('scope');
    expect(getQuestion(3).when({scope: 'custom'})).toEqual(true);
    expect(getQuestion(3).when({scope: false})).toEqual(false);
    expect(getQuestion(3).when({scope: 'scope'})).toEqual(false);

    //question 4
    expect(getQuestion(4).name).toEqual('subject');
    expect(getQuestion(4).type).toEqual('input');
    expect(getQuestion(4).message).toMatch(/IMPERATIVE tense description/);
    expect(getQuestion(4).validate()).toEqual(false); //mandatory question
    expect(getQuestion(4).filter('Subject')).toEqual('subject');

    //question 5
    expect(getQuestion(5).name).toEqual('body');
    expect(getQuestion(5).type).toEqual('input');

    //question 6
    expect(getQuestion(6).name).toEqual('breaking');
    expect(getQuestion(6).type).toEqual('input');
    expect(getQuestion(6).when({type: 'feat'})).toEqual(true);
    expect(getQuestion(6).when({type: 'fix'})).toEqual(false);

    //question 7
    expect(getQuestion(7).name).toEqual('footer');
    expect(getQuestion(7).type).toEqual('input');
    expect(getQuestion(7).when({type: 'fix'})).toEqual(true);
    expect(getQuestion(7).when({type: 'WIP'})).toEqual(false);

    //question 8, last one
    expect(getQuestion(8).name).toEqual('confirmCommit');
    expect(getQuestion(8).type).toEqual('expand');


    var answers = {
      confirmCommit: 'yes',
      type: 'feat',
      scope: 'myScope',
      subject: 'create a new cool feature'
    };
    expect(getQuestion(8).message(answers)).toMatch('Are you sure you want to proceed with the commit above?');
  });

  it('should not call commit() function if there is no final confirmation', function() {
    module.prompter(cz, commit);
    var commitAnswers = cz.prompt.mostRecentCall.args[1];
    var res = commitAnswers({});

    expect(res).toEqual(undefined);
    expect(commit).not.toHaveBeenCalled();
  });

  it('should call commit() function with commit message when user confirms commit and split body when pipes are present', function() {
    module.prompter(cz, commit);
    var commitAnswers = cz.prompt.mostRecentCall.args[1];

    var answers = {
      confirmCommit: 'yes',
      type: 'feat',
      scope: 'myScope',
      subject: 'create a new cool feature',
      body: '-line1|-line2',
      breaking: 'breaking',
      footer: 'my footer'
    };

    commitAnswers(answers);
    expect(commit).toHaveBeenCalledWith('feat(myScope): create a new cool feature\n\n-line1\n-line2\n\nBREAKING CHANGE:\nbreaking\n\nmy footer');
  });

  it('should call commit() function with commit message with the minimal required fields', function() {
    module.prompter(cz, commit);
    var commitAnswers = cz.prompt.mostRecentCall.args[1];

    var answers = {
      confirmCommit: 'yes',
      type: 'feat',
      scope: 'myScope',
      subject: 'create a new cool feature'
    };

    commitAnswers(answers);
    expect(commit).toHaveBeenCalledWith('feat(myScope): create a new cool feature');
  });

  it('should suppress scope when commit type is WIP', function() {
    module.prompter(cz, commit);
    var commitAnswers = cz.prompt.mostRecentCall.args[1];

    var answers = {
      confirmCommit: 'yes',
      type: 'WIP',
      subject: 'this is my work-in-progress'
    };

    commitAnswers(answers);
    expect(commit).toHaveBeenCalledWith('WIP: this is my work-in-progress');
  });

  it('should allow edit message before commit', function(done) {
    module.prompter(cz, commit);
    var commitAnswers = cz.prompt.mostRecentCall.args[1];
    process.env.EDITOR = 'true';

    var answers = {
      confirmCommit: 'edit',
      type: 'feat',
      subject: 'create a new cool feature'
    };

    commitAnswers(answers);
    setTimeout(function() {
      expect(commit).toHaveBeenCalledWith('feat: create a new cool feature');
      done();
    }, 100);
  });

  it('should not commit if editor returned non-zero value', function(done) {
    module.prompter(cz, commit);
    var commitAnswers = cz.prompt.mostRecentCall.args[1];
    process.env.EDITOR = 'false';

    var answers = {
      confirmCommit: 'edit',
      type: 'feat',
      subject: 'create a new cool feature'
    };

    commitAnswers(answers);
    setTimeout(function() {
      expect(commit.wasCalled).toEqual(false);
      done();
    }, 100);
  });

  it('should truncate first line if number of characters is higher than 200', function() {
    module.prompter(cz, commit);
    var commitAnswers = cz.prompt.mostRecentCall.args[1];

    var chars_100 = '0123456789-0123456789-0123456789-0123456789-0123456789-0123456789-0123456789-0123456789-0123456789-0123456789';

    var answers = {
      confirmCommit: 'yes',
      type: 'feat',
      scope: 'myScope',
      subject: chars_100,
      body: chars_100 + ' body-second-line',
      footer: chars_100 + ' footer-second-line'
    };

    commitAnswers(answers);

    var firstPart = 'feat(myScope): ';

    var firstLine = commit.mostRecentCall.args[0].split('\n\n')[0];
    expect(firstLine).toEqual(firstPart + answers.subject.slice(0, 100 - firstPart.length));

    //it should wrap body
    var body = commit.mostRecentCall.args[0].split('\n\n')[1];
    expect(body).toEqual(chars_100 + '\nbody-second-line');

    //it should wrap footer
    var footer = commit.mostRecentCall.args[0].split('\n\n')[2];
    expect(footer).toEqual(chars_100 + '\nfooter-second-line');

  });


  describe('optional fixOverride and allowBreakingChanges', function() {

    beforeEach(function() {
      module.__set__({
        readConfigFile: function() {
          return {
            types: [{value: 'feat', name: 'feat: my feat'}],
            scopes: [{name: 'myScope'}]
          };
        }
      });

      cz = jasmine.createSpyObj('cz', ['prompt', 'Separator']);
      commit = jasmine.createSpy();
    });


    it('should call cz.prompt with questions', function() {
      module.prompter(cz, commit);

      var getQuestion = function(number) {
        return cz.prompt.mostRecentCall.args[0][number - 1];
      };

      //question 1
      expect(getQuestion(1).name).toEqual('type');
      expect(getQuestion(1).type).toEqual('list');
      expect(getQuestion(1).choices[0]).toEqual({value: 'feat', name: 'feat: my feat'});

      //question 2
      expect(getQuestion(2).name).toEqual('scope');
      expect(getQuestion(2).choices({})[0]).toEqual({name: 'myScope'});
      expect(getQuestion(2).choices({type: 'fix'})[0]).toEqual({name: 'myScope'}); //should override scope
      expect(getQuestion(2).when({type: 'fix'})).toEqual(true);
      expect(getQuestion(2).when({type: 'WIP'})).toEqual(false);
      expect(getQuestion(2).when({type: 'wip'})).toEqual(false);

      //question 6
      expect(getQuestion(6).name).toEqual('breaking');
      expect(getQuestion(6).when({type: 'feat'})).toEqual(true);
      expect(getQuestion(6).when({type: 'fix'})).toEqual(true);
      expect(getQuestion(6).when({type: 'FIX'})).toEqual(true);

      var answers = {
        confirmCommit: 'yes',
        type: 'feat',
        scope: 'myScope',
        subject: 'create a new cool feature'
      };
      expect(getQuestion(8).message(answers)).toMatch('Are you sure you want to proceed with the commit above?');
    });
  });

  describe('optional scopes', function() {

    beforeEach(function() {
      module.__set__({
        readConfigFile: function() {
          return {
            types: [{value: 'feat', name: 'feat: my feat'}],
            scopeOverrides: {
              feat: [{name: 'myScope'}]
            }
          };
        }
      });

      cz = jasmine.createSpyObj('cz', ['prompt', 'Separator']);
      commit = jasmine.createSpy();
    });


    it('should call cz.prompt with questions', function() {
      module.prompter(cz, commit);

      var getQuestion = function(number) {
        return cz.prompt.mostRecentCall.args[0][number - 1];
      };

      //question 2
      expect(getQuestion(2).name).toEqual('scope');
      expect(getQuestion(2).choices({})[0]).toBeUndefined();
      expect(getQuestion(2).choices({type: 'feat'})[0]).toEqual({name: 'myScope'}); //should override scope
      expect(getQuestion(2).when({type: 'feat'})).toEqual(true);
      (function () {
        var answers = {type: 'fix'};
        expect(getQuestion(2).when(answers)).toEqual(false);
        expect(answers.scope).toEqual('custom');
      })();

    });
  });


});
