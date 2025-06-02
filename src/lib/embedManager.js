/**
 * EmbedManager.js
 *
 * This library handles the embedding of various content types
 * (YouTube, Vimeo, Twitch, CodePen, and websites) into a webpage with
 * lazy loading to improve performance. It automatically injects the necessary
 * CSS and sets up an Intersection Observer to load iframes only when they are
 * in view, optimizing page load times and resource management.
 *
 * Features:
 * - Lazy loading of iframes using the Intersection Observer API
 * - Support for multiple content types (YouTube, Vimeo, Twitch, CodePen, and websites)
 * - Sandbox attribute for website embeds to enhance security
 * - Configurable iframe titles for accessibility
 * - Handles Vimeo unlisted/private privacy hash via optional `data-hash` attribute
 *
 * Usage:
 * - Include the HTML structure with the 'embed-container' class and appropriate data attributes.
 * - The class will handle iframe creation, and lazy loading automatically.
 */
class EmbedManager {
	constructor() {
		this.injectCSS();
		this.init();
	}

	// Inject CSS into the document head
	injectCSS() {
		const style = document.createElement('style');
		style.innerHTML = `.embed-container{margin:20px auto;background:#f4f4f4;position:relative;overflow:hidden;display:flex;justify-content:center;align-items:center}.embed-container iframe{width:100%;height:100%;border:none;display:block}.embed-container p{margin:0;font-size:1em;color:#555}`;
		document.head.appendChild(style);
	}

	// Initialize lazy loading after DOM is loaded
	init() {
		document.addEventListener('DOMContentLoaded', () => {
			const embeds = document.querySelectorAll('.embed-container');
			this.setupObserver(embeds);
		});
	}

	// Lazy load embeds when in view
	lazyLoadEmbed(embed) {
		const src = embed.getAttribute('data-src');
		const type = embed.getAttribute('data-type');
		const title = embed.getAttribute('data-title') || 'Untitled Embed';
		const width = embed.getAttribute('data-width') || '600px';
		const height = embed.getAttribute('data-height') || '315px';

		embed.style.width = width;
		embed.style.height = height;

		// Create iframe element
		const iframe = document.createElement('iframe');
		iframe.allow = 'autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media';
		iframe.loading = 'lazy';
		iframe.title = title;
		iframe.allowfullscreen = true;
		iframe.frameBorder = '0';

		// Handle CodePen-specific attributes
		if (type === 'codepen') {
			const themeId = embed.getAttribute('data-theme-id') || '';
			const defaultTab = embed.getAttribute('data-default-tab') || 'result';
			const editable = embed.getAttribute('data-editable') === 'true' ? 'true' : 'false';
			const preview = embed.getAttribute('data-preview') === 'true' ? 'embed/preview' : 'embed';
			const codepenUrl = `${src}?theme-id=${themeId}&default-tab=${defaultTab}&editable=${editable}&preview=${preview}`;

			console.log(codepenUrl);
			iframe.src = codepenUrl;
		} else {
			// Preserve full URL and append Vimeo privacy hash if provided
			let finalSrc = src;

			if (type === 'vimeo') {
				// Ensure Vimeo URL has proper parameters
				const hash = embed.getAttribute('data-hash');
				if (hash && !src.includes('h=')) {
					const sep = src.includes('?') ? '&' : '?';
					finalSrc = `${src}${sep}h=${hash}`;
				}

				// Add common Vimeo parameters if not already present
				const commonParams = ['badge=0', 'autopause=0', 'player_id=0'];

				// Add app_id if provided as data attribute
				const appId = embed.getAttribute('data-app-id');
				if (appId) {
					commonParams.push(`app_id=${appId}`);
				}

				commonParams.forEach(param => {
					const paramName = param.split('=')[0];
					if (!finalSrc.includes(paramName + '=')) {
						const sep = finalSrc.includes('?') ? '&' : '?';
						finalSrc = `${finalSrc}${sep}${param}`;
					}
				});
			} else if (type === 'twitch') {
				const parentDomain = window.location.hostname;
				// Twitch embed URLs (channel, video, clip) already contain a '?'
				// so we append parent with '&'
				finalSrc = `${finalSrc}&parent=${parentDomain}`;
			}

			iframe.src = finalSrc;
		}

		// For website embeds, set sandbox attributes for security
		if (type === 'website') {
			iframe.sandbox = 'allow-scripts allow-same-origin allow-forms';
		}

		// Inject iframe and remove placeholder
		embed.innerHTML = '';
		embed.appendChild(iframe);
	}

	// Set up Intersection Observer for lazy loading
	setupObserver(embeds) {
		const observer = new IntersectionObserver((entries) => {
			entries.forEach(entry => {
				if (entry.isIntersecting) {
					this.lazyLoadEmbed(entry.target);
					observer.unobserve(entry.target); // Stop observing
				}
			});
		});

		// Observe each embed container
		embeds.forEach(embed => observer.observe(embed));
	}

	// Add method to process a single container (for demo functionality)
	processContainer(container) {
		if (container && container.classList.contains('embed-container')) {
			this.lazyLoadEmbed(container);
		}
	}
}

// Initialize EmbedManager and expose it globally for demo functionality
window.EmbedManager = new EmbedManager();
