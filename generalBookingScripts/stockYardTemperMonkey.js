// ==UserScript==
// @name         Yard Loader
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Loads yard logic dynamically
// @match        https://onlinebooking.sand.telangana.gov.in/*
// @author       You
// @include      https://onlinebooking.sand.telangana.gov.in/*
// @grant        none
// ==/UserScript==

(function () {
    console.log("Yard Loader running... Loading stockYard.js");
    const script = document.createElement("script");
    script.src = "https://itsnarahari.github.io/gcp-terraform/stockYard.js";
    document.body.appendChild(script);
})();
