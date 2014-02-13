module.exports = function () {
	var module =  {
		repoError: function (res) {
			return function(err) {
				res.send(err);
				res.end();
			};
		},
		data: function (res) {
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