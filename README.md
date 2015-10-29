# nuget-docker
Emulates a nuget feed based on a docker repository.
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
