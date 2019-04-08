// ~~~~~~~~~~~~~~~~ Variable Declarations

let game = {
	wordDict: [],
	word: null,
	currentLetter: null,
	guessesRemaining: 6,
}
let gb = document.getElementById('guess-box');
let url = 'https://cors-anywhere.herokuapp.com/http://app.linkedin-reach.io/words';
let fileReader = new FileReader();


updateWordDict();



// ~~~~~~~~~~~~~~~~ Function Declarations


// This gets called after the 'blob' is read into text in updateWordDict
fileReader.addEventListener('loadend', e => {
	game.wordDict = e.srcElement.result.split('\n');
	console.log(game.wordDict);
})


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