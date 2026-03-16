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
			embedTimeout: 15000, // ms before a special embed is declared failed
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

	// Validate URL format — only accepts https/http to prevent javascript: URI injection
	isValidUrl(url) {
		try {
			const parsed = new URL(url);
			return ['https:', 'http:'].includes(parsed.protocol);
		} catch (e) {
			return false;
		}
	}

	// Build the embed source URL with appropriate parameters
	buildEmbedSrc(embed, src, type) {
		let finalSrc = src;

		switch (type) {
			case 'codepen': {
				const themeId = embed.getAttribute('data-theme-id') || '';
				const defaultTab = embed.getAttribute('data-default-tab') || 'result';
				const editable = embed.getAttribute('data-editable') === 'true' ? 'true' : 'false';
				const usePreview = embed.getAttribute('data-preview') === 'true';
				// Convert /pen/ URL to embed URL and insert /preview/ when requested
				if (finalSrc.includes('/pen/')) {
					finalSrc = finalSrc.replace('/pen/', usePreview ? '/embed/preview/' : '/embed/');
				} else if (usePreview && finalSrc.includes('/embed/') && !finalSrc.includes('/embed/preview/')) {
					finalSrc = finalSrc.replace('/embed/', '/embed/preview/');
				}
				const cSep = finalSrc.includes('?') ? '&' : '?';
				finalSrc = `${finalSrc}${cSep}theme-id=${themeId}&default-tab=${defaultTab}&editable=${editable}`;
				break;
			}

			case 'vimeo': {
				// Handle Vimeo privacy hash
				const hash = embed.getAttribute('data-hash');
				if (hash && !src.includes('h=')) {
					const vSep = src.includes('?') ? '&' : '?';
					finalSrc = `${src}${vSep}h=${hash}`;
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
			}

			case 'youtube': {
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
			}

			case 'twitch': {
				const parentDomain = window.location.hostname;
				finalSrc = `${finalSrc}&parent=${parentDomain}`;
				break;
			}

			case 'twitter':
			case 'x':
				// Twitter/X embeds need special handling with their widget.js
				this.loadExternalScript('https://platform.twitter.com/widgets.js', 'twitter-widget');

				if (/^\d+$/.test(src)) {
					// Bare numeric tweet ID
					finalSrc = `https://twitter.com/i/status/${src}`;
				} else {
					// Full URL (x.com or twitter.com) — extract status ID and
					// normalize to twitter.com so widgets.js processes it reliably
					const statusMatch = src.match(/\/status\/(\d+)/);
					if (statusMatch) {
						finalSrc = `https://twitter.com/i/status/${statusMatch[1]}`;
					}
				}
				break;

			case 'instagram':
				// Instagram embeds require their script
				this.loadExternalScript('https://www.instagram.com/embed.js', 'instagram-embed');

				// Handle different Instagram URL formats
				if (finalSrc.includes('instagram.com/p/') || finalSrc.includes('instagram.com/reel/')) {
					// Add query parameters if not already present
					if (!finalSrc.includes('?')) {
						finalSrc = `${finalSrc}?utm_source=ig_embed&utm_campaign=loading`;
					} else if (!finalSrc.includes('utm_source=ig_embed')) {
						finalSrc = `${finalSrc}&utm_source=ig_embed&utm_campaign=loading`;
					}
				}
				break;

			case 'tiktok': {
				// TikTok embeds require their script
				this.loadExternalScript('https://www.tiktok.com/embed.js', 'tiktok-embed');

				// Handle both video URLs and direct embed URLs
				if (!finalSrc.includes('embed')) {
					// Strip trailing slash and query string before extracting ID
					const tiktokPath = finalSrc.replace(/\?.*$/, '').replace(/\/$/, '');
					const tiktokId = tiktokPath.split('/').pop();
					finalSrc = `https://www.tiktok.com/embed/v2/${tiktokId}`;
				}
				break;
			}

			case 'soundcloud': {
				// If only the track URL is provided, convert to embed URL
				if (!finalSrc.includes('api.soundcloud.com')) {
					// We'll use color and auto_play from data attributes
					const color = embed.getAttribute('data-color') || 'ff5500';
					const autoPlay = embed.getAttribute('data-autoplay') === 'true' ? 'true' : 'false';
					const showComments = embed.getAttribute('data-show-comments') === 'true' ? 'true' : 'false';

					finalSrc = `https://w.soundcloud.com/player/?url=${encodeURIComponent(src)}&color=${color}&auto_play=${autoPlay}&hide_related=false&show_comments=${showComments}&show_user=true&show_reposts=false&show_teaser=true`;
				}
				break;
			}

			case 'spotify': {
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
			}

			case 'github':
			case 'gist':
				// GitHub Gists are embedded via script, not iframe
				// Convert gist.github.com/user/gistid to the .js script URL
				if (finalSrc.includes('gist.github.com') && !finalSrc.endsWith('.js')) {
					const gistId = finalSrc.split('/').pop();
					finalSrc = `https://gist.github.com/${gistId}.js`;
				}
				break;

			case 'maps':
			case 'google-maps': {
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
		if (type === 'twitter' || type === 'x' || type === 'gist' || type === 'github' || type === 'instagram') {
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
		iframe.setAttribute('allowfullscreen', '');
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
		const timeoutMs = this.options.embedTimeout;

		// twitter/x may use a plain numeric tweet ID instead of a full URL
		if (type !== 'twitter' && type !== 'x') {
			if (!src || !this.isValidUrl(src)) {
				this.showError(embed, `Invalid ${type} source URL`);
				return;
			}
		}

		// Show loading placeholder
		const loadingMessage = document.createElement('div');
		loadingMessage.className = 'embed-placeholder';
		loadingMessage.setAttribute('aria-live', 'polite');
		loadingMessage.innerHTML = `<p>Loading ${type} content...</p>`;
		embed.innerHTML = '';
		embed.appendChild(loadingMessage);

		try {
			switch (type) {
				case 'twitter':
				case 'x': {
					// Create a blockquote for Twitter to transform
					const tweetUrl = this.buildEmbedSrc(embed, src, type);
					const tweetContainer = document.createElement('blockquote');
					tweetContainer.className = 'twitter-tweet';
					tweetContainer.setAttribute('data-lang', embed.getAttribute('data-lang') || 'en');
					tweetContainer.setAttribute('data-theme', embed.getAttribute('data-theme') || 'light');

					const tweetlink = document.createElement('a');
					tweetlink.href = tweetUrl;
					tweetlink.textContent = title;
					tweetContainer.appendChild(tweetlink);

					embed.innerHTML = '';
					embed.appendChild(tweetContainer);

					if (window.twttr && window.twttr.widgets) {
						window.twttr.widgets.load(embed);
					} else {
						this.loadExternalScript('https://platform.twitter.com/widgets.js', 'twitter-widget');
					}

					// Twitter widget.js replaces the blockquote with an <iframe> on success
					if (timeoutMs > 0) {
						setTimeout(() => {
							if (!embed.querySelector('iframe')) {
								this.showError(embed, 'Tweet failed to load. Check that the URL is correct and the tweet is publicly accessible.');
							}
						}, timeoutMs);
					}
					break;
				}

				case 'instagram': {
					// Create an Instagram embed using blockquote format
					const instagramUrl = this.buildEmbedSrc(embed, src, type);
					const instagramContainer = document.createElement('blockquote');
					instagramContainer.className = 'instagram-media';
					instagramContainer.setAttribute('data-instgrm-captioned', '');
					instagramContainer.setAttribute('data-instgrm-permalink', instagramUrl);
					instagramContainer.setAttribute('data-instgrm-version', '14');
					instagramContainer.style.margin = '0 auto';
					instagramContainer.style.width = '100%';
					instagramContainer.style.maxWidth = '540px';

					const link = document.createElement('a');
					link.href = instagramUrl;
					link.textContent = title || 'View this post on Instagram';
					link.target = '_blank';
					instagramContainer.appendChild(link);

					embed.innerHTML = '';
					embed.appendChild(instagramContainer);

					this.loadExternalScript('https://www.instagram.com/embed.js', 'instagram-embed');

					if (window.instgrm) {
						window.instgrm.Embeds.process();
					}

					// Instagram embed.js replaces the blockquote with an <iframe> on success
					if (timeoutMs > 0) {
						setTimeout(() => {
							if (!embed.querySelector('iframe')) {
								this.showError(embed, 'Instagram embed failed to load. Check that the URL is correct and the post is publicly accessible.');
							}
						}, timeoutMs);
					}
					break;
				}

				case 'gist':
				case 'github': {
					const gistUrl = this.buildEmbedSrc(embed, src, type);

					// Gist scripts use document.write(), which is blocked after page load.
					// Using srcdoc gives the script a fresh document context to write into.
					const iframe = document.createElement('iframe');
					iframe.style.width = '100%';
					iframe.style.border = 'none';
					iframe.style.minHeight = '100px';
					iframe.setAttribute('aria-label', title);
					iframe.srcdoc = `<!DOCTYPE html><html><head><base target="_parent"><style>body{margin:0;font-family:sans-serif}</style></head><body><script src="${gistUrl}"><\/script></body></html>`;

					let settled = false;
					let timeoutId = null;

					iframe.addEventListener('load', () => {
						settled = true;
						if (timeoutId) clearTimeout(timeoutId);
						embed.querySelector('.embed-placeholder')?.remove();
					});
					iframe.addEventListener('error', () => {
						settled = true;
						if (timeoutId) clearTimeout(timeoutId);
						this.showError(embed, 'Failed to load GitHub Gist. Ensure the Gist is public and the URL is correct.');
					});

					if (timeoutMs > 0) {
						timeoutId = setTimeout(() => {
							if (!settled) {
								this.showError(embed, 'GitHub Gist timed out. Ensure the Gist is public and the URL is correct.');
							}
						}, timeoutMs);
					}

					embed.innerHTML = '';
					embed.appendChild(iframe);
					break;
				}
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

// Export for module environments (testing, Node.js, bundlers)
if (typeof module !== 'undefined' && module.exports) {
	module.exports = EmbedManager;
}

// Auto-initialize for browser environments (non-module script tag usage)
if (typeof window !== 'undefined' && typeof module === 'undefined') {
	window.EmbedManager = new EmbedManager();
}
