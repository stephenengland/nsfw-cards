var express = require('express'),
	nconf = require('nconf'),
	path = require('path'),
	app = express(),
	uuid = require('node-uuid'),
	repo = require('./repository.js')(),
	schema = require('./schema.js')();

nconf
.argv()
.env()
.file({file: path.join(__dirname, 'config.json')});

app.use(express.compress());
app.use(express.json());
app.use(express.urlencoded());

var port = nconf.get('port');

var factories = {
	repoErrorHandler: function (res) {
		return function(err) {
			res.send(err);
			res.end();
		};
	},
	dataHandler: function (res) {
		return function(data) {
			if (data) {
				res.send(data);
				res.end();
			}
			else {
				res.status(404).send('Not Found.');
			}
		};
	},
	intHandler: function (res) {
		return function(num) {
			var data = {
				"value": num
			};
			
			res.send(data);
			res.end();
		};
	},
	listCallbackHandler: function (take, page, callback) {
		return function (data) {
			var skip = page * take;
			
			var dataToDisplay = [];
			for (var i = skip; i < (take + skip) && i < data.length; i++) {
				dataToDisplay.push(data[i]);
			}
			
			callback(dataToDisplay);
		};
	},
	listHandler: function (res, take, page) {
		return factories.listCallbackHandler(take, page, function (dataToDisplay) {
			res.send(dataToDisplay);
			res.end();
		});
	},
	hashesFromListHandler: function (res, getFunction) {
		return function(data) {
			if (data) {
				var hashes = [],
					count = 0;
				var checkDone = function() {
					count++;
					if (count === data.length) {
						res.send(hashes);
						res.end();
					}
				};
				for (var i=0; i<data.length; i++) {
					getFunction(data[i], function(hash){
						hashes.push(hash);
						checkDone();
					}, factories.repoErrorHandler(res));
				}
			}
		};
	}
};

var parseCleanRequest = function (keys, req) {
	var data = req.body;
	
	keys.forEach(function(key) {
		delete data[key];
	});
	
	return data;
};

app.get('/api/black/:id', function (req, res) {
	repo.black.get(req.route.params.id, factories.dataHandler(res), factories.repoErrorHandler(res));
});

app.get('/api/white/:id', function (req, res) {
	repo.white.get(req.route.params.id, factories.dataHandler(res), factories.repoErrorHandler(res));
});

app.get('/api/set/:id', function (req, res) {
	repo.cardset.get(req.route.params.id, factories.dataHandler(res), factories.repoErrorHandler(res));
});


app.put('/api/game', function (req, res) {
	var game = parseCleanRequest(schema.game.keys, req);
	game.id = uuid.v4();
	game.createdDate = new Date();
	repo.game.add(game, function (result) {
		repo.game.get(game.id, factories.dataHandler(res), factories.repoErrorHandler(res));
	}, factories.repoErrorHandler(res));
});

app.get('/api/game/count/', function (req, res) {
	repo.game.count(factories.intHandler(res), factories.repoErrorHandler(res));
});

app.get('/api/game/list/take/:take/page/:page', function (req, res) {
	var take = parseInt(req.route.params.take);
	var page = parseInt(req.route.params.page);
	if (!take || take > 100) { take = 100; }
	if (!page || page > 100) { page = 0; }
	repo.game.getAll(
		factories.listCallbackHandler(take, page,  factories.hashesFromListHandler(res, repo.game.get)), 
		factories.repoErrorHandler(res));
});

app.get('/api/game/:id', function (req, res) {
	repo.game.get(req.route.params.id, factories.dataHandler(res), factories.repoErrorHandler(res));
});


app.listen(port);