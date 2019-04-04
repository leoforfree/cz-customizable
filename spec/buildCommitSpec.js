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
});
