
describe('cz-customizable', function(){

  var module, cz, commit;

  var rewire = require('rewire');
  beforeEach(function(){
    module = rewire('../index.js');

    module.__set__({
      console: {
        info: function(){}
      },
      'config': {
        types: [{value: 'feat', name: 'feat: my feat'}],
        scopes: [{name: 'myScope'}],
        scopeOverrides: {
          fix: [{name: 'fixOverride'}]
        }
      }

    });

    cz = {prompt: jasmine.createSpy()};
    commit = jasmine.createSpy();
  });


  it("should test pass", function() {
    expect(1).toEqual(1);
    module.prompter(cz, commit);
    expect(cz.prompt).toHaveBeenCalled();
  });

  it("should call cz.prompt with questions ", function() {
    module.prompter(cz, commit);

    var getQuestion = function(number) {
      return cz.prompt.mostRecentCall.args[0][number - 1];
    }

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
    expect(getQuestion(3).name).toEqual('subject');
    expect(getQuestion(3).type).toEqual('input');
    expect(getQuestion(3).message).toMatch(/IMPERATIVE tense description/);
    expect(getQuestion(3).validate()).toEqual(false); //mandatory question

    //question 4
    expect(getQuestion(4).name).toEqual('body');
    expect(getQuestion(4).type).toEqual('input');

    //question 5
    expect(getQuestion(5).name).toEqual('footer');
    expect(getQuestion(5).type).toEqual('input');
    expect(getQuestion(5).when({type: 'fix'})).toEqual(true);
    expect(getQuestion(5).when({type: 'WIP'})).toEqual(false);

    //question 6, last one
    expect(getQuestion(6).name).toEqual('confirmCommit');
    expect(getQuestion(6).type).toEqual('confirm');


    var answers = {
      confirmCommit: true,
      type: 'feat',
      scope: 'myScope',
      subject: 'create a new cool feature'
    };
    expect(getQuestion(6).message(answers)).toMatch('Are you sure');
  });

  it("should call not call commit() function if there is no final confirmation", function() {
    module.prompter(cz, commit);
    var commitAnswers = cz.prompt.mostRecentCall.args[1];
    var res = commitAnswers({});

    expect(res).toEqual(undefined);
    expect(commit).not.toHaveBeenCalled();
  });

  it("should call commit() function with commit message when user confirms commit", function() {
    module.prompter(cz, commit);
    var commitAnswers = cz.prompt.mostRecentCall.args[1];

    var answers = {
      confirmCommit: true,
      type: 'feat',
      scope: 'myScope',
      subject: 'create a new cool feature',
      body: '-line1|-line2',
      footer: 'my footer'
    };

    commitAnswers(answers);
    expect(commit).toHaveBeenCalledWith('feat(myScope): create a new cool feature\n\n-line1\n-line2\n\nmy footer');
  });

  it("should call commit() function with commit message with the minimal required fields", function() {
    module.prompter(cz, commit);
    var commitAnswers = cz.prompt.mostRecentCall.args[1];

    var answers = {
      confirmCommit: true,
      type: 'feat',
      scope: 'myScope',
      subject: 'create a new cool feature'
    };

    commitAnswers(answers);
    expect(commit).toHaveBeenCalledWith('feat(myScope): create a new cool feature');
  });

  it("should suppress scope when commit type is WIP", function() {
    module.prompter(cz, commit);
    var commitAnswers = cz.prompt.mostRecentCall.args[1];

    var answers = {
      confirmCommit: true,
      type: 'WIP',
      // scope: 'myScope',
      subject: 'this is my worl-in-progress'
    };

    commitAnswers(answers);
    expect(commit).toHaveBeenCalledWith('WIP: this is my worl-in-progress');
  });

  it("should truncate first line if number of characters is higher than 200", function() {
    module.prompter(cz, commit);
    var commitAnswers = cz.prompt.mostRecentCall.args[1];

    var chars_100 = '0123456789-0123456789-0123456789-0123456789-0123456789-0123456789-0123456789-0123456789-0123456789-0123456789';

    var answers = {
      confirmCommit: true,
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

});
