gameTimer = 60.0000;
gameScore = 0;
timerCountdown = undefined;
const gameEnabled = () => Number(gameTimer) !== 0;

$(window).on("load", () => {
    /**
     * Causes the timer remaining value to flicker, giving the player an urgency to maximize their score and commit to enjoying the game.
     * @return {void}
     */
    const urgencyBlinker = setInterval(() => {
        $('#time').fadeOut(300).fadeIn(250)
    }, 550);
    /**
     * Disables the game and modifies DOM to remove event listeners associated with playing the game. The countdown timer is stopped and reset to zero, while validating the user's score by sending a POST to the server.
     * @return {void}
     */
    const disableGame = () => {
        gameTimer = 0;
        validateGame();
        stopTimer();
        $("td#letter")
            .off("click")
            .attr('disabled', 'disabled')
            .css({cursor: 'not-allowed' })
            .change();
        $("#resetText")
            .off("click")
            .css({cursor: 'not-allowed'})
            //.attr('disabled', 'disabled')
            //.change()
            ;
        $("input#currentText")
            .val('')
            .attr({ disabled: 'disabled', placeholder: 'Game Completed!' })
            .css({ "background-color": "darkgreen", "color": "blue", "font-style": "none", "border": "2px solid green",cursor: "not-allowed" })
            .change();
        $("#validate")
            .off("click")
            .attr('disabled', 'disabled')
            .css({cursor: 'not-allowed'})
            .change()
            ;
        /**
         * Blinker used to modify the resetText button and convert it into a Play Again button. This button will reset the page and allow the server to initialize a new board.
         */
        setInterval(() => {
            $('#resetText').fadeOut(1000).fadeIn(500)
        }, 1400);
        $("#resetText")
            .attr({ value: 'Again?' })
            .css({ 'cursor': 'pointer'})
            .on("click", () => window.location.href = "/");
    };
    /**
     * setInterval timer which modifies DOM to display seconds remaining to the user, to a fixed decimal point of 3. To add more variance, a random number is applied so that the timer does not display the exact same decimal numbers during countdown.
     * @return {void}
     */
    const timerCountdown = setInterval(() => {
        gameTimer -= 0.066;
        if (gameTimer <= 0) {
            disableGame();
            return;
        }
        $("#time").text(Number(Math.random()*-0.000036 + gameTimer).toFixed(3));
    }, 66);
    /**
     * Clears the timers set by timer countdown and blinkers. Modifies DOM to display "Finished!" to the user.
     * @return {void}
     */
    function stopTimer() {
        clearInterval(urgencyBlinker);
        clearInterval(timerCountdown);
        $("#time").text("Finished!").change();
    }

    //Automatically set timer value to globally set variable.
    $("#time").text(gameTimer).change();

    //Game input is enabled while game is enabled. If gameTimer is 0, then the input will be ignored.
    $("td#letter").on("click", e => {
        if (gameEnabled() === false)
            return;
        $("input#currentText")
            .val($("input#currentText")
                .val() +
                $(e.target).text().toLowerCase()
            );
        resetStyles();
    });
    //When validate button is pressed, input string is checked for any length and then lower cased before it sent to the server in a validation POST query.
    $("#validate").on("click", (e) => {
        e.preventDefault();
        if (gameEnabled() === false || 
            $("input#currentText").val().length === 0)
            return;
        allLowerCaseText();
        //$("input#currentText").val()
        validateAnswer($("input#currentText").val());
        $("input#currentText").attr('placeholder', "Type or Tap letters!");
    });
    //Reset text button resets the value of the input text box as well as the style, reverting any previous game messages displayed to the player.
    $("#resetText").on("click", (e) => {
        e.preventDefault();
        resetValue();
        resetStyles();
    });
});
/**
 * Validates a word by submitting the word to the server. Waits for reply from the server and receives a response, then adds the score based on a successful word completion. The server also stores this word in a list and checks for duplicate words from this point on.
 * @param {String} text - User input word to check for uniqueness and validation
 * @return {void}
 */
const validateAnswer = async (text) =>
    await axios.post("/validate",
        { word: text }, { 
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }).then(response => {
            if (parseResult(response.data))
                addScore(parseWordLength(text));
        }).catch(exception => { console.log(exception) });

/**
 * Validates the game by submitting the score to the server. Waits for the reply from the server if the game has been the highest score and then updates the DOM.
 * @return {void}
 */
const validateGame = async () =>
    await axios.post("/validate", {
        headers: { 'Content-Type': 'application/json' },
        score: gameScore
    }).then(response => {
        if(response.data == "NEW_RECORD")
            $('#highScore').text(gameScore).change();
    }).catch(exception => { console.log(exception) });

const parseWordLength = (word) => {
    return word.trim().length;
}
/**
 * Iterates the response from server and provides associated responses to the user by calling methods which modify the DOM
 * @param {String} result - Response received from server
 * @return {Boolean}
 */
const parseResult = (result) => {
    switch (result) {
        case 'ok':
            resetValue();
            sendSuccessReset("Good!")
            return true;
        case 'not-word':
            sendHazardReset("Not a word!");
            return false;
        case 'not-on-board':
            sendHazardReset("Not on board!");
            return false;
        case 'duplicate':
            sendHazardReset("Already submitted!");
            return false;
        default:
            alert("Unexpected result: " + result);
            return false;
    }
};
/**
 * Updates the DOM so that the input text styles used to provide Hazard feedback on attempts. Input text is reset to empty and placeholder applied with input from message.
 * @param {String} message - Hazard Text to send to user
 * @return {void}
 */
const sendHazardReset = (message) => {
    $("input#currentText")
        .css({ "background-color": "yellow", "color": "red", "font-style": "bold", "border-bottom": "2px dotted red" })
        .val('')
        .attr('placeholder', message)
        .change();
}
/**
 * Updates the DOM so that the input text styles used to provide Positive feedback on attempts. Input text is reset to empty and placeholder applied with input from message.
 * @param {String} message - Hazard Text to send to user
 * @return {void}
 */
const sendSuccessReset = (message) => {
    $("input#currentText")
        .css({ "background-color": "green", "color": "teal", "font-style": "bold", "border-bottom": "2px solid green" })
        .val('')
        .attr('placeholder', message)
        .change();
}

/**
 * Updates the DOM so that the input text styles will be reset to default
 * The placeholder text will also revert to default since it is used for feedback on attempts.
 * @param {Number} amount - Amount of score that will increment to the gameScore global object.
 * @return {void}
 */
const addScore = async (amount) => {
    gameScore += amount;
    $('#score')
        .text(gameScore)
        .change();
    resetValue();
    resetStyles();
};
/**
 * Updates the DOM so that the input text styles will be reset to default
 * The placeholder text will also revert to default since it is used for feedback on attempts.
 * @return {void}
 */
const resetStyles = async () => {
    $("input#currentText").css({
        "background-color": "white",
        "color": "black",
        "font-style": "normal",
        "border-bottom": "0px dotted red"
    })
        .attr('placeholder', "Type or Tap letters!");
};
/**
 * Updates the DOM so that the input text will be reset
 * @return {void}
 */
const resetValue = async () => {
    $("input#currentText").val('');
};
/**
 * Updates the DOM so that the input text will be re-applied in all lowercase.
 * @return {void}
 */
const allLowerCaseText = async () =>
    $("input#currentText")
        .val($("input#currentText").val().toLowerCase())
        .change();