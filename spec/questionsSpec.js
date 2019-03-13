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
      allowBreakingChanges: ['feat'],
      allowTicketNumber: true,
      isTicketNumberRequired: true,
      ticketNumberPrefix: 'TICKET-',
      ticketNumberRegExp: '\\d{1,5}',
      subjectLimit: 20
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

    // question 4 - TICKET_NUMBER
    expect(getQuestion(4).name).toEqual('ticketNumber');
    expect(getQuestion(4).type).toEqual('input');
    expect(getQuestion(4).message.indexOf('Enter the ticket number following this pattern')).toEqual(0);
    expect(getQuestion(4).validate()).toEqual(false); //mandatory question

    // question 5 - SUBJECT
    expect(getQuestion(5).name).toEqual('subject');
    expect(getQuestion(5).type).toEqual('input');
    expect(getQuestion(5).message).toMatch(/IMPERATIVE tense description/);
    expect(getQuestion(5).filter('Subject')).toEqual('subject');
    expect(getQuestion(5).validate('bad subject that exceed limit')).toEqual('Exceed limit: 20');
    expect(getQuestion(5).validate('good subject')).toEqual(true);
    
    // question 6 - BODY
    expect(getQuestion(6).name).toEqual('body');
    expect(getQuestion(6).type).toEqual('input');

    // question 7 - BREAKING CHANGE
    expect(getQuestion(7).name).toEqual('breaking');
    expect(getQuestion(7).type).toEqual('input');
    expect(getQuestion(7).when({type: 'feat'})).toEqual(true);
    expect(getQuestion(7).when({type: 'fix'})).toEqual(false);

    // question 8 - FOOTER
    expect(getQuestion(8).name).toEqual('footer');
    expect(getQuestion(8).type).toEqual('input');
    expect(getQuestion(8).when({type: 'fix'})).toEqual(true);
    expect(getQuestion(8).when({type: 'WIP'})).toEqual(false);

    //question 9, last one, CONFIRM COMMIT OR NOT
    expect(getQuestion(9).name).toEqual('confirmCommit');
    expect(getQuestion(9).type).toEqual('expand');


    var answers = {
      confirmCommit: 'yes',
      type: 'feat',
      scope: 'myScope',
      subject: 'create a new cool feature'
    };
    expect(getQuestion(9).message(answers)).toMatch('Are you sure you want to proceed with the commit above?');
  });

  it('default length limit of subject should be 100', function() {
    config = {
      types: [{value: 'feat', name: 'feat: my feat'}]
    };
    expect(getQuestion(5).validate('good subject')).toEqual(true);
    expect(getQuestion(5).validate('bad subject that exceed limit bad subject that exceed limitbad subject that exceed limit test test test')).toEqual('Exceed limit: 100');
  });


  describe('optional fixOverride and allowBreakingChanges', function() {

    it('should restrict BREAKING CHANGE question when config property "allowBreakingChanges" specifies array of types', function() {
      config = {
        types: [{value: 'feat', name: 'feat: my feat'}],
        scopes: [{name: 'myScope'}],
        allowBreakingChanges: ['fix']
      };
      expect(getQuestion(7).name).toEqual('breaking');

      var answers = {
        type: 'feat'
      };

      expect(getQuestion(7).when(answers)).toEqual(false); // not allowed
    });

    it('should allow BREAKING CHANGE question when config property "allowBreakingChanges" specifies array of types and answer is one of those', function() {
      config = {
        types: [{value: 'feat', name: 'feat: my feat'}],
        scopes: [{name: 'myScope'}],
        allowBreakingChanges: ['fix', 'feat']
      };
      expect(getQuestion(7).name).toEqual('breaking');

      var answers = {
        type: 'feat'
      };

      expect(getQuestion(7).when(answers)).toEqual(true); // allowed
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

  describe('no TicketNumber question', function() {

    it('should use scope override', function() {
      config = {
        types: [{value: 'feat', name: 'feat: my feat'}],
        allowTicketNumber: false
      };

      // question 4 with
      expect(getQuestion(4).name).toEqual('ticketNumber');
      expect(getQuestion(4).when()).toEqual(false);
    });
  });

  describe('TicketNumber', function() {

    it('disable TicketNumber question', function() {
      config = {
        types: [{value: 'feat', name: 'feat: my feat'}],
        allowTicketNumber: false
      };

      // question 4 with
      expect(getQuestion(4).name).toEqual('ticketNumber');
      expect(getQuestion(4).when()).toEqual(false);
    });

    it('custom message defined', function() {
      config = {
        types: [{value: 'feat', name: 'feat: my feat'}],
        allowTicketNumber: true,
        messages: {
          ticketNumber: 'ticket number'
        }
      };

      // question 4 with
      expect(getQuestion(4).name).toEqual('ticketNumber');
      expect(getQuestion(4).message).toEqual('ticket number');
    });

    describe('validation', function() {
      it('invalid because empty and required', function() {
        config = {
          isTicketNumberRequired: true
        };
        expect(getQuestion(4).validate('')).toEqual(false);
      });
      it('empty but valid because optional', function() {
        config = {
          isTicketNumberRequired: false
        };
        expect(getQuestion(4).validate('')).toEqual(true);
      });
      it('valid because there is no regexp defined', function() {
        config = {
          isTicketNumberRequired: true,
          ticketNumberRegExp: undefined
        };
        expect(getQuestion(4).validate('21234')).toEqual(true);
      });
      it('invalid because regexp don\'t match', function() {
        config = {
          isTicketNumberRequired: true,
          ticketNumberRegExp: '\\d{1,5}'
        };
        expect(getQuestion(4).validate('sddsa')).toEqual(false);
      });
      it('valid because regexp match', function() {
        config = {
          isTicketNumberRequired: true,
          ticketNumberRegExp: '\\d{1,5}'
        };
        expect(getQuestion(4).validate('12345')).toEqual(true);
      });
    });

  });


});
