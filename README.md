# nuget-docker
Emulates a nuget feed based on a docker repository.

To run, create a settings file 'settings.js' with the following format:

For artifactory:
```
module.exports = {
	search: require('./search-artifactory.js'),
	user: 'username',
	pass: 'password',
	repo: '', //Not used in artifactory
	repositoryPrefix: 'artifactory.mydomain.net:5000', //Repository prefix to add before the docker image name
	hostDomain: 'localhost', //Domain where this service is accessible from (and where the generated nuget packages will be downloaded)
	hostPort: 3001, //Port the service runs on
	remoteHost: 'https://artifactory.mydomain.net/artifactory' //Path to the artifactory API
};
```

For docker hub:
```
module.exports = {
	search: require('./search-docker.js'),
	user: 'username',
	pass: 'password',
	repo: 'my-private-repo', //Private repository in docker hub
	repositoryPrefix: '', //Repository prefix to add before the docker image name
	hostDomain: 'localhost', //Domain where this service is accessible from (and where the generated nuget packages will be downloaded)
	hostPort: 3001, //Port the service runs on
	remoteHost: 'https://hub.docker.com' //Path to docker hub
};
```
Then start index.js

Used to manage deployments with Octopus Deploy

```
Jenkins -> Docker hub: Upload image
Octopus -> Nuget-docker: List “packages”
Nuget-docker -> Docker hub: fetch packages/tags
Nuget-docker – Octopus: List docker images/tags as nuget packages with versions
User -> Octopus: Deploy release
Octopus -> Nuget-docker: Download nuget package
Nuget-docker -> Octopus: Send a nuget package with a single textfile containing the docker-image name + tag
Octopus -> Jump host: Extract nuget package with text file
```


