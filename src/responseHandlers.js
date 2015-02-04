module.exports = function () {
	var module =  {
		repoError: function (res) {
			return function(err) {
				res.send(err);
				res.end();
			};
		},
		data: function (res, removeKeys) {
			return function(data) {
				if (data) {
					if (removeKeys) {
						removeKeys.forEach(function(key) {
							delete data[key];
						});
					}
					res.send(data);
					res.end();
				}
				else {
					res.status(404).send('Not Found.');
				}
			};
		},
		integer: function (res) {
			return function(num) {
				var data = {
					"value": num
				};
				
				res.send(data);
				res.end();
			};
		}
	};
	
	return module;
};