
'use strict';

//Flags
var slackInt = true;
var gSheets = true;

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
    358647187: "@galstilkol",
    206168375: "@hanan",
    356774137: "@hananta",
    270744237: "@ido",
    269090773: "@ilia_unity_dev",
    135868441: "@storyteller",
    167212913: "@jony",
    266487800: "@kosta",
    222533001: "@markshteller",
    130925612: "@matan.eine",
    376981089: "@max_botvinev",
    301468157: "@maxim",
    134399011: "@mmotuz",
    338393030: "@nevogal",
    156104905: "@oded",
    229046300: "@alifrin",
    227661394: "@oleksiibobko",
    134399005: "@alexm",
    347786749: "@robert",
    130931078: "@scott",
    134408802: "@sergeyg",
    165029913: "@sergbeskr",
    132006303: "@yaron",
    132019021: "@tomerbarkan",
    129277315: "@tal",
    219782980: "@shish"
};

var boardNameToId = {
    "Plan": "213572592",
    "Execution": "156116725",
    "BI": "158334672",
    "Marketing": "162843235",
    "DevOps": "195207449",
    "Game Engine": "195208668",
    "Unity": "195209674",
    "QA": "260684238",
    "Rules": "295704070",
    "Community": "297531259",
    "Art": "333892671",
    "Product Planning": "339642420",
    "Game Managment": "344471340"
};

//Leankit API events 
var leankitEventsList = {
    //Occurs when a card is moved from another board to the board being monitored.
    /*
    assignedUserId:0
    blockedComment:null
    boardVersion:88848
    cardId:379424830
    commentText:null
    eventDateTime:"08/26/2016 01:38:23 PM"
    eventType:"card-move-to-board"
    fromLaneId:null
    isBlocked:false
    isUnassigning:false
    message:"Eyal Yaniv moved the Card [test move event] from Board [Plan] Lane [Drop] to Board [Execution] Lane [Drop Lane]."
    requiresBoardRefresh:false
    taskboardId:0
    taskboardParentCardId:0
    toLaneId:156145202
    userId:152743345
    wipOverrideComment:null
    wipOverrideLane:0
    wipOverrideUser:0
    */
    //Occurs when a card is moved to the board.
    "card-move-to-board": function( e ) {
        console.log(e);
        
        getLeankitCard(boardId_execution, e.cardId, e, function(err, card, event){
            if(err){
                console.error( "Error getting leankit card:", err );
                return;
            }
            var isCardValid = validateNewCardOnExecBoard(e.eventType, card);
            //If one of the validation parameters is false the "isCardRejected" is also false and the card returns to it's origin board.
            if(isCardValid.isCardRejected){
                client.moveCardToBoard(card.Id, boardNameToId["Plan"], function(err, response){
                    console.log(response);
                    sendMsgToSlack("Process-Manager-Bot", usersLeankitToSlack[e.userId], "The Action --> " + event.message + " failed! and the card moved back to it's origin. The card does not meet the minimum requirements to be moved to execution board " + JSON.stringify(isCardValid));
                    
                });
            }
            else{
                sendMsgToSlack("Process-Manager-Bot", usersLeankitToSlack[e.userId], "The Action --> " + event.message + " executed succesfully passing all card requirements for execution board, Good Luck Executing!");
            }
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
            sendMsgToSlack("Process-Manager-Bot", usersLeankitToSlack[e.userId], event.message);
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
            var isCardValid = validateNewCardOnExecBoard(e.eventType, card);
            sendMsgToSlack("Process-Manager-Bot", usersLeankitToSlack[e.userId], event.message);
            insertPostDemoReport(event);
        });
    },
    //Occurs when a card is blocked or unblocked. Check the isBlocked property to know whether the card was blocked or unblocked.
    "card-blocked": function( e ) {
        console.log(e);
        //e.blockedComment
        //e.isBlocked true/false
        getLeankitCard(boardId_execution, e.cardId, e, function(err, card, event){
            if(err){
                console.error( "Error getting leankit card:", err );
                return;
            }
            if(e.isBlocked){
                //Sends msg to the person who blocked the card
                sendMsgToSlack("Process-Manager-Bot", usersLeankitToSlack[e.userId], usersLeankitToSlack[e.userId] + ", You just blocked the task: " + card.ExternalSystemUrl + " with the reason: " + e.blockedComment + ". Please make sure it's approved at #block_task_approval");
                //Sends msg to #block_task_approval channel to notify that a card was blocked without reason
                sendMsgToSlack("Process-Manager-Bot", "#block_task_approval", usersLeankitToSlack[e.userId] + " just blocked the task: " + card.ExternalSystemUrl + " with the reason: " + e.blockedComment + ". @tal, @eyalyaniv Please make sure it's approved");  
            }
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
            sendMsgToSlack("Process-Manager-Bot", usersLeankitToSlack[e.userId], event.message);
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
            sendMsgToSlack("Process-Manager-Bot", usersLeankitToSlack[e.userId], event.message);
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
            sendMsgToSlack("Process-Manager-Bot", usersLeankitToSlack[e.userId], event.message);
            insertPostDemoReport(event);
        });
    }
};

//Gets a board object under the account 
// client.getBoard(boardId_execution, function( err, board ) {  
//    if ( err ) console.error( "Error getting boards:", err );
//    console.log(board.BoardUsers);
//  });

//Gets a boards under the account 
//  client.getBoards( function( err, boards ) {  
//     if ( err ) console.error( "Error getting boards:", err );
//     console.log(boards);
//   });

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

function getLeankitBoard(){

}

function insertPostDemoReport(event){
    if(gSheets){
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
}

function sendMsgToSlack(sender, target, msg){
    if(slackInt){
        slack.webhook({
            channel: target,
            username: sender,
            text: msg
        },  function(err, response) {
                console.log(msg);
            });
    }
}

// ******************** Validation *********************** //

function validateNewCardOnExecBoard(eventType, card){
    var validationObj = {   isCardRejected: false,
                            cardSize: true, 
                            cardUsers: true,
                            cardDueDate: true,
                            cardDescription: true };
    switch(eventType){
        case("card-move-to-board" || "card-creation"):
            if(card.size > 1){
                validationObj.cardSize = false;
                validationObj.isCardRejected = true;
            }
            if(card.AssignedUsers.length < 2){
                validationObj.cardUsers = false;
                validationObj.isCardRejected = true;
            }
            if(!card.DueDate){
                validationObj.cardDueDate = false;
                validationObj.isCardRejected = true;
            }
            if(!card.Description){
                validationObj.cardDescription = false;
                validationObj.isCardRejected = true;
            }
        return validationObj;
    }
}

// req: 1. 2 assings
//      2. Title
//      3. Description
//      4. Card Type
//      5.  



/* ---- card object -----

Active:false
ActualFinishDate:null
ActualStartDate:null
AssignedUserId:152743345
AssignedUserIds:Array[2]
AssignedUserName:"Eyal Yaniv"
AssignedUsers:Array[2]
AttachmentsCount:0
BlockReason:null
BlockStateChangeDate:null
BoardId:156116725
BoardTitle:"Execution"
CardContexts:Array[0]
CardDrillThroughBoardIds:Array[0]
CardTypeIconColor:null
CardTypeIconName:null
ClassOfServiceColorHex:null
ClassOfServiceCustomIconColor:null
ClassOfServiceCustomIconName:null
ClassOfServiceIconPath:null
ClassOfServiceId:0
ClassOfServiceTitle:null
Color:"#E5CE21"
CommentsCount:0
CountOfOldCards:0
CreateDate:"08/26/2016"
CurrentContext:null
CurrentTaskBoardId:null
DateArchived:null
Description:null
DrillThroughBoardId:null
DrillThroughCompletionPercent:null
DrillThroughProgressComplete:null
DrillThroughProgressSizeComplete:null
DrillThroughProgressSizeTotal:null
DrillThroughProgressTotal:null
DrillThroughStatistics:null
DueDate:"08/28/2016"
ExternalCardID:null
ExternalCardIdPrefix:null
ExternalSystemName:null
ExternalSystemUrl:null
GravatarLink:"fee8a942a551dc8daf6950f84718f167?s=25"
HasDrillThroughBoard:false
HasMultipleDrillThroughBoards:false
Icon:""
Id:379424830
Index:0
IsBlocked:false
IsOlderThanXDays:false
LaneId:156145202
LaneTitle:"Drop Lane"
LastActivity:"08/26/2016 01:38:23 PM"
LastAttachment:null
LastComment:null
LastMove:"08/26/2016 01:38:23 PM"
ParentBoardId:0
ParentBoardIds:Array[0]
ParentCardId:null
ParentCardIds:Array[0]
ParentTaskboardId:null
Priority:1
PriorityText:"Normal"
Size:2
SmallGravatarLink:"fee8a942a551dc8daf6950f84718f167?s=17"
StartDate:"08/26/2016"
SystemType:"Card"
Tags:null
TaskBoardCompletedCardCount:0
TaskBoardCompletedCardSize:0
TaskBoardCompletionPercent:0
TaskBoardTotalCards:0
TaskBoardTotalSize:0
Title:"test move event"
Type:Object
TypeColorHex:"#E5CE21"
TypeIconPath:"../../Content/Images/Icons/Library/help.png"
TypeId:156110140
TypeName:"Task - Cross"
Version:5
*/