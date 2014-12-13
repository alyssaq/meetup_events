# Find Meetup events in your country

Current sample finds tech events (category 34) in Singapore and filters out
certain groups and words listed in the blacklist.

## Setup
1. Install dependencies `npm install`
1. Open `config.js` and add your [meetup API key](https://secure.meetup.com/meetup_api/key/)

## Usage

    MEETUP_API_KEY=<key> node index.js                # send events to stdout or to a file (if `outfile` key exist in config.js)
    MEETUP_API_KEY=<key> node index.js -o foo.json    # save events in foo.json

## Configurations
Sample in `config.js`
The only required configuration is your `meetup API key`.
The remaining configs can be safely deleted if not required.

## Command line arguments

    -o  filename to save the events into

#### meetupParams - object
Query parameters to find groups.
Reponse returns public groups and the next event if available.
URL to the event can be constructed by the event name and the event id.
More filters can be found at: <http://www.meetup.com/meetup_api/docs/2/groups/>
[List of meetup categories](http://www.meetup.com/meetup_api/console/?path=/2/categories)

    meetupParams: {
      key: process.env.MEETUP_API_KEY ||
        '<your_meetup_api_key>',
      country: 'SG',
      category: 34,
      page: 500
    }

#### blacklistGroups - array
Array of group ids to be blacklisted.
Any events from these groups will not be included.

    blacklistGroups: [9319232]

#### blacklistWords - array
Array of words in a group name to be blacklisted.
Group names containing any of these words will not be included.

    blacklistWords: ['business', 'networking']

#### outfile - string
Optional outfile to save the JSON list of events

    outfile: 'events.json'

## Sample output

    [
      {
        "time": "2014-07-16T11:15:00.000Z",
        "id": "193467102",
        "name": "DataScience SG Meetup - HR Analytics",
        "groupName": "DataScience SG",
        "groupUrl": "http://www.meetup.com/DataScience-SG-Singapore/",
        "url": "http://meetup.com/DataScience-SG-Singapore/events/193467102"
      },
      {
        "time": "2014-07-14T10:45:00.000Z",
        "id": "193625622",
        "name": "Technical workshop - Revolution Analytics and Cloudera",
        "groupName": "R User Group - Singapore (RUGS)",
        "groupUrl": "http://www.meetup.com/R-User-Group-SG/",
        "url": "http://meetup.com/R-User-Group-SG/events/193625622"
      }
    ]

## License
[MIT](http://alyssaq.github.io/mit-license/)

