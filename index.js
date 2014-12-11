var querystring = require('querystring');
var https = require('https');
var Promise = require('promise');
var jf = require('jsonfile');
var moment = require('moment');
var argv = require('minimist')(process.argv.slice(2));
var config = require('./config');
var events = []; // for storing all the meetup events


// private

function requestJson(url) {
  if(argv['v']) {
    console.log('Getting data from ' + url);
  };

  return new Promise(function (resolve, reject) {
    https.get(url, function (res) {
      var buffer = [];
      res.on('data', Array.prototype.push.bind(buffer));
      res.on('end', function () {
        var text = buffer.join('');
        var json = JSON.parse(text);

        if (res.statusCode < 400) {
          resolve(json);
        } else if (res.statusCode === 404) {
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

  return blacklistWords.length === 0 ? true : !row.name.match(blacklistRE) &&
         !blacklistGroups.some(function(id) { return row.id === id }) &&
         row.country === (config.meetupParams.country || row.country);
}

function addEvent(event) {
  if (!(event.next_event && event.next_event.time)) return

  var entry = event.next_event;
  entry.group_name = event.name;
  entry.group_url = event.link;
  entry.url = 'http://meetup.com/' + event.urlname + '/events/' + entry.id;
  entry.formatted_time = moment.utc(entry.time + entry.utc_offset).format('DD MMM, ddd, h:mm a');
  events.push(entry);
  //console.log(entry.group_name + ' -- ' + entry.name + ' - ' + entry.url);
}

function saveToJson(data) {
  var outputFile = argv['o'] || config.outfile;

  if (outputFile) {
    jf.writeFile(outputFile, data, function(err) {
      if (err) console.error(err);
    })

    if(argv['v']) {
      console.log('JSON file saved at: ' + outputFile)
    };
  } else {
    process.stdout.write(JSON.stringify(data));
  }
}

function waitAllPromises(arr) {
  if (arr.length === 0) return resolve([]);

  return new Promise(function (resolve, reject) {
    var numResolved = 0;
    function save(i, val) {
      arr[i] = val
      if (++numResolved === arr.length) {
        resolve(arr);
      }
    }

    arr.forEach(function(item, i) {
      item.then(function(val) {
        save(i, val);
      }).catch(function(err) {
        save(i, {'error': err}); // resolve errors
      });
    });
  });
}

// public

function getAllMeetupEvents() { //regardless of venue
  var url = 'https://api.meetup.com/2/groups?' +
    querystring.stringify(config.meetupParams);

  return requestJson(url).then(function(data) {
    if(argv['v']) {
      console.log('Fetched ' + data.results.length + ' rows');
    };

    data.results.filter(isValidGroup).forEach(addEvent);
    return events;
  }).catch(function(err) {
    console.error('Error getAllMeetupEvents():' + err);
  });
}

function getMeetupEvents() { //events with venues
  return getAllMeetupEvents().then(function(events) {
    if(argv['v']) {
      console.log('Fetched ' + events.length + ' events');
    };

    var venues = events.map(function(event) {
      return requestJson('https://api.meetup.com/2/event/'
        + event.id
        + '?fields=venue_visibility&key='
        + config.meetupParams.key);
    });

    return waitAllPromises(venues).then(function(venues) {
      var eventsWithVenues = events.filter(function(evt, i) {
        return venues[i].hasOwnProperty('venue') ||
          venues[i].venue_visibility === 'members';
      });

      if(argv['v']) {
        console.log(eventsWithVenues.length + ' events with venues');
      };

      saveToJson(eventsWithVenues);
      return eventsWithVenues;
    }).catch(function(err) {
      console.error('Error getMeetupEvents(): ' + err);
    });
  });
}

getMeetupEvents();

module.exports = {
  getAllMeetupEvents: getAllMeetupEvents,
  getMeetupEvents: getMeetupEvents
}
