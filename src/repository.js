var nconf = require('nconf'),
	path = require('path'),
	redis = require('redis');

nconf.argv()
.env()
.file({file: path.join(__dirname, 'config.json')});

var redisConfig = nconf.get('redis'),
	gameTimeout = nconf.get('game:timeout');

module.exports = function() {
	var redisClient = redis.createClient(redisConfig.port, redisConfig.host),
		getHash = function (type, id, callback, errorCallback) {
			redisClient.hgetall(type + ':' + id, function (err, obj) {
				if (err) {
					console.log(err);
					if (errorCallback) {
						errorCallback(err);
					}
				}
				else {
					if (callback) {
						callback(obj);
					}
				}
			});
		},
		addHash = function (type, id, data, callback, errorCallback) {
			redisClient.HMSET(type + ':' + id, data, function (err, obj) {
				if (err) {
					console.log(err);
					if (errorCallback) {
						errorCallback(err);
					}
				}
				else {
					addSet(type, id);
					if (callback) {
						callback(obj);
					}
				}
			});
		},
		addSet = function (type, id) {
			redisClient.sadd(type + '_set', id);
		}, 
		getSet = function (type, callback, errorCallback) {
			redisClient.smembers(type + '_set', function(err, obj) {
				if (err) {
					console.log(err);
					if (errorCallback) {
						errorCallback(err);
					}
				}
				else {
					if (callback) {
						callback(obj);
					}
				}
			});
		},
		addRelation = function (typeOne, typeTwo, idOne, idTwo) {
			redisClient.sadd(typeTwo + '_by_' + typeOne + ':' + idOne, idTwo);
		},
		getCount = function (type, callback, errorCallback) {
			redisClient.scard(type + '_set', function(err, obj) {
				if (err) {
					console.log(err);
					if (errorCallback) {
						errorCallback(err);
					}
				}
				else {
					if (callback) {
						callback(obj);
					}
				}
			});
		};

	return {
		black : {
			add: function (card, callback, errorCallback) {
				addHash('black_cards', card.id, card, callback, errorCallback);
			},
			get: function (id, callback, errorCallback) {
				getHash('black_cards', id, callback, errorCallback);
			},
			count: function(callback, errorCallback) {
				getCount('game', callback, errorCallback);
			}
		},
		white : {
			add: function (card, callback, errorCallback) {
				addHash('white_cards', card.id, card, callback, errorCallback);
			},
			get: function (id, callback, errorCallback) {
				getHash('white_cards', id, callback, errorCallback);
			},
			count: function(callback, errorCallback) {
				getCount('game', callback, errorCallback);
			}
		},
		cardset: {
			add: function (cardset, callback, errorCallback) {
				addHash('card_set', cardset.id, cardset, callback, errorCallback);
			},
			get: function (id, callback, errorCallback) {
				getHash('card_set', id, callback, errorCallback);
			}
		},
		game: {
			add: function (game, callback, errorCallback) {
				addHash('game', game.id, game, callback, errorCallback);
			},
			get: function (id, callback, errorCallback) {
				getHash('game', id, callback, errorCallback);
			},
			count: function(callback, errorCallback) {
				getCount('game', callback, errorCallback);
			},
			getAll: function (callback, errorCallback) {
				getSet('game', callback, errorCallback);
			}
		},
		relations: {
			cardset: {
				black: {
					add: function(blackCardId, cardSetId) {
						addRelation('card_set', 'black_cards', cardSetId, blackCardId);
						addSet('card_set_black_cards_relation', cardSetId);
					}
				},
				white: {
					add: function(whiteCardId, cardSetId) {
						addRelation('card_set', 'white_cards', cardSetId, whiteCardId);
						addSet('card_set_white_cards_relation', cardSetId);
					}
				}
			}
		},
		dispose: function() {
			redisClient.quit();
		},
		deleteEverything: function() {
			redisClient.flushall();
		}
	};
};