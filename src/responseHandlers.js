var sortAndTakeList = function (data, take, page, where, sort) {
	var skip = page * take,
		dataToDisplay = [];
	
	if (sort) {
		var dataSorted = [];
		for (var i = 0; i < data.length; i++) {
			if (!where || where(data[i])) {
				dataSorted.push(data[i]);
			}
		}
		
		dataSorted.sort(sort);
		
		for (var i = skip; i < (take + skip) && i < dataSorted.length; i++) {
			dataToDisplay.push(dataSorted[i]);
		}
	}
	else {
		for (var i = skip; i < (take + skip) && i < data.length; i++) {
			if (!where || where(data[i])) {
				dataToDisplay.push(data[i]);
			}
		}
	}
	
	return dataToDisplay;
};

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
		},
		list: function (res, take, page, where, sort) {
			return function (data) {
				var dataToDisplay = sortAndTakeList(data, take, page, where, sort);
				
				res.send(dataToDisplay);
				res.end();
			};
		},
		listWithGets: function (res, take, page, where, sort, getFunction) {
			return function (preGetData) {
				var data = [],
					count = 0,
					checkDone = function() {
						count++;
						if (count === preGetData.length) {
							var dataToDisplay = sortAndTakeList(data, take, page, where, sort);
							
							res.send(dataToDisplay);
							res.end();
						}
					};
				
				for (var i=0; i<preGetData.length; i++) {
					getFunction(preGetData[i], function (item) {
						data.push(item);
						checkDone();
					});
				}
			};
		}
	};
	
	return module;
};