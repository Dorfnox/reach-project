// ~~~~~~~~~~~~~~~~ Variable Declarations

// Initialize initial game object
let game = {
	wordDict: [],
	word: [],
	wordReveal: [],
	correctlyGuessedChars: new Map(),
	usedChars: new Map(),
	guessesRemaining: 6,
	finished: true,		// Initialize to true to prevent game starting before words are loaded
}

let gb = document.getElementById('guess-box'),
	guessInputElem = document.getElementById('guess-input'),
	url = 'https://cors-anywhere.herokuapp.com/http://app.linkedin-reach.io/words',
	fileReader = new FileReader();



updateWordDict();




// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Event Handlers ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~



// Reset Game Defaults. This gets called after the 'blob' is read into text in updateWordDict
fileReader.addEventListener('loadend', e => {
	// Update word dictionary
	game.wordDict = e.srcElement.result.split('\n');

	// Choose random word. Put it into an array of capitalized characters: eg: ['B', 'U', 'S']
	game.word = game.wordDict[ Math.floor( Math.random() * game.wordDict.length )].toUpperCase().split('');

	// Update the 'wordReveal' array
	game.wordReveal = game.word.map(c => '');

	// Clear the 'correctlyGuessChars' Map
	delete game.correctlyGuessedChars;
	game.correctlyGuessedChars = new Map();

	// Clear the 'usedChars' Map
	delete game.usedChars;
	game.usedChars = new Map();

	// update the number of guesses remaining
	updateRemainingGuesses(6);

	resetSecretKeeper(game.word.length);

	// Add a little buffer to the 'Begin Game!' prompt. Don't overwrite if user is arleady guessing.
	setTimeout(() => {
		updateSuccessText('Begin Game!');
		document.getElementById('guess-input').style.border = '4px solid #2196f3';
		game.finished = false; // Game is now playable
	}, 800);
});


// Handles each key given to the Guess Input
guessInputElem.addEventListener('keydown', e => {
	// Needed to prevent 'double-letter' entry
	e.preventDefault()

	// Don't do anything if the game is over
	if (game.finished) {
		return ;
	}

	// Handle 'Enter' key press
    if (e.keyCode === 13) {
        submitCharacter(guessInputElem.value);
	}

	// Handle 'Backspace'
	else if (e.keyCode === 8) {
		guessInputElem.value = '';
	}

	// Handle any other valid character
	else if (e.keyCode > 64 && e.keyCode < 91 ) {
		guessInputElem.value = String(e.key).toUpperCase();
	}
});

// Handle opening of settings menu
document.getElementById('game-options-button').addEventListener('click', () => {
	document.getElementById('modal-background').style.display = 'block';
});

// Handle closing of settings menu
document.getElementById('modal-background').addEventListener('click', (e) => {
	if (e.target.id === 'modal-background') {
		document.getElementById('modal-background').style.display = 'none';
	}
});




// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Function Declarations ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


function submitCharacter(c) {
	if (c === '' || !c) {
		updateErrorText(`Please submit a valid character!`) ;
		return ;

	} else if (game.usedChars.has(c)) {
		updateErrorText(`You have already used '${c}'!`);
		return ;

	}

	// Add character to the 'used' Map
	game.usedChars.set(c, 1);

	// Check if char is in the word
	if (game.word.includes(c)) {
		// Always clear Error text
		updateErrorText('');

		updateSucessfulGuess(c);

		// Check for WIN!
		if (!game.wordReveal.includes('')) {
			handleGameWin();
		} else {
			updateSuccessText(`'${c}' was a correct guess!`);
		}

	} else {
		// Always clear the success text
		updateSuccessText('');

		// Update remaining guesses
		updateRemainingGuesses(game.guessesRemaining - 1);

		if (game.guessesRemaining === 0) {
			handleGameLoss();
		} else {
			updateErrorText(`'${c}' is an incorrect guess!`);
		}
	}
}

function resetSecretKeeper(length) {
	let parentNode = document.getElementById('reveal-container');

	// Remove any previous children
	while (parentNode.firstChild) {
		parentNode.removeChild(parentNode.firstChild);
	}

	let individualWidth = 100 / length;

	// Add new empty boxes
	while (length--) {
		let child = document.createElement('div');
		child.className = 'reveal-box';
		child.style = `width:${individualWidth}%`;
		parentNode.appendChild(child);
	}
}

function updateErrorText (text) {
	document.getElementById('error-text').innerText = text;
}

function updateSuccessText (text) {
	document.getElementById('success-text').innerText = text;
}

function updateRemainingGuesses(n) {
	game.guessesRemaining = n;
	document.getElementById('remaining-guesses').innerHTML = `<span style='font-size:100px;color:#464646;'>${n}</span> guesses remaining`;
}

function updateSucessfulGuess(c) {
	// Add to the correctly guessed-word set
	game.correctlyGuessedChars.set(c, 1);

	// Reveal items in the 'wordReveal' array
	let revealBoxElems = document.getElementsByClassName('reveal-box');
	game.word.map((ch, i) => {
		if (game.correctlyGuessedChars.has(ch)) {
			game.wordReveal[i] = ch;
			revealBoxElems[i].innerText = ch;
		}
	});
}

function handleGameLoss() {
	game.finished = true;
	document.getElementById('guess-input').style.border = '4px solid firebrick';
	let correctWord = String(game.word.join(''));
	updateErrorText(`Sorry you lose... the word was: ${correctWord}`);
}

function handleGameWin() {
	updateSuccessText(`YOU WIN YAHOOOO!!!!!!!`);
	document.getElementById('guess-input').style.border = '4px solid #43a047';
	game.finished = true;
}

function getURLParamsBasedOnSettings(settings) {

};


// Updates the game.wordDict with the new requested dictionary
function updateWordDict(options, callbackFunc) {
	updateSuccessText('... collecting dictionary words via API');

	// Directed through the HerokuApp to avoid a CORS issue
	fetch(`${url}`, {
		headers: {
			'Content-Type': 'text/plain;charset=UTF-8',
		}
	})
	.then(response => {
		let stream = response.body;
		let reader = stream.getReader();
		return collectStream(reader);
	})
	.then(stream => new Response(stream))
	.then(response => response.blob())
	.then(blob => {
		// Update the word Dictionary
		updateSuccessText('... updating default game settings');
		fileReader.readAsText(blob);
	})
	.catch(response => {
		updateErrorText('Failed to load dictionary for some reason. Please DEBUG:\n', response);
	});
}


// Collects the entire stream given by the streamReader
function collectStream(streamReader) {
	return new ReadableStream({
		start(controller) {
			push();
			function push() {
				return streamReader.read().then(({ done, value }) => {
					if (done) {
						controller.close();
						return ;
					}
					controller.enqueue(value);
					push();
				});
			};
		}
	})
}