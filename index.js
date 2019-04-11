// ~~~~~~~~~~~~~~~~ Variable Declarations

let game = {
	wordDict: [],
	word: null,
	currentLetter: null,
	// Initialize default settings
	settings: {
		guessesRemaining: 6,
	}
}
let gb = document.getElementById('guess-box'),
	guessInputElem = document.getElementById('guess-input'),
	url = 'https://cors-anywhere.herokuapp.com/http://app.linkedin-reach.io/words',
	fileReader = new FileReader();


updateWordDict();



// ~~~~~~~~~~~~~~~~ Event Listeners


// This gets called after the 'blob' is read into text in updateWordDict
fileReader.addEventListener('loadend', e => {
	// Update word dictionary
	game.wordDict = e.srcElement.result.split('\n') ;
	game.word = game.wordDict[ Math.floor( Math.random() * game.wordDict.length )];
});

guessInputElem.addEventListener('keydown', e => {
	e.preventDefault()								// Needed to prevent 'double-letter' entry
    if (e.keyCode === 13) {							// Handle 'Enter' key press
        submitCharacter();
	}
	else if (e.keyCode === 8) {						// Handle 'Backspace'
		guessInputElem.value = '';
	}
	else if (e.keyCode > 64 && e.keyCode < 91 ) {	// Handle any other valid character
		guessInputElem.value = String(e.key).toUpperCase();
	}
});

// ~~~~~~~~~~~~~~~~ Function Declarations

function submitCharacter() {

}

function getURLParamsBasedOnSettings(settings) {

};


// Updates the game.wordDict with the new requested dictionary
function updateWordDict(options, callbackFunc) {
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
		fileReader.readAsText(blob);
	})
	.catch(response => {
		console.log("ERROR\n", response);
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