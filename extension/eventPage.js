var domainRegex = new RegExp('^(?:http|ftp)s?://(?:[^@/]*@)?([^:/]+)', 'im');

function checkDNSSEC(tabId, changeInfo, tab) {
	//var domain = "www.north-winds.org";
	var domain = tab.url.match(domainRegex)[1].toString();
	//chrome.pageAction.show(tabId);
	console.log("Checking security for domain '" + domain + "'.");
	chrome.runtime.sendMessage("dlcgddihmkibmbabfffngpkaejmpppla",
		{ domain: domain }, function(response) {
			if(response.secure) {
				chrome.pageAction.show(tabId);
				console.log("Domain '" + domain + "' is secure.");
			} else {
				chrome.pageAction.hide(tabId);
				console.log("Domain '" + domain + "' is NOT secure.");
			}
		});
};

console.log("Action setting up handlers.");

chrome.tabs.onUpdated.addListener(checkDNSSEC);
