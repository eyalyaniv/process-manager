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
var boardId = 156116725; //Execution board Id

// Instances creation
var client = new LeanKitClient( accountName, email, password );
var events = new LeanKitEvents( client, boardId);
var slack = new Slack();

slack.setWebhook(webhookUri);

client.getBoards( function( err, boards ) {  
  if ( err ) console.error( "Error getting boards:", err );
  //console.log( boards );
} );


//Subscribe to card-move leankit event
events.on( "card-move", function( e ) {
    console.log( e );

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
    slack.webhook({
    channel: "#eyals_playground",
    username: "LeankitBot",
    text: e.message
    }, function(err, response) {
      console.log(response);
    });
});
events.start();



