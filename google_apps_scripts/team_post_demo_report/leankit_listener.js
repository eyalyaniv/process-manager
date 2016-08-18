function doPost(req) {
  var sheets = SpreadsheetApp.openById('1XuEIQlzGGqLcoe3wXtDFcQnizQWQzdOnfZ3UWdoGTOk');
  var params = req.parameters;
  
  if(req){
     sheets.getRange('B30').setValue(new Date());
  }
  else{
    sheets.getRange('B30').setValue('Booom!!!');
  }
}

function doGet(request) {
  //var spr = SpreadsheetApp.getActiveSpreadsheet();
  //var tab = spr.getSheetByName('The Team');
  
  if(request){
   //tab.getRange('B10').setValue(request.parameters);  
  }
  else{
    //tab.getRange('B10').setValue('Request Empty');  
  }
  return true;
}