var createFeed = require('./create-feed.js');
var repo = 'https://artifactory.prodwest.citrixsaassbe.net/artifactory';
var server = 'http://localhost:3000';
var token;
var rest = require('restling');
var username, password, privateRepo;

function getToken() {
	return '';
	// if (token) {
	// 	return Promise.resolve(token);
	// }

	// return rest.post(repo + '/v2/users/login', {
	// 	data: JSON.stringify({
	// 		username: username,
	// 		password: password
	// 	}),
	// 	headers: {
	// 		'Content-Type': 'application/json',
	// 		'Accept': 'application/json'
	// 	}
	// }).then(function(result) {
	// 	if (result.data.token) {
	// 		token = result.data.token;
	// 		return token;
	// 	} else {
	// 		console.log('Error login in:', result);
	// 		return Promise.reject('Error logging in');
	// 	}
			
	// });
}

function fetch(path) {
		return rest.get(repo + path, {
			headers: {
				'Accept': 'application/json'
			}
		});
}

function searchRepositories(query) {
	var q = new RegExp(query, 'gi');
	return fetch('/api/search/prop?docker.repoName=*' + query + '*').then(function (result) {
		var mappedResult = result.data.results.map(uriToFeed); 
		return createFeed(mappedResult);
	});
}

function getVersions(image) {
	return fetch('/repositories/' + image + '/tags').then(function (result) {
		var versions = result.data.results.filter(function(tag) {
			return tag.name.match(/^\d+\.\d+\.\d+$/);
		});
		var mappedVersions = versions.map(tagToVersion(image));
		return createFeed(mappedVersions);
	});
}

function getImage(image, version) {
	console.log('Get specific image', image, version);
	return Promise.all([
		fetch('/repositories/' + image + '/tags'),
		fetch('/repositories/' + image)
	]).then(function(results){
		var imageResult = results[1].data;
		imageResult.tag = results[0].data.results.filter(function(tag) { return tag.name === version; })[0];
		return createFeed(fullImageToFeed(imageResult));
	});
}


function uriToFeed (result) {
	var image = result.uri.match(/docker\/repositories\/(.*)\/_index_images.json/);
	image = image.length > 1 ? image[1] : '';
	image = {
		namespace: image.substr(0, image.indexOf('/')),
		name: image.substr(image.indexOf('/') + 1),
		last_updated: Date.now()
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
		return {
	      id: server + '/packages/' + image + '/' + tag.name,
	      name: image,
	      sourceUrl: server + '/packages/' + image + '/' + tag.name,
	      version: tag.name,
	      description: '-',
	      created: new Date()
	   };
	}
}

function fullImageToFeed(fullImage) {
	return {
		id: server + '/packages/' + fullImage.namespace + '/' + fullImage.name + ':' + fullImage.tag.name,
	    name: fullImage.namespace + '/' + fullImage.name,
	    sourceUrl: server + '/packages/' + fullImage.namespace + '/' + fullImage.name + ':' + fullImage.tag.name,
	    version: fullImage.tag.name,
	    description: fullImage.description ||  '-',
	    created: new Date(fullImage.last_updated)
	};
}

module.exports = {
	login: function (user, pass, repo, localServer) {
		username = user;
		password = pass;
		privateRepo = repo;
		server = localServer;
	},
	search: searchRepositories,
	versions: getVersions,
	specific: getImage
};