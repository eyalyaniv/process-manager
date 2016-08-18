function injectFormulas() {
  var ownersSheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  var formulaSheetContent = collectFormulas();
  
  for(var i=3; i<ownersSheets.length; i++){ //i starts from 3 to skip first 3 tabs which are not owners tabs
    for(var j=0; j<formulaSheetContent.length; j++){
      var cellToInjectFormula = ownersSheets[i].getRange(formulaSheetContent[j][1]);
      cellToInjectFormula.setFormula(formulaSheetContent[j][2]);
    }
  }
}

function collectFormulas(){
  var spr = SpreadsheetApp.getActiveSpreadsheet();
  var tab = spr.getSheetByName('Formulas');
  var formulaSheetContent = tab.getRange('A1:C19').getValues();  
  return formulaSheetContent;
}
