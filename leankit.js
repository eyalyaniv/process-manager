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

// Gets all the boards objects under the account 
// client.getBoards( function( err, boards ) {  
//   if ( err ) console.error( "Error getting boards:", err );
//   //console.log( boards );
// } );


var leankitEventsList = {
    "card-move-to-board": function( e ) {
        console.log(e);
        var card = getLeankitCard(boardId_execution, e.card);
        sendMsgToSlack("ProcessMangrBot", "@eyalyaniv", card.message);
    },
    "card-move": function( e ) {
        console.log(e);
        var card = getLeankitCard(boardId_execution, e.card);
        sendMsgToSlack("ProcessMangrBot", "@eyalyaniv", card.message);
    }
};

function generateEvents(eventList){
    for(var e in eventList){
        events.on(e, eventList[e]);
    }
    events.start();
}

generateEvents(leankitEventsList);

function getLeankitCard(boardId, cardId){
    client.getCard(boardId, cardId, function(err, card){
        if ( err ) console.error( "Error getting card:", err );
        console.log( card );
        return card;
    });
}

function insertPostDemoReport(){

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

/*
// ***** Prototype ***** //
//Subscribe to card-move leankit event
events.on( "card-move", function( e ) {
    console.log( e );

    //Gets a leankit card object from the specific board
    client.getCard('156116725', e.cardId, function(err, card){
      if ( err ) console.error( "Error getting boards:", err );
      console.log( card );
    });
    
    //Send to team's post demo report
    request.post(
      gms_pdr_script_url,
      e,
        function (error, response, body) {
          if (!error && response.statusCode == 200) {
              console.log(body)
          }
        }
    );

    //Send to slack channel
    slack.setWebhook(webhookUri);
    slack.webhook({
    channel: "@eyalyaniv",
    username: "LeankitBot",
    text: e.message
    }, function(err, response) {
      console.log(e.message);
    });
});
events.start();
*/


