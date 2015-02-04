var express = require('express'),
	nconf = require('nconf'),
	path = require('path'),
	app = express(),
	uuid = require('node-uuid'),
	repo = require('./repository.js')(),
	schema = require('./schema.js')(),
	handlers = require('./responseHandlers.js')(),
	listHelper = require('./listHelper.js');

nconf
.argv()
.env()
.file({file: path.join(__dirname, 'config.json')});

app.use(express.compress());
app.use(express.json());
app.use(express.urlencoded());

var port = nconf.get('port');

var parseCleanRequest = function (keys, req) {
	var data = req.body;
	
	keys.forEach(function(key) {
		delete data[key];
	});
	
	return data;
};

app.get('/api/black/:id', function (req, res) {
	repo.black.get(req.route.params.id, handlers.data(res), handlers.repoError(res));
});

app.get('/api/white/:id', function (req, res) {
	repo.white.get(req.route.params.id, handlers.data(res), handlers.repoError(res));
});

app.get('/api/set/:id', function (req, res) {
	repo.cardset.get(req.route.params.id, handlers.data(res), handlers.repoError(res));
});

app.post('/api/login/:token', function (req, res) {
	repo.user.login(req.route.params.token, handlers.data(res, schema.user.insecureKeys), handlers.repoError(res));
});

app.put('/api/login/:token', function (req, res) {
	repo.user.login(req.route.params.token, handlers.data(res, schema.user.insecureKeys), handlers.repoError(res));
});

app.put('/api/:token/game', function (req, res) {
	var game = parseCleanRequest(schema.game.keys, req);
	var error = handlers.repoError(res);
	repo.user.get(req.route.params.token, function (user) {
		game.id = uuid.v4();
		game.createdDate = new Date();
		game.createdBy = user.id;
		game.players = [{
			userId: user.id,
			playerId: uuid.v4()
		}];
		
		var checkFinished = function() {
			if (game.currentBlackCard && game.players[0].cards) {
				handlers.data(res)(game);
			}
		};
		
		repo.game.add(game, function (result) {
			repo.game.get(game.id, function (game) {
				repo.game.decks.black.get(game, 1, function (blackCardId) {
					repo.black.get(blackCardId[0], function(blackCard) {
						game.currentBlackCard = blackCard;
						checkFinished();
					}, error);
				}, error);
				
				repo.game.decks.white.get(game, 10, function (whiteCardIds) {
					var whiteCards = [],
						checkWhiteFinished = function () {
							if (whiteCards.length === whiteCardIds.length ) {
								game.players[0].cards = whiteCards;
								checkFinished();
							}
						},
						getPushWhiteCard = function(whiteCardId) {
							repo.white.get(whiteCardId, function(whiteCard) {
								whiteCards.push(whiteCard);
								checkWhiteFinished();
							}, error);
						};
						
					for (var i=0; i<whiteCardIds.length; i++){
						getPushWhiteCard(whiteCardIds[i]);
					}
				}, error);
			}, error);
		}, error);
	}, error);
});

app.get('/api/:token/game/count/', function (req, res) {
	repo.game.count(handlers.integer(res), handlers.repoError(res));
});

app.get('/api/:token/game/list/take/:take/page/:page', function (req, res) {
	var take = parseInt(req.route.params.take);
	var page = parseInt(req.route.params.page);
	if (!take || take > 100) { take = 100; }
	if (!page || page > 100) { page = 0; }
	repo.game.getAll(listHelper.listWithGets(take, page, undefined, schema.game.sort.byCreatedDate, repo.game.get, function(data) {
		res.send(data);
		res.end();
	}), handlers.repoError(res));
});

app.get('/api/:token/game/:id', function (req, res) {
	repo.game.get(req.route.params.id, handlers.data(res), handlers.repoError(res));
});

app.listen(port);