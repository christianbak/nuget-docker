var createFeed = require('./create-feed.js');
var repo = 'https://hub.docker.com';
var server = 'http://localhost:3000';
var token;
var rest = require('restling');
var crypto = require('crypto');
var username, password, privateRepo;

function getToken() {
	if (token) {
		return Promise.resolve(token);
	}

	return rest.post(repo + '/v2/users/login', {
		data: JSON.stringify({
			username: username,
			password: password
		}),
		headers: {
			'Content-Type': 'application/json',
			'Accept': 'application/json'
		}
	}).then(function(result) {
		if (result.data.token) {
			token = result.data.token;
			return token;
		} else {
			console.log('Error login in:', result);
			return Promise.reject('Error logging in');
		}
			
	});
}

function fetch(path, qs) {
	return getToken().then(function(jwt) {
		return rest.get(repo + '/v2' + path, {
      query: qs,
			headers: {
				'Authorization' : 'JWT ' + jwt,
				'Accept': 'application/json'
			}
		});
	});	
}

function searchRepositories(query) {
  if(query.startsWith(privateRepo)) {
    query = query.slice(privateRepo.length+1);
  }

	var q = new RegExp(query, 'gi');

	return fetch('/repositories/' + privateRepo, {page_size: 200}).then(function (result) {
		var searchResult = result.data.results.filter(function(image){
			return q.exec(image.namespace + '/' + image.name);
		});
		var mappedResult = searchResult.map(imageToFeed); 
		return createFeed(mappedResult);
	});
}

function getVersions(image) {
	return fetch('/repositories/' + image + '/tags').then(function (result) {
    console.log('result', result.data.results);
		var versions = result.data.results.filter(function(tag) {
			//return tag.name.match(/^\d+\.\d+\.\d+(\.\d+)?$/);
      return true;
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
		imageResult.tag = results[0].data.results.filter(function(tag) { return tag.name === version || dockerVersionToNugetVersion(tag.name) === version })[0];
		return createFeed(fullImageToFeed(imageResult));
	});
}

function dockerVersionToNugetVersion(version) {
  console.log('in', version);
  var re = /^(.*?)(\d+)\.(\d+)(?:\.(\d+))?(?:\.(\d+))?(.*)$/;
  var match = version.match(re);

  if(!match) {
    return '0.0.0-' + version.replace(/[^0-9a-z]/gi, '');
  }

  var pre = match[1];
  var major = match[2];
  var minor = match[3];
  var build =  match[4];
  var variation = match[5]
  var tag = (match[6]||'').replace(/^-*/,'');

  var nuVersion = [major, minor, build, variation].filter(function(v) { return v && v.length > 0; });

  if(nuVersion.length < 2) {
    nuVersion.push('0');
  }

  nuVersion = nuVersion.join('.');

  if(!tag && pre) { tag = pre; }
  if(tag && tag.length > 0) {
    if(!tag.match(/^[a-z]/i)) {
      tag = 'a' + tag;
    }

    if(tag.replace(/[^0-9a-z-]/gi, '').length > 0) {
      nuVersion = nuVersion + '-' + tag.replace(/[^0-9a-z-]/gi, '').slice(0,19).toLowerCase();
    } else {
      var shaSum = crypto.createHash('sha1');
      shaSum.update(nuVersion + tag);
      var hash = shaSum.digest('hex')
        .split('')
        .map(function(s){ var c = s.charCodeAt(0); return String.fromCharCode(c > 59 ? c : c + 17)})
        .join('')
      nuVersion = nuVersion + '-' + hash.slice(0,19).toLowerCase();
    }
  }

  console.log('out', nuVersion);
  return nuVersion;
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
	      version: dockerVersionToNugetVersion(tag.name),
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
	    version: dockerVersionToNugetVersion(fullImage.tag.name),
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
