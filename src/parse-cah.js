var nconf = require('nconf'),
	path = require('path'),
	cahParser = require('./cahParser.js')();

nconf.argv()
.env()
.file({file: path.join(__dirname, 'config.json')});

var filename = path.join(__dirname, nconf.get('content:cahSqlFilename'));

cahParser.parseFile(filename, function(data) {
	console.log(data);
});