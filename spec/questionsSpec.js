'use strict';

describe('cz-customizable', function() {

  var questions, config;

  beforeEach(function() {
    questions = require('../questions.js');
    config = null;
  });

  var mockedCz = {
    Separator: jasmine.createSpy()
  };

  var getQuestion = function(number) {
    return questions.getQuestions(config, mockedCz)[number - 1];
  };

  it('should array of questions be returned', function() {
    config = {
      types: [{value: 'feat', name: 'feat: my feat'}],
      scopes: [{name: 'myScope'}],
      scopeOverrides: {
        fix: [{name: 'fixOverride'}]
      },
      allowCustomScopes: true,
      allowBreakingChanges: ['feat']
    };

    // question 1 - TYPE
    expect(getQuestion(1).name).toEqual('type');
    expect(getQuestion(1).type).toEqual('list');
    expect(getQuestion(1).choices[0]).toEqual({value: 'feat', name: 'feat: my feat'});

    // question 2 - SCOPE
    expect(getQuestion(2).name).toEqual('scope');
    expect(getQuestion(2).choices({})[0]).toEqual({name: 'myScope'});
    expect(getQuestion(2).choices({type: 'fix'})[0]).toEqual({name: 'fixOverride'}); //should override scope
    expect(getQuestion(2).when({type: 'fix'})).toEqual(true);
    expect(getQuestion(2).when({type: 'WIP'})).toEqual(false);
    expect(getQuestion(2).when({type: 'wip'})).toEqual(false);

    // question 3 - SCOPE CUSTOM
    expect(getQuestion(3).name).toEqual('scope');
    expect(getQuestion(3).when({scope: 'custom'})).toEqual(true);
    expect(getQuestion(3).when({scope: false})).toEqual(false);
    expect(getQuestion(3).when({scope: 'scope'})).toEqual(false);

    // question 4 - SUBJECT
    expect(getQuestion(4).name).toEqual('subject');
    expect(getQuestion(4).type).toEqual('input');
    expect(getQuestion(4).message).toMatch(/IMPERATIVE tense description/);
    expect(getQuestion(4).validate()).toEqual(false); //mandatory question
    expect(getQuestion(4).filter('Subject')).toEqual('subject');

    // question 5 - BODY
    expect(getQuestion(5).name).toEqual('body');
    expect(getQuestion(5).type).toEqual('input');

    // question 6 - BREAKING CHANGE
    expect(getQuestion(6).name).toEqual('breaking');
    expect(getQuestion(6).type).toEqual('input');
    expect(getQuestion(6).when({type: 'feat'})).toEqual(true);
    expect(getQuestion(6).when({type: 'fix'})).toEqual(false);

    // question 7 - FOOTER
    expect(getQuestion(7).name).toEqual('footer');
    expect(getQuestion(7).type).toEqual('input');
    expect(getQuestion(7).when({type: 'fix'})).toEqual(true);
    expect(getQuestion(7).when({type: 'WIP'})).toEqual(false);

    //question 8, last one, CONFIRM COMMIT OR NOT
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


  describe('optional fixOverride and allowBreakingChanges', function() {

    it('should restrict BREAKING CHANGE question when config property "allowBreakingChanges" specifies array of types', function() {
      config = {
        types: [{value: 'feat', name: 'feat: my feat'}],
        scopes: [{name: 'myScope'}],
        allowBreakingChanges: ['fix']
      };
      expect(getQuestion(6).name).toEqual('breaking');

      var answers = {
        type: 'feat'
      };

      expect(getQuestion(6).when(answers)).toEqual(false); // not allowed
    });

    it('should allow BREAKING CHANGE question when config property "allowBreakingChanges" specifies array of types and answer is one of those', function() {
      config = {
        types: [{value: 'feat', name: 'feat: my feat'}],
        scopes: [{name: 'myScope'}],
        allowBreakingChanges: ['fix', 'feat']
      };
      expect(getQuestion(6).name).toEqual('breaking');

      var answers = {
        type: 'feat'
      };

      expect(getQuestion(6).when(answers)).toEqual(true); // allowed
    });

  });

  describe('Optional scopes', function() {

    it('should use scope override', function() {
      config = {
        types: [{value: 'feat', name: 'feat: my feat'}],
        scopeOverrides: {
          feat: [{name: 'myScope'}]
        }
      };

      // question 2 with
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
