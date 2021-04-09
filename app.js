const APIController = (function() {
	const client_id = config.CLIENT_ID; // Your client id
	const client_secret = config.CLIENT_SECRET; // Your secret

	const _getToken = async () => {
		
		const result = await fetch('https://accounts.spotify.com/api/token', {
			method: 'POST',
			headers: {
				'Content-Type' : 'application/x-www-form-urlencoded',
				'Authorization': 'Basic ' + btoa(client_id + ':' + client_secret)
			},
			body: 'grant_type=client_credentials'
		});

		const data = await result.json();
		return data.access_token;
	}

	const _getPodcasts = async (token) => {
		let query = getRandomSearch();
		const type = 'show';
		const randomOffset = Math.floor(Math.random() * 100);
		const limit = 25;

		const result = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=${type}&offset=${randomOffset}&market=US&limit=${limit}`, {
			method: 'GET',
			headers: {'Authorization' : 'Bearer ' + token}
		});

		const data = await result.json();
		return data.shows.items;
	}

	const getRandomSearch = () => {
		// A list of all characters that can be chosen.
		const characters = 'abcdefghijklmnopqrstuvwxyz';

		// Gets a random character from the characters string.
		const randomCharacter = characters.charAt(Math.floor(Math.random() * characters.length));
		let randomSearch = '';

		// Places the wildcard character at the beginning, or both beginning and end, randomly.
		switch (Math.round(Math.random())) {
			case 0:
				randomSearch = randomCharacter + '%20';
				break;
			case 1:
				randomSearch = '%20' + randomCharacter + '%20';
			break;
		}

		return randomSearch;
	}

	const _getHearsTheThing = async (token) => {
		const id = '4RHOf5fo4rw1cfDESOdvo2';
		const result = await fetch(`https://api.spotify.com/v1/shows/${id}?market=US`, {
			method: 'GET',
			headers: {
				'Authorization': 'Bearer ' + token
			}
		});

		const data = await result.json();
		return data;
	}

	return {
		getToken() {
			return _getToken();
		},

		getPodcasts(token) {
			return _getPodcasts(token);
		},

		getHearsTheThing(token) {
			return _getHearsTheThing(token);
		}
	}
})();


const UIController = (function() {

	return {
		createRandomizer(podcast, index, length) {
			let delay = (10 * index) * index;
			const isFinalLoop = index == length-1;
			setTimeout(function() { this.displaySingleRandomizerPodcast(podcast, isFinalLoop) }.bind(this), delay);
		},

		displaySingleRandomizerPodcast(podcast, isFinalLoop) {
			this.resetPodcasts();
			this.createPodcast(podcast);
			if (isFinalLoop) {
				const podcastsDiv = document.querySelector('.podcast-list');
				podcastsDiv.style.transitionDuration = '0.2s';
				podcastsDiv.style.transform = 'scale(1.2)';

				setTimeout(() => {
					podcastsDiv.style.transitionDuration = '0.2s';
					podcastsDiv.style.transform = 'scale(1)';
				}, 200);


				document.querySelector('#recommend').style.display = 'block';
			}
		},

		createPodcast(podcast) {
			const podcastsDiv = document.querySelector('.podcast-list');
			const html = 
			`
 			<div class="card" style="width: 18rem;">
	 			<div class="card-body">
					<h5 class="card-title">${podcast.name}</h5>
				</div>
	 			<a href=${podcast.uri}>
					<img src=${podcast.images[1].url} class="card-img-top" alt="...">
				</a>
				<div class="card-body">
			    	<p class="card-text">${podcast.description}</p>
			  	</div>
			</div>
			`;

			podcastsDiv.insertAdjacentHTML('beforeend', html);
		},

		resetPodcasts() {
			document.querySelector('.podcast-list').innerHTML = '';
		},

		storeToken(value) {
			document.querySelector('#hidden_token').value = value;
		},

		getStoredToken() {
			return {
				token: document.querySelector('#hidden_token').value
			}
		}
	}

})();

const AppController = (function(UIController, APIController) {

	const loadApp = async () => {
		const token = await APIController.getToken();
		UIController.storeToken(token);
	}

	document.querySelector('#recommend').addEventListener('click', async (e) => {
		e.preventDefault();

		document.querySelector('#recommend').style.display = 'none';
		const token = UIController.getStoredToken().token;
		const podcasts = await APIController.getPodcasts(token);
		const htt = await APIController.getHearsTheThing(token);
		podcasts.push(htt);
		podcasts.forEach((pc, index) => UIController.createRandomizer(pc, index, podcasts.length));
	});

	return {
		init() {
			loadApp();
		}
	}

})(UIController, APIController);

AppController.init();