var express = require('express'),
	nconf = require('nconf'),
	path = require('path'),
	app = express(),
	uuid = require('node-uuid'),
	repo = require('./repository.js')(),
	schema = require('./schema.js')(),
	handlers = require('./responseHandlers.js')();

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

app.put('/api/game', function (req, res) {
	var game = parseCleanRequest(schema.game.keys, req);
	game.id = uuid.v4();
	game.createdDate = new Date();
	repo.game.add(game, function (result) {
		repo.game.get(game.id, handlers.data(res), handlers.repoError(res));
	}, handlers.repoError(res));
});

app.get('/api/game/count/', function (req, res) {
	repo.game.count(handlers.integer(res), handlers.repoError(res));
});

app.get('/api/game/list/take/:take/page/:page', function (req, res) {
	var take = parseInt(req.route.params.take);
	var page = parseInt(req.route.params.page);
	if (!take || take > 100) { take = 100; }
	if (!page || page > 100) { page = 0; }
	repo.game.getAll(
		handlers.listWithGets(res, take, page, undefined, schema.game.sort.byCreatedDate, repo.game.get),
		handlers.repoError(res)
	);
});

app.get('/api/game/:id', function (req, res) {
	repo.game.get(req.route.params.id, handlers.data(res), handlers.repoError(res));
});

app.listen(port);