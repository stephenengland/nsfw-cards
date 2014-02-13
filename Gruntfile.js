module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		jshint: {
			files: ['./src/**.js', 'Gruntfile.js', '**.json'],
			options: {
				// options here to override JSHint defaults
				globals: {
					console: true,
					module: true,
					document: true
				}
			}
		},
		execute: {
			target: {
				src: ['./src/refill-redis.js']
			}
		},
		open: {
			all: {
				path: 'http://localhost:8081/api/game/list/take/10/page/0'
			}
		},
		express: {
			all: {
				options: {
					script: './src/server.js',
					background: true
				}
			}
		},
		watch: {
			scripts: {
				files: ['src/*.js'],
				tasks: ['jshint'],
				options: {
					livereload: true
				}
			}
		}
	});
	
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-execute');
	grunt.loadNpmTasks('grunt-express-server');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-open');
	
	grunt.registerTask('createdata', ['execute']);
	grunt.registerTask('default', ['jshint', 'express', 'open', 'watch']);
};