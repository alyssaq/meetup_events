var querystring = require('querystring');
var https = require('https');
var Promise = require('promise');
var jf = require('jsonfile');
var config = require('./config');

var meetupQuery = querystring.stringify(config.meetupParams);

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

  // enfore country filter. Meetup adds JB groups into SG
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
  entry.time = new Date(entry.time).toISOString();
  events.push(entry);
  console.log(entry.group_name + ' -- ' + entry.name + ' - ' + entry.url);
}

function saveToJson(data) {
  if (!config.outfile) return
  jf.writeFile(config.outfile, data, function(err) {
    if (err) console.error(err);
  })
  console.log('JSON file saved at: ' + config.outfile)
}

https_get_json('https://www.meetup.com/muapi/find/groups?' + meetupQuery)
  .then(function(data) {
    events = [];
    data
      .filter(isValidGroup)
      .reduce(saveEvents, events);
    saveToJson(events);
  })
  .catch(function(err) {
    console.error(err);
  })
