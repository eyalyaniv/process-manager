// Reference to packages
var LeanKitClient = require( "leankit-client" );
var LeanKitEvents = require( "leankit-client/events" );
var Slack = require('slack-node');
var request = require('request');

//Game Managment post demo report google sheet script
var gms_pdr_script_url = "https://script.google.com/macros/s/AKfycbzcvQTbcG4G5ndDydB2y9_wAAi-Cnpov4Iif44eg_tLrnqXqRT-/exec";
//Slack incoming webhook URL
var webhookUri = "https://hooks.slack.com/services/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";

//Leankit Account name and credentials
var accountName = "https://egames.leankit.com";
var email = "eyal@7egames.com";
var password = "eyal2leankit";
var boardId_execution = 156116725; //Execution board Id

// Instances creation
var client = new LeanKitClient( accountName, email, password );
var events = new LeanKitEvents( client, boardId_execution);
var slack = new Slack();
slack.setWebhook(webhookUri);

var leankitEventsList = {
    "card-move-to-board": function( e ) {
        console.log(e);
        getLeankitCard(boardId_execution, e.cardId, e, function(err, card, event){
            if(err){
                console.error( "Error getting leankit card:", err );
                return;
            }
            sendMsgToSlack("ProcessMangrBot", "@eyalyaniv", event.message);
            insertPostDemoReport(event);
        });  
    },
    "card-move": function( e ) {
        console.log(e);
        getLeankitCard(boardId_execution, e.cardId, e, function(err, card, event){
            if(err){
                console.error( "Error getting leankit card:", err );
                return;
            }
            sendMsgToSlack("ProcessMangrBot", "@eyalyaniv", event.message);
            insertPostDemoReport(event);
        });
    }
};

function generateEvents(eventList){
    for(var e in eventList){
        events.on(e, eventList[e]);
    }
    events.start();
}

generateEvents(leankitEventsList);

function getLeankitCard(boardId, cardId, event, cb){

    client.getCard(boardId, cardId, function(err, card){
        if ( err ) {  
            return cb(err);
        }
        cb(null, card, event);
    });
}

function insertPostDemoReport(event){
    // request.post( gms_pdr_script_url, JSON.stringify(event), function (error, response, body) {
    //     if (!error && response.statusCode == 200) {
    //         console.log(body);
    //     }
    // });
    request( { method: 'POST', url: gms_pdr_script_url, headers: {'Content-Type': 'application/json'}, json: event}, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            //console.log(body);
        }
    });
}

function sendMsgToSlack(sender, target, msg){
    slack.webhook({
        channel: target,
        username: sender,
        text: msg
    },  function(err, response) {
            console.log(msg);
        });
}

// Gets all the boards objects under the account 
// client.getBoards( function( err, boards ) {  
//   if ( err ) console.error( "Error getting boards:", err );
//   //console.log( boards );
// } );


