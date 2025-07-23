// ==UserScript==
// @name         Auto Redirect to Sand Telangana at 8:30 PM
// @namespace    https://narahari-redirect
// @version      1.1
// @description  Redirect to sand site at exactly 8:30 PM
// @match        https://ssotp3.online/*
// @grant        none
// ==/UserScript==

(function () {
    const targetHour = 20; // 8 PM
    const targetMinute = 30;

    const checkTimeAndRedirect = () => {
        const now = new Date();
        if (now.getHours() === targetHour && now.getMinutes() === targetMinute) {
            window.location.href = "https://sand.telangana.gov.in/TGSandBazaar/Masters/OuterHome.aspx";
        }
    };

    setInterval(checkTimeAndRedirect, 1000); // check every second
})();
