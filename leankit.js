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

//Lookup table to convert Leankit user Id to slack private channel
var usersLeankitToSlack = {
    132006304: "@tinomatalon",
    134392332: "@alext",
    257515763: "@alonb",
    351522729: "@amir",
    134400937: "@anatolii",
    258096719: "@andrey",
    261692832: "@daniel.matalon",
    323985909: "@daiella",
    207536925: "@dave.raanan",
    134392329: "@dmsapiga",
    272850592: "@dor",
    134400938: "@elenav",
    152743345: "@eyalyaniv",
    282034219: "@johnny21",
    263323996: "@hayim",
    130929363: "@itai",
    358647187: "@galstilkol"
};

//Leankit API events 
var leankitEventsList = {
    //Occurs when a card is moved from another board to the board being monitored.
    "card-move-to-board": function( e ) {
        console.log(e);
        getLeankitCard(boardId_execution, e.cardId, e, function(err, card, event){
            if(err){
                console.error( "Error getting leankit card:", err );
                return;
            }
            sendMsgToSlack("ProcessMangrBot", usersLeankitToSlack[e.userId], event.message);
            insertPostDemoReport(event);
        });  
    },
    //Occurs when a card is moved on the board.
    "card-move": function( e ) {
        console.log(e);
        getLeankitCard(boardId_execution, e.cardId, e, function(err, card, event){
            if(err){
                console.error( "Error getting leankit card:", err );
                return;
            }
            sendMsgToSlack("ProcessMangrBot", usersLeankitToSlack[e.userId], event.message);
            insertPostDemoReport(event);
        });
    },
    //Occurs when a new card is added to a board.
    "card-creation": function( e ) {
        console.log(e);
        getLeankitCard(boardId_execution, e.cardId, e, function(err, card, event){
            if(err){
                console.error( "Error getting leankit card:", err );
                return;
            }
            sendMsgToSlack("ProcessMangrBot", usersLeankitToSlack[e.userId], event.message);
            insertPostDemoReport(event);
        });
    },
    //Occurs when a card is blocked or unblocked. Check the isBlocked property to know whether the card was blocked or unblocked.
    "card-blocked": function( e ) {
        console.log(e);
        getLeankitCard(boardId_execution, e.cardId, e, function(err, card, event){
            if(err){
                console.error( "Error getting leankit card:", err );
                return;
            }
            sendMsgToSlack("ProcessMangrBot", usersLeankitToSlack[e.userId], event.message);
            insertPostDemoReport(event);
        });
    },
    //Occurs when a card is deleted.
    "card-deleted": function( e ) {
        console.log(e);
        getLeankitCard(boardId_execution, e.cardId, e, function(err, card, event){
            if(err){
                console.error( "Error getting leankit card:", err );
                return;
            }
            sendMsgToSlack("ProcessMangrBot", usersLeankitToSlack[e.userId], event.message);
            insertPostDemoReport(event);
        });
    },
    //Occurs when users are assigned or unassigned from a card. Check the isUnassigning property to know whether the user is being assigned or unassigned.
    "user-assignment": function( e ) {
        console.log(e);
        getLeankitCard(boardId_execution, e.cardId, e, function(err, card, event){
            if(err){
                console.error( "Error getting leankit card:", err );
                return;
            }
            sendMsgToSlack("ProcessMangrBot", usersLeankitToSlack[e.userId], event.message);
            insertPostDemoReport(event);
        });
    },
    //Occurs when a user posts a comment on a card.
    "comment-post": function( e ) {
        console.log(e);
        getLeankitCard(boardId_execution, e.cardId, e, function(err, card, event){
            if(err){
                console.error( "Error getting leankit card:", err );
                return;
            }
            sendMsgToSlack("ProcessMangrBot", usersLeankitToSlack[e.userId], event.message);
            insertPostDemoReport(event);
        });
    }
};

//Gets all the boards objects under the account 
client.getBoard(boardId_execution, function( err, board ) {  
   if ( err ) console.error( "Error getting boards:", err );
   console.log(board.BoardUsers);
 });

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




