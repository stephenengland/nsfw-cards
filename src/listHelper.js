var sortAndTakeList = function (data, take, page, where, sort) {
	var skip = page * take,
		stop = take + skip,
		dataToDisplay = [];
	
	if (sort) {
		var dataSorted = [];
		for (var i = 0; i < data.length; i++) {
			if (!where || where(data[i])) {
				dataSorted.push(data[i]);
			}
		}
		
		dataSorted.sort(sort);
		
		for (var j = skip; j < stop && j < dataSorted.length; j++) {
			dataToDisplay.push(dataSorted[j]);
		}
	}
	else {
		for (var k = skip; k < stop && k < data.length; k++) {
			if (!where || where(data[k])) {
				dataToDisplay.push(data[k]);
			}
		}
	}
	
	return dataToDisplay;
};

module.exports = {
	list: function (take, page, where, sort, callback) {
		return function (data) {
			var dataToDisplay = sortAndTakeList(data, take, page, where, sort);
			
			callback(dataToDisplay);
		};
	},
	listWithGets: function (take, page, where, sort, getFunction, callback) {
		return function (preGetData) {
			var data = [],
				count = 0,
				checkDone = function() {
					count++;
					if (count === preGetData.length) {
						var dataToDisplay = sortAndTakeList(data, take, page, where, sort);
						
						callback(dataToDisplay);
					}
				};

			var addItem = function (item) {
				data.push(item);
				checkDone();
			};
			for (var i=0; i<preGetData.length; i++) {
				getFunction(preGetData[i], addItem);
			}
		};
	}
};