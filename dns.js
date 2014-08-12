var domain = "www.google.com";
//var domain = "www.north-winds.org";

var rrtype = { 'A': 1, 'OPT': 41 };
var rrclass = { 'IN': 1 };
var socketId;

var onReceive = function(info) {
	if(info.socketId !== socketId)
		return;
	console.log(info.data);
	var ad_flag = 1 << 5;
	var view = new DataView(info.data);
	var flags = view.getUint16(2);
	if((flags & ad_flag) == ad_flag) {
	    console.log("Authenticated data for '" + domain + "': 0x" + flags.toString(16) + "!");
	} else {
	    console.log("Not authentic for '" + domain + "': 0x" + flags.toString(16) + "!");
	}
}

// Create the Socket
chrome.sockets.udp.create({}, function(socketInfo) {
    var arrayBuffer = new ArrayBuffer(4096);
    var view = new DataView(arrayBuffer);
    var id = Math.floor(Math.random()*65536);
    var rd_flag = 1 << 8;
    var flags = rd_flag;
    var question = [ domain ];
    var answer = [];
    var authority = [];
    var additional = [ "" ];
    var ptr = 0;
    view.setUint16(ptr, id);		    ptr += 2;
    view.setUint16(ptr, flags);		    ptr += 2;
    view.setUint16(ptr, question.length);   ptr += 2;
    view.setUint16(ptr, answer.length);	    ptr += 2;
    view.setUint16(ptr, authority.length);  ptr += 2;
    view.setUint16(ptr, additional.length); ptr += 2;
    for(var i = 0; i < question.length; i++) {
	var labels = question[i].split('.');
	for(var j = 0; j < labels.length; j++) {
	    var label = labels[j];
	    view.setUint8(ptr++, label.length);
	    for(var k = 0; k < label.length; k++)
		view.setUint8(ptr++, label.charCodeAt(k));
	}
	view.setUint8(ptr++, 0); /* zero-length root label */
	view.setUint16(ptr, rrtype['A']);   ptr += 2;
	view.setUint16(ptr, rrclass['IN']); ptr += 2;
    }
    for(var i = 0; i < additional.length; i++) {
	if(additional[i] != "") {
	    var labels = additional[i].split('.');
	    for(var j = 0; j < labels.length; j++) {
		var label = labels[j];
		view.setUint8(ptr++, label.length);
		for(var k = 0; k < label.length; k++)
		    view.setUint8(ptr++, label.charCodeAt(k));
	    }
	}
	view.setUint8(ptr++, 0); /* zero-length root label */
	view.setUint16(ptr, rrtype['OPT']);   ptr += 2;
	//view.setUint16(ptr, rrclass['IN']); ptr += 2;
	view.setUint16(ptr, 4096); ptr += 2;
	view.setUint8(ptr,  0); ptr += 1;
	view.setUint8(ptr,  0); ptr += 1;
	view.setUint16(ptr,  1 << 15); ptr += 2;
	view.setUint16(ptr,  0); ptr += 2;
    }
    var buf2 = new ArrayBuffer(ptr);
    var view2 = new DataView(buf2);
    for(var i = 0; i < ptr; i++)
	view2.setUint8(i, view.getUint8(i));
    arrayBuffer = buf2;
    socketId = socketInfo.socketId;
    chrome.sockets.udp.onReceive.addListener(onReceive);
    chrome.sockets.udp.bind(socketId, "0.0.0.0", 0, function(result) {
	if(result < 0) {
	    console.log("Error binding DNS socket.");
	    return;
	}
	chrome.sockets.udp.send(socketId, arrayBuffer,
	  '8.8.8.8', 53, function(sendInfo) {
	    console.log("sent " + sendInfo.bytesSent);
	});
    });
});

chrome.runtime.onMessageExternal.addListener(function(request, sender, sendResponse) {
	console.log("Got message: " + request.domain);
	sendResponse({secure: true});
	return true;
});
