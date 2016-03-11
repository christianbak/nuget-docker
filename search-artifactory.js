var createFeed = require('./create-feed.js');
var repo = 'https://artifactory.prodwest.citrixsaassbe.net/artifactory';
var server = 'http://localhost:3000';
var rest = require('restling');
var username, password, privateRepo;

function fetch(path) {
		return rest.get(repo + path, {
			headers: {
				'Accept': 'application/json',
				//'Authorization' : 'Basic cmVhZG9ubHk6cmVhZG9ubHk='
			},
			username: username,
			password: password
		});
}

function searchRepositories(query) {
	return rest.post(repo + '/api/search/aql', {
		headers: {
			'Accept': 'application/json',
			//'Authorization' : 'Basic cmVhZG9ubHk6cmVhZG9ubHk=',
			'Content-Type': 'plain/text'
		},
		username: username,
		password: password,
		data: 'items.find({ "@docker.repoName":{"$match":"*' + query + '*"} })'
	}).then(function (result) {
		var mappedResult = result.data.results.map(artifactToFeed); 
		return createFeed(mappedResult);
	});
}

function getVersions(image) {
	return fetch('/api/storage/dockerv2/' + image + '?list=&deep=0&listFolders=1&mdTimestamps=1').then(function (result) {
		var versions = result.data.files.filter(function(tag) {
			return tag.folder && //Must be a folder
				tag.uri.match(/\/\d+\.\d+\.\d+(\-[a-zA-Z][0-9a-zA-Z\-]*)?$/); //And must have correct semantic versioning format
		});
		console.log('Versions', versions);
		var mappedVersions = versions.map(tagToVersion(image));
		return createFeed(mappedVersions);
	});
}

function getImage(image, version) {
	console.log('Get specific image', image, version);
	return fetch('/api/storage/dockerv2/' + image + '/' + version)
		.then(function(result){
			console.log(result.data);
			return createFeed({
				id: server + '/packages/' + image + ':' + version,
			    name: image,
			    sourceUrl: server + '/packages/' + image + ':' + version,
			    version: version,
			    description: '-',
			    created: new Date(result.data.lastModified)
			});
		});
}

function artifactToFeed (result) {
	var image = result.path.replace('repositories/', '');
	var image = result.path.replace(/\/[0-9]+\.[0-9]+\.[0-9]+.*/, '');
	image = {
		namespace: image.substr(0, image.indexOf('/')),
		name: image.substr(image.indexOf('/') + 1),
		last_updated: result.modified,
		created: result.created
	};
	console.log(image)
	return {
      id: server + '/packages/' + image.namespace + '/' + image.name + ':latest',
      name: image.namespace + '/' + image.name,
      sourceUrl: server + '/packages/' + image.namespace + '/' + image.name + ':latest',
      version: '0.0.0',
      description: image.description ||  '-',
      created: new Date(image.last_updated)
   };
}

function imageToFeed (image) {
	return {
      id: server + '/packages/' + image.namespace + '/' + image.name + ':latest',
      name: image.namespace + '/' + image.name,
      sourceUrl: server + '/packages/' + image.namespace + '/' + image.name + ':latest',
      version: '0.0.0',
      description: image.description ||  '-',
      created: new Date(image.last_updated)
   };
}

function tagToVersion(image) {
	return function (tag) {
		var tagName = tag.uri.substring(1) //Remove leading '/'
		return {
	      id: server + '/packages/' + image + '/' + tagName,
	      name: image,
	      sourceUrl: server + '/packages/' + image + '/' + tagName,
	      version: tagName,
	      description: '-',
	      created: new Date(tag.lastModified)
	   };
	}
}


module.exports = {
	login: function (user, pass, repo, localServer, remoteHost) {
		username = user;
		password = pass;
		privateRepo = repo;
		server = localServer;
		repo = remoteHost;
	},
	search: searchRepositories,
	versions: getVersions,
	specific: getImage
};