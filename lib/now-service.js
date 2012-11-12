/**
 * @author Soroush Hat
 */
module.exports = function() {
	var nowServer = {},
		mongoose = require('mongoose');
	
	nowServer.nowjs = require('now');
	var connection = mongoose.connect('mongodb://localhost/collabcoding');
	nowServer.ThreadMessage = mongoose.model('ThreadMessage', new mongoose.Schema({
		messageId: String, messageSender: String, messageBody: String, messageTimestamp: Date, messageTSString: String, messageType: String 
	}));
	
	/*nowServer.Notification = mongoose.model('Notification', new mongoose.Schema({
        notifId: String, notifOwner: String, notifBody: String, notifTimestamp: Date, notifTSString: String
    }));*/
	
	
	nowServer.online = 0;
	nowServer.users = {};
	
	nowServer.start = function(server) {
		var everyone = nowServer.nowjs.initialize(server);
		everyone.now.sendMessage = function(message) {		    		   
			var threadMsg = new nowServer.ThreadMessage();
			threadMsg.messageId = this.user.clientId;
			var ts = threadMsg.messageTimestamp = new Date();
			threadMsg.messageTSString = 'Sent on ' + ts.toDateString() + ' at ' + ts.toLocaleTimeString();
			threadMsg.messageBody = message;
			threadMsg.messageSender = this.now.name;
			threadMsg.save(function(){
				everyone.now.receiveMessage(threadMsg._doc);								   
			});
		};
			
		everyone.now.sendNotification = function(notifMsg, notyType, needRefresh) {		                                    
            var ts = new Date();
            var notifTSString = 'Sent on ' + ts.toDateString() + ' at ' + ts.toLocaleTimeString();  
            //TODO: add notification entity   
            var ntfcn = {text: notifMsg, type: notyType, senderId: this.user.clientId };       
            everyone.now.receiveNotification(ntfcn, needRefresh);                                                           
        };
		
		everyone.now.getHistory = function(callback){
			nowServer.ThreadMessage.find().sort("messageTimestamp").exec(function(e, found){
				callback(found);
			});
		};
				
	};
	
	return nowServer;
}();
