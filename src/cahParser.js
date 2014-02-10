var lazy = require("lazy"),
	fs = require("fs"),
	path = require('path'),
	nconf = require('nconf'),
	currentType,
	stopUntilNextType = false;

nconf.argv()
.env()
.file({file: path.join(__dirname, 'config.json')});

var defaultFilename = path.join(__dirname, nconf.get('content:cahSqlFilename'));

function getCurrentType (line) {
	var nextType = 'black_cards';
	if (currentType) {
		switch (currentType) {
			case 'black_cards':  nextType = 'card_set'; break;
			case 'card_set': nextType = 'card_set_black_card'; break;
			case 'card_set_black_card': nextType = 'card_set_white_card'; break;
			case 'card_set_white_card': nextType = 'white_cards'; break;
		}
	}
	
	if (currentType != 'white_cards' && line.indexOf('COPY ' + nextType) === 0) {
		currentType = nextType;
		stopUntilNextType = false;
		//Return undefined so we don't parse this line
		return undefined;
	}
	else if (stopUntilNextType || line.indexOf('\\.') === 0) {
		stopUntilNextType = true;
		return undefined;
	}
	
	return currentType;
}

//Hash
function parseBlackCard (splitLine) {
	return {
		id: splitLine[0],
		text: splitLine[1],
		draw: splitLine[2],
		pick: splitLine[3],
		watermark: splitLine[4],
		'type': 'black_cards'
	};
}

//Hash
function parseCardSet (splitLine) {
	return {
		id: splitLine[0],
		active: splitLine[1],
		'base-deck': splitLine[2],
		description: splitLine[3],
		weight: splitLine[4],
		'type': 'card_set'
	};
}

//Sets for BlackCardIdsByCardSetId
function parseCardSetBlackCard (splitLine) {
	return {
		'card-set-id': splitLine[0],
		'black-card-id': splitLine[1],
		'type': 'card_set_black_card'
	};
}

//Sets for WhiteCardIdsByCardSetId
function parseCardSetWhiteCard (splitLine) {
	return {
		'card-set-id': splitLine[0],
		'white-card-id': splitLine[1],
		'type': 'card_set_white_card'
	};
}

//Hash
function parseWhiteCards (splitLine) {
	return {
		'id': splitLine[0],
		'text': splitLine[1],
		watermark: splitLine[2],
		'type': 'white_cards'
	};
}

module.exports = function () {
	return {
		parseFile: function(filename, callback, onEnd) {
			if (!filename) {
				filename = defaultFilename;
			}
			
			new lazy(fs.createReadStream(filename))
				.lines
				.forEach(function(line) {
					var stringLine = line.toString(),
						currentType = getCurrentType(stringLine);
					
					if (currentType) {
						var splitLine = stringLine.replace('\r', '').split('\t');
						switch (currentType) {
							case 'black_cards':  callback(parseBlackCard(splitLine)); break;
							case 'card_set': callback(parseCardSet(splitLine)); break;
							case 'card_set_black_card': callback(parseCardSetBlackCard(splitLine)); break;
							case 'card_set_white_card': callback(parseCardSetWhiteCard(splitLine)); break;
							case 'white_cards': callback(parseWhiteCards(splitLine)); break;
						}
					}
				})
				.on('pipe', onEnd);
		}
	};
};