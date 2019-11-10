const rewire = require('rewire');

describe('cz-customizable', () => {
  let module;
  // let cz;
  let commit;

  beforeEach(() => {
    module = rewire('../index.js');

    // eslint-disable-next-line no-underscore-dangle
    module.__set__({
      log: {
        info() {},
      },

      readConfigFile() {
        return {
          types: [{ value: 'feat', name: 'feat: my feat' }],
          scopes: [{ name: 'myScope' }],
          scopeOverrides: {
            fix: [{ name: 'fixOverride' }],
          },
          allowCustomScopes: true,
          allowBreakingChanges: ['feat'],
        };
      },
    });

    // cz = jasmine.createSpyObj('cz', ['prompt', 'Separator']);
    commit = jasmine.createSpy();
  });

  function getMockedCz(answers) {
    return {
      prompt() {
        return {
          then(cb) {
            cb(answers);
          },
        };
      },
    };
  }

  it('should commit without confirmation', () => {
    const answers = {
      confirmCommit: 'yes',
      type: 'feat',
      subject: 'do it all',
    };

    const mockCz = getMockedCz(answers);

    // run commitizen plugin
    module.prompter(mockCz, commit);

    expect(commit).toHaveBeenCalledWith('feat: do it all');
  });

  it('should escape special characters sush as backticks', () => {
    const answers = {
      confirmCommit: 'yes',
      type: 'feat',
      subject: 'with backticks `here`',
    };

    const mockCz = getMockedCz(answers);
    module.prompter(mockCz, commit);

    expect(commit).toHaveBeenCalledWith('feat: with backticks \\`here\\`');
  });

  it('should not call commit() function if there is no final confirmation and display log message saying commit has been canceled', () => {
    const mockCz = getMockedCz({});

    // run commitizen plugin
    module.prompter(mockCz, commit);

    expect(commit).not.toHaveBeenCalled();
  });

  it('should call commit() function with commit message when user confirms commit and split body when pipes are present', () => {
    const answers = {
      confirmCommit: 'yes',
      type: 'feat',
      scope: 'myScope',
      subject: 'create a new cool feature',
      body: '-line1|-line2',
      breaking: 'breaking',
      footer: 'my footer',
    };

    const mockCz = getMockedCz(answers);
    module.prompter(mockCz, commit);

    expect(commit).toHaveBeenCalledWith(
      'feat(myScope): create a new cool feature\n\n-line1\n-line2\n\nBREAKING CHANGE:\nbreaking\n\nISSUES CLOSED: my footer'
    );
  });

  it('should call commit() function with commit message with the minimal required fields', () => {
    const answers = {
      confirmCommit: 'yes',
      type: 'feat',
      scope: 'myScope',
      subject: 'create a new cool feature',
    };

    const mockCz = getMockedCz(answers);
    module.prompter(mockCz, commit);
    expect(commit).toHaveBeenCalledWith('feat(myScope): create a new cool feature');
  });

  it('should suppress scope when commit type is WIP', () => {
    const answers = {
      confirmCommit: 'yes',
      type: 'WIP',
      subject: 'this is my work-in-progress',
    };

    const mockCz = getMockedCz(answers);
    module.prompter(mockCz, commit);
    expect(commit).toHaveBeenCalledWith('WIP: this is my work-in-progress');
  });

  it('should allow edit message before commit', done => {
    process.env.EDITOR = 'true';

    const answers = {
      confirmCommit: 'edit',
      type: 'feat',
      subject: 'create a new cool feature',
    };

    const mockCz = getMockedCz(answers);
    module.prompter(mockCz, commit);

    setTimeout(() => {
      expect(commit).toHaveBeenCalledWith('feat: create a new cool feature');
      done();
    }, 100);
  });

  it('should not commit if editor returned non-zero value', done => {
    process.env.EDITOR = 'false';

    const answers = {
      confirmCommit: 'edit',
      type: 'feat',
      subject: 'create a new cool feature',
    };

    const mockCz = getMockedCz(answers);
    module.prompter(mockCz, commit);

    setTimeout(() => {
      expect(commit.wasCalled).toEqual(false);
      done();
    }, 100);
  });

  it('should truncate first line if number of characters is higher than 200', () => {
    const chars100 =
      '0123456789-0123456789-0123456789-0123456789-0123456789-0123456789-0123456789-0123456789-0123456789-0123456789';

    // this string will be prepend: "ISSUES CLOSED: " = 15 chars
    const footerChars100 =
      '0123456789-0123456789-0123456789-0123456789-0123456789-0123456789-0123456789-0123456789-012345';

    const answers = {
      confirmCommit: 'yes',
      type: 'feat',
      scope: 'myScope',
      subject: chars100,
      body: `${chars100} body-second-line`,
      footer: `${footerChars100} footer-second-line`,
    };

    const mockCz = getMockedCz(answers);
    module.prompter(mockCz, commit);

    const firstPart = 'feat(myScope): ';

    const firstLine = commit.mostRecentCall.args[0].split('\n\n')[0];
    expect(firstLine).toEqual(firstPart + answers.subject.slice(0, 100 - firstPart.length));

    // it should wrap body
    const body = commit.mostRecentCall.args[0].split('\n\n')[1];
    expect(body).toEqual(`${chars100}\nbody-second-line`);

    // it should wrap footer
    const footer = commit.mostRecentCall.args[0].split('\n\n')[2];
    expect(footer).toEqual(`ISSUES CLOSED: ${footerChars100}\nfooter-second-line`);
  });

  it('should call commit() function with custom breaking prefix', () => {
    const answers = {
      confirmCommit: 'yes',
      type: 'feat',
      scope: 'myScope',
      subject: 'create a new cool feature',
      breaking: 'breaking',
      footer: 'my footer',
    };

    // eslint-disable-next-line no-underscore-dangle
    module.__set__({
      log: {
        info() {},
      },

      readConfigFile() {
        return {
          types: [{ value: 'feat', name: 'feat: my feat' }],
          scopes: [{ name: 'myScope' }],
          scopeOverrides: {
            fix: [{ name: 'fixOverride' }],
          },
          allowCustomScopes: true,
          allowBreakingChanges: ['feat'],
          breakingPrefix: 'WARNING:',
        };
      },
    });

    const mockCz = getMockedCz(answers);
    module.prompter(mockCz, commit);

    expect(commit).toHaveBeenCalledWith(
      'feat(myScope): create a new cool feature\n\nWARNING:\nbreaking\n\nISSUES CLOSED: my footer'
    );
  });

  it('should call commit() function with custom footer prefix', () => {
    const answers = {
      confirmCommit: 'yes',
      type: 'feat',
      scope: 'myScope',
      subject: 'create a new cool feature',
      breaking: 'breaking',
      footer: 'my footer',
    };

    // eslint-disable-next-line no-underscore-dangle
    module.__set__({
      log: {
        info() {},
      },

      readConfigFile() {
        return {
          types: [{ value: 'feat', name: 'feat: my feat' }],
          scopes: [{ name: 'myScope' }],
          scopeOverrides: {
            fix: [{ name: 'fixOverride' }],
          },
          allowCustomScopes: true,
          allowBreakingChanges: ['feat'],
          footerPrefix: 'FIXES:',
        };
      },
    });

    const mockCz = getMockedCz(answers);
    module.prompter(mockCz, commit);

    expect(commit).toHaveBeenCalledWith(
      'feat(myScope): create a new cool feature\n\nBREAKING CHANGE:\nbreaking\n\nFIXES: my footer'
    );
  });

  it('should call commit() function with custom footer prefix set to empty string', () => {
    const answers = {
      confirmCommit: 'yes',
      type: 'feat',
      scope: 'myScope',
      subject: 'create a new cool feature',
      breaking: 'breaking',
      footer: 'my footer',
    };

    // eslint-disable-next-line no-underscore-dangle
    module.__set__({
      log: {
        info() {},
      },

      readConfigFile() {
        return {
          types: [{ value: 'feat', name: 'feat: my feat' }],
          scopes: [{ name: 'myScope' }],
          scopeOverrides: {
            fix: [{ name: 'fixOverride' }],
          },
          allowCustomScopes: true,
          allowBreakingChanges: ['feat'],
          footerPrefix: '',
        };
      },
    });

    const mockCz = getMockedCz(answers);
    module.prompter(mockCz, commit);

    expect(commit).toHaveBeenCalledWith(
      'feat(myScope): create a new cool feature\n\nBREAKING CHANGE:\nbreaking\n\nmy footer'
    );
  });

  it('should call commit() function with ticket number', () => {
    const answers = {
      confirmCommit: 'yes',
      type: 'feat',
      scope: 'myScope',
      subject: 'create a new cool feature',
      ticketNumber: 'TICKET-1234',
    };

    const mockCz = getMockedCz(answers);
    module.prompter(mockCz, commit);
    expect(commit).toHaveBeenCalledWith('feat(myScope): TICKET-1234 create a new cool feature');
  });

  it('should call commit() function with ticket number and prefix', () => {
    // eslint-disable-next-line no-underscore-dangle
    module.__set__({
      log: {
        info() {},
      },

      readConfigFile() {
        return {
          types: [{ value: 'feat', name: 'feat: my feat' }],
          scopes: [{ name: 'myScope' }],
          scopeOverrides: {
            fix: [{ name: 'fixOverride' }],
          },
          allowCustomScopes: true,
          allowBreakingChanges: ['feat'],
          breakingPrefix: 'WARNING:',
          ticketNumberPrefix: 'TICKET-',
        };
      },
    });

    const answers = {
      confirmCommit: 'yes',
      type: 'feat',
      scope: 'myScope',
      subject: 'create a new cool feature',
      ticketNumber: '1234',
    };

    const mockCz = getMockedCz(answers);
    module.prompter(mockCz, commit);
    expect(commit).toHaveBeenCalledWith('feat(myScope): TICKET-1234 create a new cool feature');
  });
});
