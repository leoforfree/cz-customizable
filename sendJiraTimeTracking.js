/* eslint-disable prefer-destructuring */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-continue */
const axios = require('axios');

module.exports = {
  applyTimeTracking(answers, config) {
    const tickets = Object.keys(answers).filter(k => k.includes(config.ticketNumberPrefix));

    for (const ticket of tickets) {
      let hours = answers[ticket].substr(0, answers[ticket].indexOf('h'));
      if (hours === '') hours = 0;
      let minutes = answers[ticket].substr(0, answers[ticket].indexOf('m'));
      if (minutes === '') {
        minutes = answers[ticket].split('h')[1];
        if (!minutes) minutes = 0;
      }
      const timeInSeconds = (+hours * 60 + +minutes) * 60;
      if (!timeInSeconds) continue;
      axios.post(
        `https://${config.jiraDomain}/rest/api/3/issue/${ticket}/worklog`,
        {
          timeSpentSeconds: timeInSeconds,
          started: `${new Date()
            .toJSON()
            .split('Z')
            .join('')}+0000`,
        },
        {
          headers: {
            Authorization: `Basic ${config.jiraToken}`,
          },
        }
      );
    }
  },
};
