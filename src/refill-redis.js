var nconf = require('nconf'),
	path = require('path'),
	redis = require('redis'),
	cahParser = require('./cahParser.js')();

nconf.argv()
.env()
.file({file: path.join(__dirname, 'config.json')});

var redisConfig = nconf.get('redis'),
	redisClient = redis.createClient(redisConfig.port, redisConfig.host);

redisClient.flushall();

cahParser.parseFile(null, function (data) {
	switch (data.type) {
		case 'black_cards':
		case 'white_cards':
		case 'card_set':
			var key = data.type + data.id;
			delete data.type;
			redisClient.HMSET(key, data);
		break;
		case 'card_set_black_card':
			redisClient.sadd('black_cards_by_card_set:' + data['card-set-id'], data['black-card-id']);
		break;
		case 'card_set_white_card':
			redisClient.sadd('white_cards_by_card_set:' + data['card-set-id'], data['white-card-id']);
		break;
	}
}, function(){
	redisClient.quit();
});