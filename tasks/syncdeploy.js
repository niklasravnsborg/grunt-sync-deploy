/*
 * grunt-sync-deploy
 * https://github.com/niklasravnsborg/grunt-sync-deploy
 *
 * Copyright (c) 2015 Niklas Ravnsborg-Gjertsen
 * Licensed under the MIT license.
 */

var Q         = require('q'),
    fsStat    = Q.nfbind(require('fs').stat),
    NodeSSH   = require('node-ssh'),
    minimatch = require('minimatch');

function arrayFind(array, key, value) {
	'use strict';

	for (var i = 0; i < array.length; i++) {
		if (array[i][key] == value) {
			return i;
		}
	}
}

function checkMinimatchPatterns(patterns, file) {
	'use strict';

	for (var pattern of patterns) {
		if (minimatch(file, pattern)) {
			return true;
		}
	}
}

function gruntSyncDeploy(sshconfig, cwd, deploySrc, deployTo, removeEmpty, keepFiles, serverTimezone) {
	'use strict';

	var sftp,
	    uploadList = [],
	    removeList = [],
	    ssh = new NodeSSH;

	// connect to SSH
	ssh.connect(sshconfig).then(function() {

		// request a SFTP object to later use with ssh.put
		return ssh.requestSFTP().then(function(result) {
			sftp = result;
		});

	}).then(function() {

		// create `deployTo` directory if it doesn't exist
		return ssh.execCommand('mkdir -p ' + deployTo);

	}).then(function() {

		// execute array of promises and wait until they fullfill
		return Promise.all([

			// returns a string with all file names and last modified date
			// %c will print the date
			// | is a special char used for later string splitting
			// %p is the filename with path
			// \n starts a new line
			ssh.execCommand(
				'find ' + deployTo + ' -type f -printf "%c|%p\\n"'
			).then(function(data) {

				// if nothing on the server and no error
				if (data.stdout === '' && data.stderr === '') {
					// return empty array
					return [];
				}

				// if error, return error
				if(data.stderr !== '') {
					return Promise.reject(Error(data.stderr));
				}

				// split data string into files array,
				// every line becomes an array item
				var files = data.stdout.replace(/\r?\n?[^\r\n]*$/, '').split('\n');

				// loop through every element in `files`
				for (var i in files) {

					// split elements into date and name
					// split char defined in ssh exec
					var split = files[i].split('|'),
					    date = split[0],
					    file = split[1];

					// remove dir prefix
					file = file.replace(deployTo, '');

					// parse date string to `Date`
					date = new Date(Date.parse(date + serverTimezone));

					files[i] = {
						file: file,
						date: date
					};

				}

				return files;

			}),

			// returns an array with local files
			Promise.resolve(deploySrc).then(function(files) {

				return files.reduce(function(sequence, file, index) {

					// appends these `then` functions to sequence
					return sequence.then(function() {
						return fsStat(cwd + file);
					}).then(function(stat) {

						files[index] = {
							file: file,
							date: stat.mtime,
							done: false
						};

					});

				}, Promise.resolve()).then(function() {
					return files;
				});

			})

		]);

	}).then(function(results) {

		// Here we gonna compare the server files with the
		// local files and then we'll upload only those
		// files that are newer on local then on the server.

		var server = results[0],
		    local  = results[1];

		// loop through server files
		for (var i in server) {

			var serverFile  = server[i],
			    localFileId = arrayFind(local, 'file', serverFile.file),
			    localFile   = local[localFileId];

			// whether server file is a file to keep
			if (checkMinimatchPatterns(keepFiles, serverFile.file)) {
				// end current iteration of loop
				// the file gets prevented from being uploaded
				if (typeof local[localFileId] != 'undefined') {
					local[localFileId].done = true;
					console.log(serverFile.file + ' skipped.')
				}
				continue;
			}

			// if local file to server file exists
			if (localFile !== undefined) {

				// if local file ist newer then server file
				if (localFile.date > serverFile.date) {
					// add local file to `uploadList`
					uploadList.push(localFile.file);
				}

				// mark local file as done
				local[localFileId].done = true;

			} else {
				// if server file doesn't exists on local
				// add file to `removeList`
				removeList.push(serverFile.file);
			}
		}

		// loop through local files
		for (var i in local) {

			// if not done
			if (local[i].done === false) {
				// add to `uploadList`
				uploadList.push(local[i].file);
			}

		}

	}).then(function() {

		return uploadList.reduce(function(sequence, file, index) {

			// appends these then functions to sequence
			return sequence.then(function() {
				var upload   = cwd + file,
				    uploadTo = deployTo + file;

				console.log('Uploading', upload);
				return ssh.put(upload, uploadTo, sftp);
			});

		}, Promise.resolve());

	}).then(function() {

		// execute `removeList`
		return removeList.reduce(function(sequence, file, index) {

			return sequence.then(function() {
				var remove = deployTo + file;

				console.log('Removing', remove);
				return ssh.execCommand('rm \"' + remove + '\"');
			});

		}, Promise.resolve());

	}).then(function() {

		if (removeEmpty) {
			// remove all empty directories
			console.log('Removing empty directories.');
			return ssh.execCommand('find ' + deployTo + ' -empty -type d -delete');
		}

	}).then(function() {

		// close SSH connection
		ssh.end();

	}).catch(function(err) {

		// error messages will be catched and printed here
		console.error(err);

	});
}

module.exports = function(grunt) {
	'use strict';

	grunt.registerMultiTask('syncdeploy', 'Incremental deploy changed files to SSH.', function() {

		var options = this.options({
			removeEmpty: false,
			keepFiles: [],
			serverTimezone: ''
		});

		// tell Grunt to wait for this async code to finish
		this.async();

		var config    = grunt.option('config'),
		    cwd       = this.data.cwd || '',
		    deploySrc = [],
		    deployTo  = grunt.config.get('sshconfig.' + config + '.deployTo'),
		    sshconfig = {};

		sshconfig.host     = grunt.config.get('sshconfig.' + config + '.host');
		sshconfig.username = grunt.config.get('sshconfig.' + config + '.username');
		sshconfig.password = grunt.config.get('sshconfig.' + config + '.password');

		this.filesSrc.forEach(function(file) {
			// if is a file, not directory
			if (grunt.file.isFile(cwd + file)) {
				deploySrc.push(file);
			}
		});

		gruntSyncDeploy(sshconfig, cwd, deploySrc, deployTo, options.removeEmpty, options.keepFiles, options.serverTimezone);

	});
};
