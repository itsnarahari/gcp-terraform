// ==UserScript==
// @name         The Service is Unavailable
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @include      http://onlinebooking.sand.telangana.gov.in/*
// @include      https://onlinebooking.sand.telangana.gov.in/*
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==
 
var search = "The service is unavailable";
 
(function() {
'use strict';
    if(document.body.innerHTML.indexOf(search) !=-1) {
        console.log("The service is unavailable. reloading");
        location.reload();
    }
})()