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

  describe('with clubhouse', () => {
    it('link clubhouse stories to commit with no verb', () => {
      const options = {
        isClubhouseIDRequired: true,
      };
      const clubhouseAnswers = {
        type: 'feat',
        subject: 'subject',
        clubhouseStoryID: '989, 123',
        clubhouseAddVerb: true,
      };

      expect(buildCommit(clubhouseAnswers, options)).toEqual('feat: subject\n\nClubhouse Stories:\n[ch123]\n[ch989]');
    });

    it('link clubhouse stories to commit with verb', () => {
      const options = {
        isClubhouseIDRequired: true,
      };
      const clubhouseAnswers = {
        type: 'feat',
        subject: 'subject',
        clubhouseStoryID: '989, 123',
        clubhouseAddVerb: true,
        clubhouseVerb: 'start',
      };

      expect(buildCommit(clubhouseAnswers, options)).toEqual(
        'feat: subject\n\nClubhouse Stories:\n[start ch123]\n[start ch989]'
      );
    });

    it('link clubhouse stories to the current branch', () => {
      const options = {
        isClubhouseIDRequired: true,
      };
      const clubhouseAnswers = {
        type: 'feat',
        subject: 'subject',
        clubhouseStoryID: '989, 123',
        clubhouseLinkBranch: true,
      };

      expect(buildCommit(clubhouseAnswers, options)).toEqual(
        'feat: subject\n\nClubhouse Stories:\n[branch ch123]\n[branch ch989]'
      );
    });
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
});
