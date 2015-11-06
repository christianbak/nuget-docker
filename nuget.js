//var AdmZip = require('adm-zip');
var JSZip = require("jszip");
function getRels(packageName) {
	return '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="Re0" Target="/' + packageName + '.nuspec" Type="http://schemas.microsoft.com/packaging/2010/07/manifest" /><Relationship Id="Re1" Target="/package/services/metadata/core-properties/1.psmdcp" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" /></Relationships>';
}

function getContentTypes() {
	return '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default ContentType="application/vnd.openxmlformats-package.relationships+xml" Extension="rels" /><Default ContentType="application/octet" Extension="nuspec" /><Default ContentType="application/octet" Extension="json" /><Default ContentType="application/octet" Extension="txt" /><Default ContentType="application/vnd.openxmlformats-package.core-properties+xml" Extension="psmdcp" /></Types>';
}

function getNuSpec(data) {
	return '<?xml version="1.0" encoding="us-ascii"?>\r\n\
<package xmlns="http://schemas.microsoft.com/packaging/2011/08/nuspec.xsd">\r\n\
  <metadata>\r\n\
    <id>' + data.packageName + '</id>\r\n\
    <version>' + data.imageVersion + '</version>\r\n\
    <authors>root</authors>\r\n\
    <owners>root</owners>\r\n\
    <requireLicenseAcceptance>false</requireLicenseAcceptance>\r\n\
    <description>' + data.packageDescription + '</description>\r\n\
    <releaseNotes>Automatic build.</releaseNotes>\r\n\
    <copyright>Copyright 2015</copyright>\r\n\
  </metadata>\r\n\
</package>'
}

function getCoreProperties(data) {
	return '<?xml version="1.0" encoding="UTF-8"?><coreProperties xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"><dc:creator>root</dc:creator><dc:description>' + data.packageDescription + '</dc:description><dc:identifier>' + data.packageName + '</dc:identifier><keywords /><lastModifiedBy>NuGet, Version=2.8.50926.602, Culture=neutral, PublicKeyToken=null;Unix 4.0.3.2;.NET Framework 4</lastModifiedBy><version>' + data.imageVersion + '</version></coreProperties>';
}

function zipPackage(data) {
	var zip = new JSZip();

	console.log('Zip image', '' + data.image + data.imageVersion);
    zip.file("_rels/.rels", getRels(data.packageName));
    if (data.repository) {
        zip.file("content/docker_image.txt", data.repository + '/' + data.image + ':' + data.imageVersion);
    } else {
        zip.file("content/docker_image.txt", data.image + ':' + data.imageVersion);
    }
    zip.file("[Content_Types].xml", getContentTypes());
    zip.file(data.packageName + '.nuspec', getNuSpec(data));
    zip.file("package/services/metadata/core-properties/1.psmdcp", getCoreProperties(data));
	
	content = zip.generate({type : "uint8array"});

	var b = new Array(content.length);
	for (var i = 0; i < content.length; i++) { b[i] = content[i]; }
  	return new Buffer(b);
};

module.exports = zipPackage;

