(function () {
    const targetHour = 20;
    const targetMinute = 30;
    const targetSecond = 0;

    const checkTimeAndRedirect = () => {
        const now = new Date();
        if (
            now.getHours() === targetHour &&
            now.getMinutes() === targetMinute &&
            now.getSeconds() === targetSecond
        ) {
            clearInterval(intervalId); // Stop further checks
            window.location.href = "https://onlinebooking.sand.telangana.gov.in/Masters/Home.aspx";
        }
    };

    const intervalId = setInterval(checkTimeAndRedirect, 200); // 200 ms for better precision
})();
