/**
 * EmbedManager.js
 *
 * This library handles the embedding of various content types
 * (YouTube, Vimeo, Twitch, CodePen, Twitter, Instragram and more) into a webpage with
 * lazy loading to improve performance. It automatically injects the necessary
 * CSS and sets up an Intersection Observer to load iframes only when they are
 * in view, optimizing page load times and resource management.
 *
 * Features:
 * - Lazy loading of iframes using the Intersection Observer API
 * - Support for multiple content types (YouTube, Vimeo, Twitch, CodePen, Twitter, Instragram and more)
 * - Sandbox attribute for website embeds to enhance security
 * - Configurable iframe titles for accessibility
 * - Handles Vimeo unlisted/private privacy hash via optional `data-hash` attribute
 * - Enhanced accessibility with aria attributes
 * - Improved security with referrer policy and stricter sandbox settings
 * - Responsive design support with aspect ratio preservation
 * - Error handling for failed embeds
 *
 * Usage:
 * - Include the HTML structure with the 'embed-container' class and appropriate data attributes.
 * - The class will handle iframe creation, and lazy loading automatically.
 */
class EmbedManager {
	constructor(options = {}) {
		this.options = {
			rootMargin: '200px 0px',
			...options
		};
		this.injectCSS();
		this.init();
	}

	// Inject CSS into the document head
	injectCSS() {
		const style = document.createElement('style');
		style.innerHTML = `
			.embed-container {
				margin: 20px auto;
				background: #f4f4f4;
				position: relative;
				overflow: hidden;
				display: flex;
				justify-content: center;
				align-items: center;
				/* Default aspect ratio wrapper */
				aspect-ratio: 16/9;
			}
			.embed-container iframe {
				width: 100%;
				height: 100%;
				border: none;
				display: block;
				position: absolute;
				top: 0;
				left: 0;
			}
			.embed-container p {
				margin: 0;
				font-size: 1em;
				color: #555;
			}
			.embed-container .embed-placeholder {
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				width: 100%;
				height: 100%;
				text-align: center;
				padding: 1rem;
			}
			.embed-container .embed-error {
				color: #721c24;
				background-color: #f8d7da;
				padding: 0.75rem;
				border-radius: 0.25rem;
				margin: 0.5rem 0;
				width: 100%;
				text-align: center;
			}
		`;
		document.head.appendChild(style);
	}

	// Initialize lazy loading after DOM is loaded
	init() {
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', () => this.setupEmbeds());
		} else {
			this.setupEmbeds();
		}
	}

	setupEmbeds() {
		const embeds = document.querySelectorAll('.embed-container');
		this.setupObserver(embeds);
	}

	// Lazy load embeds when in view
	lazyLoadEmbed(embed) {
		const src = embed.getAttribute('data-src');
		const type = embed.getAttribute('data-type');
		const title = embed.getAttribute('data-title') || 'Untitled Embed';
		const width = embed.getAttribute('data-width') || '100%';
		const height = embed.getAttribute('data-height');
		const aspectRatio = embed.getAttribute('data-aspect-ratio') || '16/9';

		// Validate source URL
		if (!src || !this.isValidUrl(src)) {
			this.showError(embed, 'Invalid embed source URL');
			return;
		}

		// Set dimensions or aspect ratio
		if (height) {
			embed.style.height = height;
			embed.style.width = width;
			// Remove default aspect ratio if explicit dimensions are provided
			embed.style.aspectRatio = 'unset';
		} else {
			embed.style.width = width;
			embed.style.aspectRatio = aspectRatio;
		}

		// Show loading state for accessibility
		const loadingMessage = document.createElement('div');
		loadingMessage.className = 'embed-placeholder';
		loadingMessage.setAttribute('aria-live', 'polite');
		loadingMessage.innerHTML = `<p>Loading ${type} content...</p>`;
		embed.innerHTML = '';
		embed.appendChild(loadingMessage);

		// Create iframe element with enhanced attributes
		const iframe = document.createElement('iframe');
		iframe.allow = 'autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media';
		iframe.loading = 'lazy';
		iframe.title = title;
		iframe.allowfullscreen = true;
		iframe.frameBorder = '0';
		iframe.setAttribute('aria-label', title);
		iframe.referrerPolicy = 'no-referrer-when-downgrade';

		// Set source based on type
		try {
			let finalSrc = this.buildEmbedSrc(embed, src, type);
			iframe.src = finalSrc;

			// Handle load and error events
			iframe.addEventListener('load', () => {
				embed.querySelector('.embed-placeholder')?.remove();
			});

			iframe.addEventListener('error', () => {
				this.showError(embed, `Failed to load ${type} content`);
			});

			// For website embeds, set enhanced sandbox attributes for security
			if (type === 'website') {
				iframe.sandbox = 'allow-scripts allow-same-origin allow-forms allow-popups';
			}

			// Replace placeholder with iframe
			embed.appendChild(iframe);

		} catch (error) {
			this.showError(embed, error.message);
		}
	}

	// Set up Intersection Observer for lazy loading
	setupObserver(embeds) {
		const observer = new IntersectionObserver((entries) => {
			entries.forEach(entry => {
				if (entry.isIntersecting) {
					this.lazyLoadEmbed(entry.target);
					observer.unobserve(entry.target); // Stop observing once loaded
				}
			});
		}, {
			rootMargin: this.options.rootMargin
		});

		// Observe each embed container
		embeds.forEach(embed => {
			// Add placeholder content
			if (!embed.innerHTML.trim()) {
				const type = embed.getAttribute('data-type') || 'content';
				const placeholder = document.createElement('div');
				placeholder.className = 'embed-placeholder';
				placeholder.innerHTML = `<p>Loading ${type} content when visible</p>`;
				embed.appendChild(placeholder);
			}
			observer.observe(embed);
		});
	}

	// Helper method to show errors
	showError(embed, message) {
		console.error(`EmbedManager Error: ${message}`);
		embed.innerHTML = `<div class="embed-error" role="alert">${message}</div>`;
	}

	// Validate URL format
	isValidUrl(url) {
		try {
			new URL(url);
			return true;
		} catch (e) {
			return false;
		}
	}

	// Build the embed source URL with appropriate parameters
	buildEmbedSrc(embed, src, type) {
		let finalSrc = src;

		switch (type) {
			case 'codepen':
				const themeId = embed.getAttribute('data-theme-id') || '';
				const defaultTab = embed.getAttribute('data-default-tab') || 'result';
				const editable = embed.getAttribute('data-editable') === 'true' ? 'true' : 'false';
				const preview = embed.getAttribute('data-preview') === 'true' ? 'embed/preview' : 'embed';
				finalSrc = `${src}?theme-id=${themeId}&default-tab=${defaultTab}&editable=${editable}&preview=${preview}`;
				break;

			case 'vimeo':
				// Handle Vimeo privacy hash
				const hash = embed.getAttribute('data-hash');
				if (hash && !src.includes('h=')) {
					const sep = src.includes('?') ? '&' : '?';
					finalSrc = `${src}${sep}h=${hash}`;
				}

				// Add common Vimeo parameters
				const vimeoParams = [
					'badge=0',
					'autopause=0',
					'player_id=0',
					'dnt=1' // Do Not Track for privacy
				];

				// Add app_id if provided
				const appId = embed.getAttribute('data-app-id');
				if (appId) {
					vimeoParams.push(`app_id=${appId}`);
				}

				// Add user preferences
				if (embed.getAttribute('data-autoplay') === 'true') {
					vimeoParams.push('autoplay=1');
				}

				// Append all parameters
				vimeoParams.forEach(param => {
					const paramName = param.split('=')[0];
					if (!finalSrc.includes(paramName + '=')) {
						const sep = finalSrc.includes('?') ? '&' : '?';
						finalSrc = `${finalSrc}${sep}${param}`;
					}
				});
				break;

			case 'youtube':
				// Add YouTube parameters for better privacy and user experience
				const ytParams = [];

				// Add user preferences
				if (embed.getAttribute('data-autoplay') === 'true') {
					ytParams.push('autoplay=1');
				}

				// Add privacy-enhanced mode
				if (!src.includes('youtube-nocookie.com')) {
					// Replace with privacy-enhanced version if not already using it
					finalSrc = finalSrc.replace('youtube.com', 'youtube-nocookie.com');
				}

				// Add other common parameters
				ytParams.push('rel=0', 'modestbranding=1');

				// Append all parameters
				const ytSep = finalSrc.includes('?') ? '&' : '?';
				finalSrc = `${finalSrc}${ytSep}${ytParams.join('&')}`;
				break;

			case 'twitch':
				const parentDomain = window.location.hostname;
				finalSrc = `${finalSrc}&parent=${parentDomain}`;
				break;

			case 'twitter':
			case 'x':
				// Twitter/X embeds need special handling with their widget.js
				// We'll return the src as is, but we need to load their script
				this.loadExternalScript('https://platform.twitter.com/widgets.js', 'twitter-widget');

				// If the source is just a tweet ID, construct the proper URL
				if (/^\d+$/.test(src)) {
					finalSrc = `https://twitter.com/i/status/${src}`;
				}

				// For Twitter, we'll handle it differently after returning
				break;

			case 'instagram':
				// Instagram embeds require their script
				this.loadExternalScript('https://www.instagram.com/embed.js', 'instagram-embed');

				// Make sure URL ends with /embed for proper embedding
				if (!finalSrc.endsWith('/embed') && !finalSrc.includes('/embed/')) {
					finalSrc = finalSrc.replace(/\/$/, '') + '/embed';
				}
				break;

			case 'tiktok':
				// TikTok embeds require their script
				this.loadExternalScript('https://www.tiktok.com/embed.js', 'tiktok-embed');

				// Handle both video URLs and direct embed URLs
				if (!finalSrc.includes('embed')) {
					// Convert normal TikTok URL to embed version
					const tiktokId = finalSrc.split('/').pop();
					finalSrc = `https://www.tiktok.com/embed/v2/${tiktokId}`;
				}
				break;

			case 'soundcloud':
				// If only the track URL is provided, convert to embed URL
				if (!finalSrc.includes('api.soundcloud.com')) {
					// We'll use color and auto_play from data attributes
					const color = embed.getAttribute('data-color') || 'ff5500';
					const autoPlay = embed.getAttribute('data-autoplay') === 'true' ? 'true' : 'false';
					const showComments = embed.getAttribute('data-show-comments') === 'true' ? 'true' : 'false';

					finalSrc = `https://w.soundcloud.com/player/?url=${encodeURIComponent(src)}&color=${color}&auto_play=${autoPlay}&hide_related=false&show_comments=${showComments}&show_user=true&show_reposts=false&show_teaser=true`;
				}
				break;

			case 'spotify':
				// Handle different Spotify embed types (track, album, playlist, podcast)
				if (finalSrc.includes('spotify.com')) {
					// Convert regular Spotify URL to embed URL
					const spotifyType = finalSrc.includes('/track/') ? 'track' :
						finalSrc.includes('/album/') ? 'album' :
							finalSrc.includes('/playlist/') ? 'playlist' :
								finalSrc.includes('/episode/') ? 'episode' : 'track';

					const spotifyId = finalSrc.split('/').pop().split('?')[0];
					finalSrc = `https://open.spotify.com/embed/${spotifyType}/${spotifyId}`;
				}
				break;

			case 'github':
			case 'gist':
				// GitHub Gists are embedded via script, not iframe
				// We'll handle this specially after returning
				// If it's a full Gist URL, extract the Gist ID
				if (finalSrc.includes('github.com') && finalSrc.includes('/gist/')) {
					const gistId = finalSrc.split('/').pop();
					finalSrc = `https://gist.github.com/${gistId}.js`;
				}
				break;

			case 'maps':
			case 'google-maps':
				// Handle Google Maps embeds
				if (!finalSrc.includes('google.com/maps/embed')) {
					// If it's a regular maps URL, convert to embed URL
					// Extract location query or coordinates
					let query = '';

					if (finalSrc.includes('maps/place/')) {
						query = finalSrc.split('maps/place/')[1].split('/')[0];
					} else if (finalSrc.includes('maps?q=')) {
						query = finalSrc.split('maps?q=')[1].split('&')[0];
					}

					if (query) {
						finalSrc = `https://www.google.com/maps/embed/v1/place?key=${embed.getAttribute('data-api-key') || ''}&q=${query}`;
					}
				}
				break;
		}

		return finalSrc;
	}

	// Method to load external scripts needed for some embeds
	loadExternalScript(src, id) {
		if (!document.getElementById(id)) {
			const script = document.createElement('script');
			script.id = id;
			script.src = src;
			script.async = true;
			script.defer = true;
			document.body.appendChild(script);
		}
	}

	// Override lazyLoadEmbed to handle special embed types
	lazyLoadEmbed(embed) {
		const type = embed.getAttribute('data-type');
		const src = embed.getAttribute('data-src');

		// Special handling for embeds that don't use iframes
		if (type === 'twitter' || type === 'x' || type === 'gist' || type === 'github') {
			this.handleSpecialEmbed(embed, type);
			return;
		}

		const title = embed.getAttribute('data-title') || 'Untitled Embed';
		const width = embed.getAttribute('data-width') || '100%';
		const height = embed.getAttribute('data-height');
		const aspectRatio = embed.getAttribute('data-aspect-ratio') || '16/9';

		// Validate source URL
		if (!src || !this.isValidUrl(src)) {
			this.showError(embed, 'Invalid embed source URL');
			return;
		}

		// Set dimensions or aspect ratio
		if (height) {
			embed.style.height = height;
			embed.style.width = width;
			// Remove default aspect ratio if explicit dimensions are provided
			embed.style.aspectRatio = 'unset';
		} else {
			embed.style.width = width;
			embed.style.aspectRatio = aspectRatio;
		}

		// Show loading state for accessibility
		const loadingMessage = document.createElement('div');
		loadingMessage.className = 'embed-placeholder';
		loadingMessage.setAttribute('aria-live', 'polite');
		loadingMessage.innerHTML = `<p>Loading ${type} content...</p>`;
		embed.innerHTML = '';
		embed.appendChild(loadingMessage);

		// Create iframe element with enhanced attributes
		const iframe = document.createElement('iframe');
		iframe.allow = 'autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media';
		iframe.loading = 'lazy';
		iframe.title = title;
		iframe.allowfullscreen = true;
		iframe.frameBorder = '0';
		iframe.setAttribute('aria-label', title);
		iframe.referrerPolicy = 'no-referrer-when-downgrade';

		// Set source based on type
		try {
			let finalSrc = this.buildEmbedSrc(embed, src, type);
			iframe.src = finalSrc;

			// Handle load and error events
			iframe.addEventListener('load', () => {
				embed.querySelector('.embed-placeholder')?.remove();
			});

			iframe.addEventListener('error', () => {
				this.showError(embed, `Failed to load ${type} content`);
			});

			// For website embeds, set enhanced sandbox attributes for security
			if (type === 'website') {
				iframe.sandbox = 'allow-scripts allow-same-origin allow-forms allow-popups';
			}

			// Replace placeholder with iframe
			embed.appendChild(iframe);

		} catch (error) {
			this.showError(embed, error.message);
		}
	}

	// Handle embeds that don't use traditional iframes
	handleSpecialEmbed(embed, type) {
		const src = embed.getAttribute('data-src');
		const title = embed.getAttribute('data-title') || 'Untitled Embed';

		// Show loading state
		const loadingMessage = document.createElement('div');
		loadingMessage.className = 'embed-placeholder';
		loadingMessage.setAttribute('aria-live', 'polite');
		loadingMessage.innerHTML = `<p>Loading ${type} content...</p>`;
		embed.innerHTML = '';
		embed.appendChild(loadingMessage);

		try {
			switch (type) {
				case 'twitter':
				case 'x':
					// Create a blockquote for Twitter to transform
					const tweetUrl = this.buildEmbedSrc(embed, src, type);
					const tweetContainer = document.createElement('blockquote');
					tweetContainer.className = 'twitter-tweet';
					tweetContainer.setAttribute('data-lang', embed.getAttribute('data-lang') || 'en');
					tweetContainer.setAttribute('data-theme', embed.getAttribute('data-theme') || 'light');

					const link = document.createElement('a');
					link.href = tweetUrl;
					link.textContent = title;
					tweetContainer.appendChild(link);

					embed.innerHTML = '';
					embed.appendChild(tweetContainer);

					// Initialize Twitter widgets
					if (window.twttr && window.twttr.widgets) {
						window.twttr.widgets.load(embed);
					} else {
						// The script will auto-process when loaded
						this.loadExternalScript('https://platform.twitter.com/widgets.js', 'twitter-widget');
					}
					break;

				case 'gist':
				case 'github':
					// GitHub Gists use script tags
					const gistUrl = this.buildEmbedSrc(embed, src, type);
					const gistScript = document.createElement('script');
					gistScript.src = gistUrl;

					embed.innerHTML = '';
					embed.appendChild(gistScript);
					break;
			}
		} catch (error) {
			this.showError(embed, error.message);
		}
	}

	// Process a single container immediately (for demo functionality)
	processContainer(container) {
		if (container && container.classList.contains('embed-container')) {
			this.lazyLoadEmbed(container);
		}
	}

	// Utility method to add new embeds dynamically after page load
	addEmbed(container) {
		if (container && container.classList.contains('embed-container')) {
			this.setupObserver([container]);
		}
	}
}

// Initialize EmbedManager and expose it globally
window.EmbedManager = new EmbedManager();
