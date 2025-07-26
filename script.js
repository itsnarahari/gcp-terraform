(function() {
document.getElementsByClassName('Dropdown')[0].value = 24;
  PopulateGrid(24);

var intId = setInterval(function(){    
for(var i=0;i<30;i++){
    var data = document.getElementsByClassName("GridviewScrollItem")[i].cells[2].innerHTML;
    if( data.indexOf("Veerapuram De-Siltation(2025)") != -1) {        
        $("input[type='radio']")[i].click();
        clearInterval(intId);
        break;
    }

}},1500);
})();
