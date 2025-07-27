(function () {
  console.log(
    "Stock Yard script loaded successfully from GitHub and running..."
  );
  document.getElementsByClassName("Dropdown")[0].value = 24;
  PopulateGrid(24);
  console.log("Dropdown value set to 24 and grid populated.");

  var intId = setInterval(function () {
    for (var i = 0; i < 30; i++) {
      var data =
        document.getElementsByClassName("GridviewScrollItem")[i].cells[2]
          .innerHTML;
      if (data.indexOf("GP Palli SBAB5(2025)") != -1) {
        $("input[type='radio']")[i].click();
        clearInterval(intId);
        break;
      }
    }
  }, 1500);
})();
