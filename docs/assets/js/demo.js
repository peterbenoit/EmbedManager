console.log('Demo.js loaded');

const embedTypeBtns = document.querySelectorAll('.embed-type-btn');
const demoEmbed = document.getElementById('demo-embed');
const codeDisplay = document.getElementById('demo-code-display');

console.log('Found elements:', {
	buttons: embedTypeBtns.length,
	demoEmbed: !!demoEmbed,
	codeDisplay: !!codeDisplay
});

if (!embedTypeBtns.length || !demoEmbed || !codeDisplay) {
	console.warn('Demo elements not found - demo functionality disabled', {
		buttons: embedTypeBtns.length,
		demoEmbed: !!demoEmbed,
		codeDisplay: !!codeDisplay
	});
}

const embedConfigs = {
	youtube: {
		src: 'https://www.youtube.com/embed/v6hWq0UT3yo',
		title: 'YouTube Demo Video',
		width: '100%',
		height: '315px'
	},
	vimeo: {
		src: 'https://player.vimeo.com/video/363802890',
		title: 'Vimeo Demo Video',
		width: '100%',
		height: '315px',
		appId: '58479'
	},
	'twitch-live': {
		src: 'https://player.twitch.tv/?channel=monstercat',
		title: 'Twitch Live Stream Demo',
		type: 'twitch',
		width: '100%',
		height: '315px'
	},
	'twitch-clip': {
		src: 'https://clips.twitch.tv/embed?clip=SleepyGiftedPeppermintNerfRedBlaster-KbkBXYt3lOk3jy8-',
		title: 'Twitch Clip Demo',
		type: 'twitch',
		width: '100%',
		height: '315px'
	},
	'twitch-vod': {
		src: 'https://player.twitch.tv/?video=2094739091',
		title: 'Twitch VOD Demo',
		type: 'twitch',
		width: '100%',
		height: '315px'
	},
	codepen: {
		src: 'https://codepen.io/team/codepen/embed/preview/PNaGbb',
		title: 'CodePen Demo',
		width: '100%',
		height: '400px',
		themeId: 'light',
		defaultTab: 'html,result'
	},
	website: {
		src: 'https://www.peterbenoit.com',
		title: 'Peter Benoit - Website Demo',
		width: '100%',
		height: '400px'
	}
};

console.log('Embed configs loaded:', Object.keys(embedConfigs));

function generateHtmlCode(type, config) {
	console.log('Generating HTML code for:', type, config);

	const embedManagerType = config.type || type;

	let attributes = `data-type="${embedManagerType}"
     data-src="${config.src}"
     data-title="${config.title}"
     data-width="${config.width}"
     data-height="${config.height}"`;

	if (config.themeId) {
		attributes += `
     data-theme-id="${config.themeId}"`;
	}
	if (config.defaultTab) {
		attributes += `
     data-default-tab="${config.defaultTab}"`;
	}
	if (config.appId) {
		attributes += `
     data-app-id="${config.appId}"`;
	}

	return `<div class="embed-container"
     ${attributes}>
    <p>Loading ${config.title}...</p>
</div>`;
}

function updateDemo(type) {
	console.log('Updating demo to type:', type);

	const config = embedConfigs[type];
	if (!config) {
		console.error('No config found for type:', type);
		return;
	}

	if (!demoEmbed) {
		console.error('Demo embed element not found');
		return;
	}

	console.log('Using config:', config);

	const existingIframe = demoEmbed.querySelector('iframe');
	if (existingIframe) {
		console.log('Removing existing iframe');
		existingIframe.remove();
	}

	console.log('Setting attributes on demo embed');
	const embedManagerType = config.type || type;
	demoEmbed.setAttribute('data-type', embedManagerType);
	demoEmbed.setAttribute('data-src', config.src);
	demoEmbed.setAttribute('data-title', config.title);
	demoEmbed.setAttribute('data-width', config.width);
	demoEmbed.setAttribute('data-height', config.height);

	if (config.themeId) {
		demoEmbed.setAttribute('data-theme-id', config.themeId);
	} else {
		demoEmbed.removeAttribute('data-theme-id');
	}

	if (config.defaultTab) {
		demoEmbed.setAttribute('data-default-tab', config.defaultTab);
	} else {
		demoEmbed.removeAttribute('data-default-tab');
	}

	if (config.appId) {
		demoEmbed.setAttribute('data-app-id', config.appId);
	} else {
		demoEmbed.removeAttribute('data-app-id');
	}

	demoEmbed.innerHTML = `<p>Loading ${config.title}...</p>`;
	console.log('Reset demo embed content');

	if (codeDisplay) {
		const htmlCode = generateHtmlCode(type, config);
		codeDisplay.textContent = htmlCode;
		console.log('Updated code display');

		if (window.Prism && window.Prism.highlightElement) {
			console.log('Re-highlighting code with Prism');
			Prism.highlightElement(codeDisplay);
		}
	}

	console.log('Checking for EmbedManager...');
	if (window.EmbedManager) {
		console.log('EmbedManager found:', window.EmbedManager);

		if (typeof window.EmbedManager.processContainer === 'function') {
			console.log('Calling EmbedManager.processContainer() for the demo embed');
			window.EmbedManager.processContainer(demoEmbed);
		} else if (typeof window.EmbedManager.init === 'function') {
			console.warn('EmbedManager.processContainer not found, falling back to init(). This might not correctly update the dynamic demo embed.');
			window.EmbedManager.init();
		} else {
			console.log('No suitable EmbedManager method found (processContainer or init), trying manual DOMContentLoaded trigger');
			const event = new Event('DOMContentLoaded');
			document.dispatchEvent(event);
		}
	} else {
		console.warn('EmbedManager not found on window object');
	}
}

if (embedTypeBtns.length > 0) {
	console.log('Setting up button event listeners');
	embedTypeBtns.forEach((btn, index) => {
		console.log(`Setting up button ${index}:`, btn.dataset.type);
		btn.addEventListener('click', function () {
			const selectedType = this.dataset.type;
			console.log('Button clicked:', selectedType);

			embedTypeBtns.forEach(b => b.classList.remove('active'));
			this.classList.add('active');

			updateDemo(selectedType);
		});
	});
} else {
	console.warn('No embed type buttons found');
}

console.log('Initializing demo with YouTube');
updateDemo('youtube');

console.log('Demo.js setup complete');


