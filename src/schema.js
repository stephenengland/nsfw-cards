module.exports = function () {
	return {
		game: {
			keys: [
				"id",
				"createdDate"
			],
			sort: {
				byCreatedDate: function (a, b) {
					return a.createdDate > b.createdDate ? -1 : a.createdDate < b.createdDate ? 1 : 0;
				}
			}
		},
		user: {
			keys: [
				'apiToken',
				'loginToken',
				'lastLogin'
			],
			insecureKeys: [
				'loginToken'
			]
		}
	};
};