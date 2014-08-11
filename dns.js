var rrtype = { 'A': 1 };
var rrclass = { 'IN': 1 };
var socketId;

var onReceive = function(info) {
	if(info.socketId !== socketId)
		return;
	console.log(info.data);
}

// Create the Socket
chrome.sockets.udp.create({}, function(socketInfo) {
    var arrayBuffer = new ArrayBuffer(4096);
    var view = new DataView(arrayBuffer);
    var id = Math.floor(Math.random()*65536);
    var question = [ "www.google.com" ];
    var answer = [];
    var authority = [];
    var additional = [];
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
	view.setUint16(ptr, rrtype['A']);
	view.setUint16(ptr, rrclass['IN']);
    }
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
