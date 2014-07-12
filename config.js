module.exports = {
  meetupParams: {
    key: process.env.MEETUP_API_KEY ||
      '<your_meetup_api_key>',
    country: 'SG',
    category: 34,
    page: 500
  },

  blacklistGroups: [9319232],
  blacklistWords: ['business', 'networking'],

  outfile: 'events.json'
};