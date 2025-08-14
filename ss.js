(function() {
    'use strict';

    if (sessionStorage.getItem('autoReloadTriggered') === 'yes') {
        console.log('[Auto-Reload] Already triggered this session. Skipping reload.');
        return;
    }

    function openUrlAt(time, url) {
        let timeParts = time.split(':'); // HH:MM:SS:MS
        let target = new Date();
        target.setHours(parseInt(timeParts[0], 10));
        target.setMinutes(parseInt(timeParts[1], 10));
        target.setSeconds(parseInt(timeParts[2], 10));
        target.setMilliseconds(parseInt(timeParts[3], 10));

        let targetTime = target.getTime();
        let now = Date.now();

        if (now >= targetTime) {
            console.log('[Auto-Reload] Target time already passed, will not reload again.');
            return;
        }

        let checkInterval = setInterval(function() {
            if (Date.now() >= targetTime) {
                clearInterval(checkInterval);
                sessionStorage.setItem('autoReloadTriggered', 'yes');
                console.log('[Auto-Reload] Time reached! Reloading page...');
                window.location.href = url;
            }
        }, 100);
    }

    // ==== SET YOUR TIME & URL HERE ====
    openUrlAt('17:03:00:000', 'https://sand.telangana.gov.in/TGSandBazaar/InnerPages/InnerHome.aspx');
})();