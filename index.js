var express = require('express');
var app = express();

//Use Docker hub
var search = require('./search-docker.js');
//search.login('username', 'password', 'gotoassist', 'http://localhost:3000', 'https://hub.docker.com');

//Use artifactory
var search = require('./search-artifactory.js');
search.login('readonly', 'readonly', '', 'http://10.0.1.14:3000', 'https://artifactory.prodwest.citrixsaassbe.net/artifactory');

app.get('/api/v2/Packages()*', function (req, res) {
	res.set({
		'Content-Type': 'application/atom+xml'
	});

	var versionsRX = /filter=tolower\(Id\) eq \'([^\']*)\'/.exec(unescape(req.originalUrl));
	var specificRX = /Id=\'([^']+)\',Version=\'([^']+)\'/.exec(unescape(req.originalUrl));
	
	var query, image, version;
	if (req.originalUrl.indexOf('IsLatestVersion%20or%20IsAbsoluteLatestVersion') >= 0) {
		query = /substringof\(\'([^\']*)\'/gi.exec(req.originalUrl);
		search.search(query && query.length && query[1]).then(function(result) {
			res.send(result);	
		});
	} else if(versionsRX) {
		image = unescape(versionsRX[1]).replace('-','/');
		search.versions(image).then(function(result) {
			res.send(result);
		});	
		console.log('Get versions', versionsRX[1]);
	} else if(specificRX) {
		image = unescape(specificRX[1].replace('-','/'));
		version = specificRX[2];

		search.specific(image, version).then(function(result) {
			console.log('specific', result);
			res.send(result);
		});
		console.log('Fetch specific', image, version);
	} else {
		res.sendStatus(404)
	}

});


app.get('/packages*', function (req, res) {
	console.log('Fetch package');

	var rx = /\/packages\/([^\:]*)\:(.*)/.exec(req.originalUrl);
	var image = rx[1];
	var version = rx[2];

	var conf = {
		packageName: image.replace('/', '-'),
		image: image,
		imageVersion: version,
		packageDescription: '-'
	};
	var pack = require('./nuget.js')(conf);

	console.log(req.originalUrl);

	res.set({
		'Content-Type': 'application/zip',
		'Content-Disposition': 'inline; filename="' + conf.packageName + '.' + conf.imageVersion + '.nupkg"'
  	});
  	res.send(pack);
});


//var rest = require('restler');
app.get('*', function (req, res) {

  console.log(req.readable, req.originalUrl);

  res.send('OK')
  return;
  // var url = 'http://packages.nuget.org' + req.originalUrl;
  // console.log('url', url);
  // rest.get(url, {headers: {'accept': 'application/atom+xml'}}).on('complete', function (result, response) {
  // 	if (result instanceof Error) {
  //   	console.log('Error:');
  //   } else {
  // 		res.set({
  // 			'Content-Type': response.headers['content-type']
  // 		});

  // 		//console.log(replaceUrl(result));
  // 		//require('./simple.js')
  // 		res.send( replaceUrl(result));
  //   }
  // });

});

var server = app.listen(3000, function () {
	var host = server.address().address;
	var port = server.address().port;

	console.log('Listening at http://%s:%s', host, port);
});


//var localIP = 'packages.nuget.org';
// function replaceUrl(content) {
// 	if (typeof(content) !== 'string') return content;
// 	//console.log(content, typeof(content));
// 	return content.replace(/<content [^>]*src=\"([^\"]*)\"/gi, function(a,b) {
// 		//console.log('\n\n\n',a,'\n\n\n',b,'\n\n\n');
// 		return a.replace(b, b.replace(/https?:\/\/packages.nuget.org/gi, 'http://' + localIP));
// 	});
// }