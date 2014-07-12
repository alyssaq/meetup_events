var querystring = require('querystring');
var https = require('https');
var Promise = require('promise');
var jf = require('jsonfile');
var moment = require('moment');
var config = require('./config');

function https_get_json(url) {
 return new Promise(function (resolve, reject) {
    https.get(url, function (res) {
      var buffer = [];
      res.on('data', Array.prototype.push.bind(buffer));
      res.on('end', function () {
        var text = buffer.join('');
        var json = JSON.parse(text);
        if (res.statusCode < 400) {
          resolve(json);
        } else {
          console.error('Err! HTTP status code:', res.statusCode, url);
          reject(Error(text));
        }
      });
    }).on('error', function (err) {
      console.error('Err! HTTP request failed:', err.message, url);
      reject(err);
    });
  });
}

function isValidGroup(row) {
  var blacklistGroups = config.blacklistGroups || [];
  var blacklistWords = config.blacklistWords || [];
  var blacklistRE = new RegExp(blacklistWords.join('|'), 'i');

  // Enforce country filter. Meetup adds JB groups into SG
  return blacklistWords.length === 0 ? true : !row.name.match(blacklistRE) &&
         !blacklistGroups.some(function(id) { return row.id === id })
         && row.country === (config.meetupParams.country || row.country);
}

function saveEvents(arr, row) {
  if (!(row.next_event && row.next_event.time)) return

  var entry = row.next_event;
  entry.group_name = row.name;
  entry.group_url = row.link;
  entry.url = 'http://meetup.com/' + row.urlname + '/events/' + entry.id;
  entry.formatted_time = moment(new Date(entry.time)).format('DD MMM, ddd, h:mm a');
  events.push(entry);
  //console.log(entry.group_name + ' -- ' + entry.name + ' - ' + entry.url);
}

function saveToJson(data) {
  if (!config.outfile) return
  jf.writeFile(config.outfile, data, function(err) {
    if (err) console.error(err);
  })
  console.log('JSON file saved at: ' + config.outfile)
}

function getAllMeetupEvents() { //regardless of venue
  var url = 'https://www.meetup.com/muapi/find/groups?' +
    querystring.stringify(config.meetupParams);
  return https_get_json(url).then(function(data) {
    events = [];
    data
      .filter(isValidGroup)
      .reduce(saveEvents, events);
    return events;
  });
}

function getMeetupEvents() { //events with venues
  return getAllMeetupEvents().then(function(events) {
    var venues = events.map(function(event) {
      return https_get_json('https://api.meetup.com/2/event/' + event.id + '?only=venue&key=' + config.meetupParams.key);
    });

    return Promise.all(venues).then(function(venues) {
      var eventsWithVenues = events.filter(function(event, i) {
        return venues[i].hasOwnProperty('venue');
      });
      saveToJson(eventsWithVenues);
      return eventsWithVenues;
    });
  });
}

module.exports = {
  getAllMeetupEvents: getAllMeetupEvents,
  getMeetupEvents: getMeetupEvents
}

getMeetupEvents();
