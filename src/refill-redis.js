var repo = require('./repository.js')(),
	cahParser = require('./cahParser.js')();

repo.deleteEverything();

cahParser.parseFile(null, function (data) {
	var addHash = function (repoFunction, data) {
		var key = data.type + ':' + data.id;
		delete data.type;
		repoFunction(data);
	};
	switch (data.type) {
		case 'black_cards': 
			addHash(repo.black.add, data);
		break;
		case 'white_cards': 
			addHash(repo.white.add, data);
		break;
		case 'card_set': 
			addHash(repo.cardset.add, data);
		break;
		case 'card_set_black_card':
			repo.relations.cardset.black.add(data['black-card-id'], data['card-set-id']);
		break;
		case 'card_set_white_card':
			repo.relations.cardset.white.add(data['white-card-id'], data['card-set-id']);
		break;
	}
}, function(){
	//Need to dispose after call stack is finished.
	//repo.dispose();
});