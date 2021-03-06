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
	apiSettings: {
		difficulty: 5,
		minLength: 4,
		maxLength: 10,
	}
}

let gb = document.getElementById('guess-box'),
	guessInputElem = document.getElementById('guess-input'),
	preUrl = 'https://cors-anywhere.herokuapp.com/',
	url = `${preUrl}http://app.linkedin-reach.io/words`,
	linkedInReader = new FileReader(),
	oxfordReader = new FileReader();



restartGame(game.apiSettings);




// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Event Handlers ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~



// Reset Game Defaults. This gets called after the 'blob' is read into text in restartGame
linkedInReader.addEventListener('loadend', e => {
	// Update word dictionary
	game.wordDict = e.srcElement.result.split('\n');

	// Choose random word. Put it into an array of capitalized characters: eg: ['B', 'U', 'S']
	game.word = game.wordDict[ Math.floor( Math.random() * game.wordDict.length )].toUpperCase().split('');

	if (game.word.length === 0) {
		updateErrorText('No dictionary items for given parameters. Please try adjusting the \'Game Options\'');
		return ;
	}

	// Update the 'wordReveal' array
	game.wordReveal = game.word.map(c => '');

	// Clear the 'correctlyGuessChars' Map
	delete game.correctlyGuessedChars;
	game.correctlyGuessedChars = new Map();

	// Clear the 'usedChars' Map
	delete game.usedChars;
	game.usedChars = new Map();

	// Reset the number of guesses remaining
	game.guessesRemaining = 6;
	updateGuessesRemainingText(game.guessesRemaining);

	resetSecretKeeper(game.word.length);

	document.getElementById('word-definition').style.display = 'none';

	// Add a little buffer to the 'Begin Game!' prompt. Don't overwrite if user is arleady guessing.
	setTimeout(() => {
		updateSuccessText('Begin Game!');
		document.getElementById('guess-input').style.border = '4px solid #2196f3';
		game.finished = false; // Game is now playable
	}, 800);
});


// This runs when a dictionary word is returned
// Updates the 'Definition' of the word
oxfordReader.addEventListener('loadend', e => {
	let result = JSON.parse(e.srcElement.result);

	let definition ='No dictionary entry was found';
	try {
		definition = result.results[0].lexicalEntries[0].entries[0].senses[0].definitions[0];
	} catch (err) {
		definition ='No dictionary entry was found';
	}
	document.getElementById('word-definition-item').innerText = definition;
	document.getElementById('word-definition').style.display = 'flex';
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


// ~~~ Settings Menu Event Handlers
document.getElementById('game-options-button').addEventListener('click', () => {
	document.getElementById('modal-background').style.display = 'block';
});
document.getElementById('modal-background').addEventListener('click', (e) => {
	if (e.target.id === 'modal-background') {
		document.getElementById('modal-background').style.display = 'none';
	}
});
document.getElementById('close-settings-button').addEventListener('click', () => {
		document.getElementById('modal-background').style.display = 'none';
});
document.getElementById('apply-settings-button').addEventListener('click', () => {
	document.getElementById('modal-background').style.display = 'none';
	restartGame(game.apiSettings);
});
document.getElementById('difficulty-slider').onchange = e => {
	game.apiSettings.difficulty = parseInt(e.target.value);
	let diff;
	if (game.apiSettings.difficulty < 4) {
		diff = '(easy)';
	} else if (game.apiSettings.difficulty < 8) {
		diff = '(medium)';
	} else {
		diff = '(hard)';
	}
	document.getElementById('difficulty-slider-text').innerText = `Difficulty ${game.apiSettings.difficulty} ${diff}`
};
document.getElementById('min-slider').onchange = e => {
	let v = parseInt(e.target.value);
	game.apiSettings.minLength= v;
	document.getElementById('min-slider-text').innerText = `Minimum word length ${v}`;
	if (game.apiSettings.maxLength < game.apiSettings.minLength) {
		document.getElementById('max-slider').value = e.target.value;
		document.getElementById('max-slider-text').innerText = `Maximum word length ${v}`;
		game.apiSettings.maxLength = v;
	}
};
document.getElementById('max-slider').onchange = e => {
	let v = parseInt(e.target.value);
	game.apiSettings.maxLength= v;
	document.getElementById('max-slider-text').innerText = `Maximum word length ${v}`;
	if (game.apiSettings.maxLength < game.apiSettings.minLength) {
		document.getElementById('min-slider').value = e.target.value;
		document.getElementById('min-slider-text').innerText = `Minumum word length ${v}`;s
		game.apiSettings.minLength = v;
	}
};

// Restart Button Event Handler
document.getElementById('restart-icon').onclick = () => {
	updateSuccessText('restarting game!');
	setTimeout(() => {
		document.getElementById('restart-icon').style.display = 'none';
		restartGame(game.apiSettings)
	}, 800);
}
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~



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
		handleSuccessfulGuess(c);
	} else {
		// Update unsuccessful guess
		handleUnsuccessfulGuess(c);
	}
}

function resetSecretKeeper(length) {

	// Remove 'Prior Guesses'
	let parentNode = document.getElementById('prior-guesses');
	while (parentNode.firstChild) {
		parentNode.removeChild(parentNode.firstChild);
	}

	// Remove 'Revealed Words'
	parentNode = document.getElementById('reveal-container');
	while (parentNode.firstChild) {
		parentNode.removeChild(parentNode.firstChild);
	}

	let individualWidth = 100 / length;

	// Add new empty 'Revealed words' boxes
	while (length--) {
		let child = document.createElement('div');
		child.className = 'reveal-box';
		child.style = `width:${individualWidth}%`;
		parentNode.appendChild(child);
	}
}

function updateErrorText(text) {
	document.getElementById('success-text').innerText = '';
	document.getElementById('error-text').innerText = text;
}
function updateSuccessText(text) {
	document.getElementById('error-text').innerText = '';
	document.getElementById('success-text').innerText = text;
}
function updateGuessesRemainingText(number) {
	let g = number === 1 ? 'guesses' : 'guess';
	document.getElementById('remaining-guesses').innerHTML = `<span style='font-size:100px;color:#464646;'>${number}</span> ${g} remaining`;
}

function handleUnsuccessfulGuess(c) {
	game.guessesRemaining -= 1;
	updateGuessesRemainingText(game.guessesRemaining);

	// Update the 'used' characters
	let parentNode = document.getElementById('prior-guesses'),
		child = document.createElement('p');
	child.className = 'prior-guess';
	child.innerText = c;
	parentNode.appendChild(child);

	// Handle Game Losss
	if (game.guessesRemaining === 0) {
		handleGameLoss();
	} else {
		updateErrorText(`'${c}' is an incorrect guess!`);
	}
}
function handleSuccessfulGuess(c) {
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
	// Check for WIN!
	if (!game.wordReveal.includes('')) {
		handleGameWin();
	} else {
		updateSuccessText(`'${c}' was a correct guess!`);
	}
}

// Game over Functions
function handleGameLoss() {
	document.getElementById('guess-input').style.border = '4px solid firebrick';
	let correctWord = String(game.word.join(''));
	updateErrorText(`Sorry you lose... the word was: ${correctWord}`);
	handleGameFinish();
}
function handleGameWin() {
	updateSuccessText(`YOU WIN YAHOOOO!!!!!!!`);
	document.getElementById('guess-input').style.border = '4px solid #43a047';
	handleGameFinish()
}
function handleGameFinish(){
	game.finished = true;

	// Display whole word in guessBox.
	let revealBox = document.getElementsByClassName('reveal-box');
	game.word.map((c, i) => {
		if (revealBox[i].innerText === '') {
			revealBox[i].innerHTML = `<span style="color:firebrick;">${c}</span>`;
		}
	});

	// Display the Restart Icon
	document.getElementById('restart-icon').style.display = 'block';

	// Call Oxford Dictionary's API to retrieve the definition of the word
	getWordDefinition(game.word.join(''));
}


// Gathers the word definition for the Oxford Dictionary (using my free account!)
function getWordDefinition(word) {
	word = encodeURI(word.toLowerCase().replace(' ', '_'));
	fetch(`${preUrl}https://od-api.oxforddictionaries.com/api/v1/entries/en/${word}`, {
		headers: {
			'app_id': '763c3e51',
			'app_key': '511ea021798a93d039ada325ef807ecf'
		}
	})
	.then(response => {
		if (response.status !== 200) {
			throw 'error';
		}
		let stream = response.body;
		let reader = stream.getReader();
		return collectStream(reader);
	})
	.then(stream => new Response(stream))
	.then(response => response.blob())
	.then(blob => {
		// Update the word definition
		oxfordReader.readAsText(blob);
	})
	.catch(err => {
		document.getElementById('word-definition-item').innerText = 'No dictionary entry located';
		document.getElementById('word-definition').style.display = 'flex';
	})
}


// Updates the game.wordDict with the new requested dictionary
function restartGame(options) {
	updateSuccessText('... collecting dictionary words via API');
	let difficultyString = `difficulty=${options.difficulty}`;
		minString = `minLength=${options.minLength}`;
		maxString = `maxLength=${options.maxLength}`;
		newUrl = `${url}?${difficultyString}&${minString}&${maxString}`;

	// Directed through the HerokuApp to avoid a CORS issue
	fetch(newUrl, {
		headers: {
			'Content-Type': 'text/plain;charset=UTF-8',
		}
	})
	.then(response => {
		if (response.status !== 200) {
			throw 'error';
		}
		let stream = response.body;
		let reader = stream.getReader();
		return collectStream(reader);
	})
	.then(stream => new Response(stream))
	.then(response => response.blob())
	.then(blob => {
		// Update the word Dictionary
		updateSuccessText('... updating default game settings');
		linkedInReader.readAsText(blob);
	})
	.catch(response => {
		updateErrorText('Failed to load dictionary. Please try different "Game Options"');
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
