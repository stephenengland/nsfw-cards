var nconf = require('nconf'),
	path = require('path'),
	uuid = require('node-uuid'),
	redis = require('redis');

nconf.argv()
.env()
.file({file: path.join(__dirname, 'config.json')});

var redisConfig = nconf.get('redis'),
	gameTimeout = nconf.get('game:timeout');

module.exports = function() {
	var redisClient = redis.createClient(redisConfig.port, redisConfig.host),
		redisCallbackFactory = function (callback, errorCallback) {
			return function (err, obj) {
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
			};
		},
		getHash = function (type, id, callback, errorCallback) {
			redisClient.hgetall(type + ':' + id, redisCallbackFactory(callback, errorCallback));
		},
		addHash = function (type, id, data, callback, errorCallback) {
			redisClient.HMSET(type + ':' + id, data, redisCallbackFactory(function(obj) {
				addSet(type, id);
				callback();
			}, errorCallback));
		},
		addSet = function (type, id, callback, errorCallback) {
			redisClient.sadd(type + '_set', id, redisCallbackFactory(callback, errorCallback));
		}, 
		getSet = function (type, callback, errorCallback) {
			redisClient.smembers(type + '_set', redisCallbackFactory(callback, errorCallback));
		},
		getSetAllRandom = function (type, callback, errorCallback) {
			redisClient.srandmember(type + '_set', 9999, redisCallbackFactory(callback, errorCallback));
		},
		removeSetMember = function (type, member, callback, errorCallback) {
			redisClient.srem(type + '_set', member, redisCallbackFactory(callback, errorCallback));
		},
		popSet = function (type, callback, errorCallback) {
			redisClient.spop(type + '_set', redisCallbackFactory(callback, errorCallback));
		},
		addRelation = function (typeOne, typeTwo, idOne, idTwo) {
			redisClient.sadd(typeTwo + '_by_' + typeOne + ':' + idOne, idTwo);
		},
		getCount = function (type, callback, errorCallback) {
			redisClient.scard(type + '_set', redisCallbackFactory(callback, errorCallback));
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
			},
			decks: {
				white: {
					get: function (game, cardsToPick, callback, errorCallback) {
						var popCard = function (popCardCallback) {
							popSet('game_white_cards:' + game.id, popCardCallback, errorCallback);
						},
						cards = [],
						shuffle = function(remainingNeeded) {
							getSetAllRandom('white_cards', function(whiteCards) {
								for(var i=0; i<whiteCards.length; i++){
									if (i < remainingNeeded) {
										cards.push(whiteCards[i]);
									}
									else {
										addSet('game_white_cards:' + game.id, whiteCards[i], undefined, errorCallback);
									}
								}
								
								callback(cards);
							}, errorCallback);
						},
						i = 0,
						handleCard = function (card) {
							if (!card) {
								var remainingNeeded = cardsToPick - i;
								
								shuffle(remainingNeeded);
								
								i = cardsToPick;//Break out
							}
							else {
								cards.push(card);
								if (i === (cardsToPick - 1)) {
									callback(cards);
								}
							}
						};
						
						while(i < cardsToPick) {
							popCard(handleCard);
							i++;
						}
					}
				},
				black: {
					get: function (game, cardsToPick, callback, errorCallback) {
						var popCard = function (popCardCallback) {
							popSet('game_black_cards:' + game.id, popCardCallback, errorCallback);
						},
						cards = [],
						shuffle = function(remainingNeeded) {
							getSetAllRandom('black_cards', function(blackCards) {
								for(var i=0; i<blackCards.length; i++){
									if (i < remainingNeeded) {
										cards.push(blackCards[i]);
									}
									else {
										addSet('game_white_cards:' + game.id, blackCards[i], undefined, errorCallback);
									}
								}
								
								callback(cards);
							}, errorCallback);
						},
						i = 0,
						handleCard = function (card) {
							if (!card) {
								var remainingNeeded = cardsToPick - i;
								
								shuffle(remainingNeeded);
								
								i = cardsToPick;//Break out
							}
							else {
								cards.push(card);
								if (i === (cardsToPick - 1)) {
									callback(cards);
								}
							}
						};
						
						while(i < cardsToPick) {
							popCard(handleCard);
							i++;
						}
					}
				}
			}
		},
		user: {
			login: function (loginToken, callback, errorCallback) {
				getHash('user', loginToken, function (user) {
					if (!user) {
						user = {
							loginToken: loginToken,
							apiToken: uuid.v4(),
							id: uuid.v4()
						};
					}
					
					user.lastLogin = new Date();
					addHash('user', user.apiToken, user, function() {
						getHash('user', user.apiToken, callback, errorCallback);
					}, errorCallback);
				}, errorCallback);
			},
			get: function (apiToken, callback, errorCallback) {
				getHash('user', apiToken, callback, errorCallback);
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