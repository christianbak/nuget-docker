var XML = '<?xml version="1.0" encoding="UTF-8"?>'
var feedHeader = '<feed xmlns="http://www.w3.org/2005/Atom" xmlns:d="http://schemas.microsoft.com/ado/2007/08/dataservices" xmlns:m="http://schemas.microsoft.com/ado/2007/08/dataservices/metadata" xml:base="https://packages.nuget.org/api/v2/">';
var entryHeader = '<entry xml:base="http://packages.nuget.org/api/v2/" xmlns="http://www.w3.org/2005/Atom" xmlns:d="http://schemas.microsoft.com/ado/2007/08/dataservices" xmlns:m="http://schemas.microsoft.com/ado/2007/08/dataservices/metadata">'; 

function entry(params) {
   return '\
      <id>' + params.id + '</id>\
      <title type="text">' + params.name.replace('/', '-') + '</title>\
      <content type="application/zip" src="' + params.sourceUrl + '" />\
      <m:properties>\
         <d:Version>' + params.version + '</d:Version>\
         <d:Description>' + params.description + '</d:Description>\
         <d:Published m:type="Edm.DateTime">' + params.created.toISOString() + '</d:Published>\
      </m:properties>';
}

module.exports = function(entries) {
	if (require('util').isArray(entries)){
		return XML + 
			feedHeader + 
			entries.map(function(entryItem) {
				return '<entry>' + entry(entryItem) + '</entry>'
			}).join('') +
			'</feed>';	
	} else {
		return XML + 
			entryHeader + 
			entry(entries) +
			'</entry>';
	}
	
}