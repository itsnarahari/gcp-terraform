(function () {
  console.log(
    "Stock Yard script loaded successfully from GitHub and running..."
  );
  document.getElementsByClassName("Dropdown")[0].value = 45;
  PopulateGrid(45);
  console.log("Dropdown value set to 45 and grid populated.");

  var intId = setInterval(function () {
    for (var i = 0; i < 30; i++) {
      var data =
        document.getElementsByClassName("GridviewScrollItem")[i].cells[2]
          .innerHTML;
      if (data.indexOf("RamannagudemSBA(2025)") != -1) {
        $("input[type='radio']")[i].click();
        clearInterval(intId);
        break;
      }
    }
  }, 1500);
})();
