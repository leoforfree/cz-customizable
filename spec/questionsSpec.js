/* eslint-disable nada/path-case */
const questions = require('../questions.js');

describe('cz-customizable', () => {
  let config;

  beforeEach(() => {
    config = null;
  });

  const mockedCz = {
    Separator: jasmine.createSpy(),
  };

  const getQuestion = number => questions.getQuestions(config, mockedCz)[number - 1];

  it('should array of questions be returned', () => {
    config = {
      types: [{ value: 'feat', name: 'feat: my feat' }],
      scopes: [{ name: 'myScope' }],
      scopeOverrides: {
        fix: [{ name: 'fixOverride' }],
      },
      allowCustomScopes: true,
      allowBreakingChanges: ['feat'],
      allowTicketNumber: true,
      isTicketNumberRequired: true,
      ticketNumberPrefix: 'TICKET-',
      ticketNumberRegExp: '\\d{1,5}',
      subjectLimit: 20,
      wipDefaultChoice: false,
    };

    // question 1 - WIP
    expect(getQuestion(1).name).toEqual('wip');
    expect(getQuestion(1).type).toEqual('expand');
    expect(getQuestion(1).choices[0]).toEqual({ key: 'y', name: 'Yes', value: false });

    // question 2 - TYPE
    expect(getQuestion(2).name).toEqual('type');
    expect(getQuestion(2).type).toEqual('list');
    expect(getQuestion(2).choices[0]).toEqual({
      value: 'feat',
      name: 'feat: my feat',
    });

    // question 3 - SCOPE
    expect(getQuestion(3).name).toEqual('scope');
    expect(getQuestion(3).choices({})[0]).toEqual({ name: 'myScope' });
    expect(getQuestion(3).choices({ type: 'fix' })[0]).toEqual({
      name: 'fixOverride',
    }); // should override scope
    expect(getQuestion(3).when({ type: 'fix' })).toEqual(true);
    expect(getQuestion(3).when({ type: 'WIP' })).toEqual(false);
    expect(getQuestion(3).when({ type: 'wip' })).toEqual(false);

    // question 4 - SCOPE CUSTOM
    expect(getQuestion(4).name).toEqual('scope');
    expect(getQuestion(4).when({ scope: 'custom' })).toEqual(true);
    expect(getQuestion(4).when({ scope: false })).toEqual(false);
    expect(getQuestion(4).when({ scope: 'scope' })).toEqual(false);

    // question 5 - TICKET_NUMBER
    expect(getQuestion(5).name).toEqual('ticketNumbers');
    expect(getQuestion(5).type).toEqual('multiple-select-search');
    expect(getQuestion(5).message({ type: 'feat' })).toContain('(Ticket number is required)');
    expect(getQuestion(5).message({ type: 'feat' })).toContain('Enter the ticket number following this pattern');
    expect(getQuestion(5).validate([], {})).toEqual('You must specify at least one ticket.'); // mandatory question

    // question 6 - SUBJECT
    expect(getQuestion(6).name).toEqual('subject');
    expect(getQuestion(6).type).toEqual('input');
    expect(getQuestion(6).message).toMatch(/IMPERATIVE tense description/);
    expect(getQuestion(6).filter('Subject')).toEqual('subject');
    expect(getQuestion(6).validate('bad subject that exceed limit')).toEqual('Exceed limit: 20');
    expect(getQuestion(6).validate('good subject')).toEqual(true);

    // question 7 - BODY
    expect(getQuestion(7).name).toEqual('body');
    expect(getQuestion(7).type).toEqual('input');

    // question 8 - BREAKING CHANGE
    expect(getQuestion(8).name).toEqual('breaking');
    expect(getQuestion(8).type).toEqual('input');
    expect(getQuestion(8).when({ type: 'feat' })).toEqual(true);
    expect(getQuestion(8).when({ type: 'fix' })).toEqual(false);

    // question 9 - FOOTER
    expect(getQuestion(9).name).toEqual('footer');
    expect(getQuestion(9).type).toEqual('input');
    expect(getQuestion(9).when({ type: 'fix' })).toEqual(true);
    expect(getQuestion(9).when({ type: 'WIP' })).toEqual(false);

    // question 10, last one, CONFIRM COMMIT OR NOT
    expect(getQuestion(10).name).toEqual('confirmCommit');
    expect(getQuestion(10).type).toEqual('expand');

    const answers = {
      confirmCommit: 'yes',
      type: 'feat',
      scope: 'myScope',
      subject: 'create a new cool feature',
    };
    expect(getQuestion(10).message(answers)).toMatch('Are you sure you want to proceed with the commit above?');
  });

  it('default length limit of subject should be 100', () => {
    config = {
      types: [{ value: 'feat', name: 'feat: my feat' }],
    };
    expect(getQuestion(6).validate('good subject')).toEqual(true);
    expect(
      getQuestion(6).validate(
        'bad subject that exceed limit bad subject that exceed limitbad subject that exceed limit test test test'
      )
    ).toEqual('Exceed limit: 100');
  });

  it('subject should be lowercased by default', () => {
    config = {};
    expect(getQuestion(6).filter('Some subject')).toEqual('some subject');
  });

  it('subject should be capitilized when config property "upperCaseSubject" is set to true', () => {
    config = {
      upperCaseSubject: true,
    };

    expect(getQuestion(6).filter('some subject')).toEqual('Some subject');
  });

  describe('optional fixOverride and allowBreakingChanges', () => {
    it('should restrict BREAKING CHANGE question when config property "allowBreakingChanges" specifies array of types', () => {
      config = {
        types: [{ value: 'feat', name: 'feat: my feat' }],
        scopes: [{ name: 'myScope' }],
        allowBreakingChanges: ['fix'],
      };
      expect(getQuestion(8).name).toEqual('breaking');

      const answers = {
        type: 'feat',
      };
      expect(getQuestion(8).when(answers)).toEqual(false); // not allowed
    });

    it('should allow BREAKING CHANGE question when config property "allowBreakingChanges" specifies array of types and answer is one of those', () => {
      config = {
        types: [{ value: 'feat', name: 'feat: my feat' }],
        scopes: [{ name: 'myScope' }],
        allowBreakingChanges: ['fix', 'feat'],
      };
      expect(getQuestion(8).name).toEqual('breaking');

      const answers = {
        type: 'feat',
      };

      expect(getQuestion(8).when(answers)).toEqual(true); // allowed
    });
  });

  describe('Optional scopes', () => {
    it('should use scope override', () => {
      config = {
        types: [{ value: 'feat', name: 'feat: my feat' }],
        scopeOverrides: {
          feat: [{ name: 'myScope' }],
        },
      };

      // question 3 with
      expect(getQuestion(3).name).toEqual('scope');
      expect(getQuestion(3).choices({})[0]).toBeUndefined();
      expect(getQuestion(3).choices({ type: 'feat' })[0]).toEqual({
        name: 'myScope',
      }); // should override scope
      expect(getQuestion(3).when({ type: 'feat' })).toEqual(true);

      const answers = { type: 'fix' };
      expect(getQuestion(3).when(answers)).toEqual(false);
      expect(answers.scope).toEqual('custom');

      config.allowEmptyScopes = true;
      expect(getQuestion(3).when(answers)).toEqual(false);
      expect(answers.scope).toEqual(false);
      answers.scope = null;

      config.allowEmptyScopes = true;
      config.allowCustomScopes = true;
      expect(getQuestion(3).when(answers)).toEqual(true);
      expect(answers.scope).toEqual(null);
    });
  });

  describe('no TicketNumber question', () => {
    it('should use scope override', () => {
      config = {
        types: [{ value: 'feat', name: 'feat: my feat' }],
        allowTicketNumber: false,
      };

      expect(getQuestion(5).name).toEqual('ticketNumbers');
      expect(getQuestion(5).when()).toEqual(false);
    });
  });

  describe('ask for breaking change first', () => {
    it('when config askForBreakingChangeFirst is true', () => {
      config = {
        types: [{ value: 'feat', name: 'feat: my feat' }],
        askForBreakingChangeFirst: true,
      };

      expect(getQuestion(1).name).toEqual('breaking');
      expect(getQuestion(1).when()).toEqual(true);
    });
  });

  describe('TicketNumbers', () => {
    it('disable TicketNumber question', () => {
      config = {
        types: [{ value: 'feat', name: 'feat: my feat' }],
        allowTicketNumber: false,
      };

      expect(getQuestion(5).name).toEqual('ticketNumbers');
      expect(getQuestion(5).when()).toEqual(false);
    });

    it('custom message defined', () => {
      config = {
        types: [{ value: 'feat', name: 'feat: my feat' }],
        allowTicketNumber: true,
        messages: {
          ticketNumbers: 'ticket number',
        },
        isTicketNumberRequired: ['feat'],
      };

      expect(getQuestion(5).name).toEqual('ticketNumbers');
      expect(getQuestion(5).message({ type: 'feat' })).toContain('ticket number');
      expect(getQuestion(5).message({ type: 'feat' })).toMatch(
        new RegExp(/^.*\(Ticket number is required with type.*feat.*.*\).*/, 'm')
      );
    });

    describe('validation', () => {
      it('invalid because empty and required', () => {
        config = {
          isTicketNumberRequired: true,
        };
        expect(getQuestion(5).validate([], {})).toEqual('You must specify at least one ticket.');
      });
      it('invalid because empty and required with array', () => {
        config = {
          isTicketNumberRequired: ['feat'],
        };
        expect(getQuestion(5).validate([], { type: 'feat' })).toContain('You must specify at least one ticket.');
      });
      it('empty but valid because optional', () => {
        config = {
          isTicketNumberRequired: false,
        };
        expect(getQuestion(5).validate([], {})).toEqual(true);
      });
      it('empty but valid because not in required array', () => {
        config = {
          isTicketNumberRequired: ['feat'],
        };
        expect(getQuestion(5).validate([], { type: 'fix' })).toEqual(true);
      });
      it('valid because there is no regexp defined', () => {
        config = {
          isTicketNumberRequired: true,
          ticketNumberRegExp: undefined,
        };
        expect(getQuestion(5).validate(['21234'], {})).toEqual(true);
      });
      it("invalid because regexp don't match", () => {
        config = {
          isTicketNumberRequired: true,
          ticketNumberRegExp: '\\d{1,5}',
        };
        expect(getQuestion(5).validate(['sddsa'], {})).toContain('Tickets do not match format');
      });
      it('valid because regexp match', () => {
        config = {
          isTicketNumberRequired: true,
          ticketNumberRegExp: '\\d{1,5}',
        };
        expect(getQuestion(5).validate(['12345'], {})).toEqual(true);
      });
    });
  });
});
