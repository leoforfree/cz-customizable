const buildCommit = require('../buildCommit');

describe('buildCommit()', () => {
  const answers = {
    type: 'feat',
    scope: 'app',
    subject: 'this is a new feature',
  };

  it('subject with default subject separator', () => {
    const options = {};
    expect(buildCommit(answers, options)).toEqual('feat(app): this is a new feature');
  });

  it('subject with custom subject separator option', () => {
    const options = {
      subjectSeparator: ' - ',
    };
    expect(buildCommit(answers, options)).toEqual('feat(app) - this is a new feature');
  });

  it('subject 1 empty character separator', () => {
    const options = {
      subjectSeparator: ' ',
    };
    expect(buildCommit(answers, options)).toEqual('feat(app) this is a new feature');
  });

  describe('without scope', () => {
    it('subject without scope', () => {
      const answersNoScope = {
        type: 'feat',
        subject: 'this is a new feature',
      };
      const options = {};
      expect(buildCommit(answersNoScope, options)).toEqual('feat: this is a new feature');
    });

    it('subject without scope', () => {
      const answersNoScope = {
        type: 'feat',
        subject: 'this is a new feature',
      };
      const options = {
        subjectSeparator: ' - ',
      };
      expect(buildCommit(answersNoScope, options)).toEqual('feat - this is a new feature');
    });
  });

  describe('type prefix and type suffix', () => {
    it('subject with both', () => {
      const answersNoScope = {
        type: 'feat',
        subject: 'this is a new feature',
      };
      const options = {
        typePrefix: '[',
        typeSuffix: ']',
        subjectSeparator: ' ',
      };
      expect(buildCommit(answersNoScope, options)).toEqual('[feat] this is a new feature');
    });
  });

  describe('pipe replaced with new line', () => {
    // I know it looks weird on tests but this proves to have the correct breakline inserted.
    const expecteMessage = `feat: this is a new feature\n
body with new line now
body line2

ISSUES CLOSED: footer with new line
line 2`;

    it('should add breakline for body and footer', () => {
      const answersNoScope = {
        type: 'feat',
        subject: 'this is a new feature',
        body: 'body with new line now|body line2',
        footer: 'footer with new line|line 2',
      };
      const options = {};

      expect(buildCommit(answersNoScope, options)).toEqual(expecteMessage);
    });

    it('should override breakline character with option breaklineChar', () => {
      const answersNoScope = {
        type: 'feat',
        subject: 'this is a new feature',
        body: 'body with new line now@@@body line2',
        footer: 'footer with new line@@@line 2',
      };
      const options = {
        breaklineChar: '@@@',
      };

      expect(buildCommit(answersNoScope, options)).toEqual(expecteMessage);
    });
  });

  describe('wrap only separate line with 100 characters limit', () => {
    // I know it looks weird on tests but this proves to have the correct breakline inserted.
    const expecteMessage = `docs: update docs\n
1. update description
2. add commit message format section
3. add docker section
4. add commit helper tool section`;

    it('should add breakline for body and wrap each line separately', () => {
      const answersNoScope = {
        type: 'docs',
        subject: 'update docs',
        body:
          '1. update description|2. add commit message format section|3. add docker section|4. add commit helper tool section',
      };
      const options = {};

      expect(buildCommit(answersNoScope, options)).toEqual(expecteMessage);
    });

    it('should add breakline for body and wrap each line separately with option breaklineChar', () => {
      const answersNoScope = {
        type: 'docs',
        subject: 'update docs',
        body:
          '1. update description@@@2. add commit message format section@@@3. add docker section@@@4. add commit helper tool section',
      };
      const options = {
        breaklineChar: '@@@',
      };

      expect(buildCommit(answersNoScope, options)).toEqual(expecteMessage);
    });
  });
});
