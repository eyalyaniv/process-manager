//********************* Demo reports to query ************************************

var demoReportsSheets = ['client', 'gameEngine', 'gameManagment', 'devOps'];

var demoReportsSheetId = {'client': '1qafe-NXc0n4kzkIeDsPziFcv2toEZIrYbqF6_6vekYY', 
                          'gameEngine': '1HBhFtj91dT1v4q71VYfF_Xn_X2lt7mqzaZfUBQtkd4g', 
                          'gameManagment': '1XuEIQlzGGqLcoe3wXtDFcQnizQWQzdOnfZ3UWdoGTOk',
                          'devOps': '1pg7FqJBXhidIg4bSNMshxLzV1VA-eV7DqGaUytot3MQ'};

var demoReportsSheetName = {'client': 'clientDailyDemoReport', 
                            'gameEngine': 'GEPostDemoReport', 
                            'gameManagment': 'GMSPostDemoReport',
                            'devOps': 'devOpsDailyDemoReport'};

var pipeDataOwnerOffset = 0;
var pipeDataNameOffset = 1;
var pipeDataDemoToOffset = 2;
var pipeDataTimeOffset = 3;
var pipeDataLinkOffset = 4;
var pipeDataLOEOffset = 5;
var pipeDataNumOfDemoOffset = 6;
var pipeDataOverdueOffset = 7;
var pipeDataReasonOffset = 8;
var pipeDataIsProcessedOffset = 9;


//************************************************************//
//************    Start flow ->> trigger here   **************//
//************************************************************//
function queryDemoReports(){
  //var start = new Date();
  Logger.clear();
  
  var currentRunQueryReport = switchToNextDemoReport(); //Each scipt run demo reports are being cycled 
  Logger.log("Currently processing: " + currentRunQueryReport + '...');

  var spr = SpreadsheetApp.getActiveSpreadsheet();
  var tab = spr.getSheetByName('DB');
  //var dbKeys = tab.getRange('A1:A500').getValues();
  //var lastQueriedPostDemoReport = dbKeys
  
  var reportPipeData = getDemoReportPipeData(demoReportsSheetId[currentRunQueryReport], demoReportsSheetName[currentRunQueryReport]);

  var ownersSheets = getOwnersSheets();      //Gets the "owners" which are the tabs names in the "pipe stats" sheet.
  
  extractPipeDataFromDailyDemoReport(reportPipeData, ownersSheets, demoReportsSheetId[currentRunQueryReport], demoReportsSheetName[currentRunQueryReport]);
}

//------------------------------------------------------------------------------------------------------------------------------------------------------------

function extractPipeDataFromDailyDemoReport(pipeData, ownersSheets, sheetID, sheetName){
  
  var start = new Date();
  var ownersNextInsertLineArray = [];
  
  for(var i=1; i<pipeData.length; i++){ //Loop through every line in the post demo report, extract the "owner" and search it's index in the ownerSheets array to know in what tab to insert the row.   
    
    if(pipeData[i][pipeDataIsProcessedOffset] !== 'Processed' && pipeData[i][pipeDataIsProcessedOffset] !== 'Skipped'){
      var owner = pipeData[i][pipeDataOwnerOffset];        // This is the owner of the current row in the server daily report
      var j=0;  
      
      if (isTimeUp(start)) {
        Logger.log("Time up");
        break;
      }
    
      while(owner !== ownersSheets[j].getName()){ //look for the current row's owner index in the ownerSheets (tabs) array.
        j++;
        if(j === ownersSheets.length){
          if(owner === ""){
            return;
          }
          else{
            declareSourceRowAsSkipped(i+1, sheetID, sheetName);
            return;
          }
        }
      }
      ownersNextInsertLineArray = findNextInsertRowForEachOwner(ownersSheets); //Go over each tab-sheet (owner) and find the next empty line.
      setValuesInOwnersTab(i, owner, ownersNextInsertLineArray, pipeData);
      declareSourceRowAsProcessed(i+1, sheetID, sheetName);
      Logger.log("Owner Data of: " + owner + " found in sheet: " + ownersSheets[j].getName() + " insert at row: " + 'A' + ownersNextInsertLineArray[owner] /*+ " with value: " + serverPipeData[i][4]*/);  
    } 
  }
}

function declareSourceRowAsProcessed(rowIndex, sheetID, sheetName){
    var spr = SpreadsheetApp.openById(sheetID).getSheetByName(sheetName);
    spr.getRange('J' + rowIndex).setValue('Processed');  
}

function declareSourceRowAsSkipped(rowIndex, sheetID, sheetName){
    var spr = SpreadsheetApp.openById(sheetID).getSheetByName(sheetName);
    spr.getRange('J' + rowIndex).setValue('Skipped');  
}

function setValuesInOwnersTab(index, owner, ownersNextInsertLineArray, pipeData){
    var spr = SpreadsheetApp.getActiveSpreadsheet();
    var tab = spr.getSheetByName(owner);
      
    tab.getRange('A' + ownersNextInsertLineArray[owner]).setValue(pipeData[index][pipeDataLinkOffset]);  
    tab.getRange('B' + ownersNextInsertLineArray[owner]).setValue(pipeData[index][pipeDataLOEOffset]);
    tab.getRange('C' + ownersNextInsertLineArray[owner]).setValue(pipeData[index][pipeDataNumOfDemoOffset]);
    tab.getRange('D' + ownersNextInsertLineArray[owner]).setValue(pipeData[index][pipeDataOverdueOffset]);
}

function findNextInsertRowForEachOwner(ownersSheets){
  var obj = {};

  for(var i=0; i < ownersSheets.length; i++){
    var nextEmptyRow = getFirstEmptyRowByColumnArrayInCurrentSheetInTabByName(ownersSheets[i].getName());
    //Logger.log("Owner: " + ownersSheets[i].getName() + " next empty row is: " + nextEmptyRow);
    var owner = ownersSheets[i].getName();
    obj[owner] = nextEmptyRow;
  }
  return obj;
}

function getDemoReportPipeData(demoReportSheetId, demoReportSheetName){
  var demoReportData = SpreadsheetApp.openById(demoReportSheetId).getSheetByName(demoReportSheetName).getRange('A1:J500').getValues(); 
  return demoReportData;
}

function getOwnersSheets(){
  var ownersSheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  return ownersSheets;
}

function getFirstEmptyRowByColumnArrayInCurrentSheetInTabByName(tabName) {
  var spr = SpreadsheetApp.getActiveSpreadsheet();
  var tab = spr.getSheetByName(tabName);
  var column = tab.getRange('A:A');
  var values = column.getValues(); 
  var ct = 0;
  while ( values[ct] && values[ct][0] != "" ) {
    ct++;
  }
  return (ct+1);
}

function getFirstEmptyRowByColumnArrayInExternalSheet() {
  var spr = SpreadsheetApp.openById('1vDvkksBO9AB6UZPlZ0CXH4Ih_8AvU01lDdw5WkemEvM').getSheetByName('serverDailyDemoReport'); 
  var column = spr.getRange('A:A');
  var values = column.getValues(); // get all data in one call
  var ct = 0;
  while ( values[ct] && values[ct][0] != "" ) {
    ct++;
  }
  return (ct+1);
}

function isTimeUp(start) {
  var now = new Date();
  return now.getTime() - start.getTime() > 240000; // 4 minutes
}

function switchToNextDemoReport(){
  var scriptProperties = PropertiesService.getScriptProperties(); //Gets the "script" level key:value stored properties 
  var currentRunQueryReport = scriptProperties.getProperties();
  //scriptProperties.setProperty('last_demo_report_query', 'client');

  for(var i=0; i<demoReportsSheets.length; i++){ //Cycle through demo report sheets every execution of the script.
    if(currentRunQueryReport["last_demo_report_query"] === demoReportsSheets[i]){
      if(i+1 < demoReportsSheets.length){
        currentRunQueryReport["last_demo_report_query"] = demoReportsSheets[i+1];
        scriptProperties.setProperty('last_demo_report_query', currentRunQueryReport["last_demo_report_query"]);
        break;
      }
      else{
        currentRunQueryReport["last_demo_report_query"] = demoReportsSheets[0];
        scriptProperties.setProperty('last_demo_report_query', currentRunQueryReport["last_demo_report_query"]);
        break;
      }
    }
  }
  return currentRunQueryReport["last_demo_report_query"];
}



