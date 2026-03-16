'use strict';

const EmbedManager = require('./embedManager.js');

// ─── Mocks ────────────────────────────────────────────────────────────────────

// IntersectionObserver is not implemented in jsdom
global.IntersectionObserver = jest.fn((callback) => ({
	observe: jest.fn(),
	unobserve: jest.fn(),
	disconnect: jest.fn(),
	// expose callback so tests can trigger intersections manually
	_trigger: (entries) => callback(entries),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Creates a .embed-container div with the given data attributes.
 */
function makeEmbed(attrs = {}) {
	const el = document.createElement('div');
	el.className = 'embed-container';
	Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
	return el;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('EmbedManager', () => {
	let mgr;

	beforeEach(() => {
		document.head.innerHTML = '';
		document.body.innerHTML = '';
		jest.clearAllMocks();
		mgr = new EmbedManager();
	});

	// ── Constructor ────────────────────────────────────────────────────────────

	describe('constructor', () => {
		it('uses default rootMargin when no options are passed', () => {
			expect(mgr.options.rootMargin).toBe('200px 0px');
		});

		it('merges custom options with defaults', () => {
			const custom = new EmbedManager({ rootMargin: '50px' });
			expect(custom.options.rootMargin).toBe('50px');
		});

		it('injects a <style> element into document.head', () => {
			document.head.innerHTML = '';
			new EmbedManager();
			expect(document.head.querySelector('style')).not.toBeNull();
		});
	});

	// ── injectCSS ──────────────────────────────────────────────────────────────

	describe('injectCSS', () => {
		beforeEach(() => { document.head.innerHTML = ''; });

		it('CSS contains .embed-container rule', () => {
			mgr.injectCSS();
			const style = document.head.querySelector('style');
			expect(style.innerHTML).toContain('.embed-container');
		});

		it('CSS contains .embed-error rule', () => {
			mgr.injectCSS();
			const style = document.head.querySelector('style');
			expect(style.innerHTML).toContain('.embed-error');
		});

		it('CSS sets border: none on iframes', () => {
			mgr.injectCSS();
			const style = document.head.querySelector('style');
			expect(style.innerHTML).toContain('border: none');
		});
	});

	// ── isValidUrl ─────────────────────────────────────────────────────────────

	describe('isValidUrl', () => {
		it('accepts https URLs', () => {
			expect(mgr.isValidUrl('https://example.com')).toBe(true);
		});

		it('accepts http URLs', () => {
			expect(mgr.isValidUrl('http://example.com/embed/123')).toBe(true);
		});

		it('rejects javascript: URIs (security)', () => {
			expect(mgr.isValidUrl('javascript:alert(1)')).toBe(false);
		});

		it('rejects data: URIs', () => {
			expect(mgr.isValidUrl('data:text/html,<h1>hi</h1>')).toBe(false);
		});

		it('rejects plain strings that are not URLs', () => {
			expect(mgr.isValidUrl('not-a-url')).toBe(false);
		});

		it('rejects empty string', () => {
			expect(mgr.isValidUrl('')).toBe(false);
		});

		it('rejects null', () => {
			expect(mgr.isValidUrl(null)).toBe(false);
		});

		it('rejects undefined', () => {
			expect(mgr.isValidUrl(undefined)).toBe(false);
		});
	});

	// ── showError ──────────────────────────────────────────────────────────────

	describe('showError', () => {
		it('renders an .embed-error element inside the container', () => {
			const embed = makeEmbed();
			mgr.showError(embed, 'Something broke');
			const el = embed.querySelector('.embed-error');
			expect(el).not.toBeNull();
			expect(el.textContent).toBe('Something broke');
		});

		it('sets role="alert" for accessibility', () => {
			const embed = makeEmbed();
			mgr.showError(embed, 'err');
			expect(embed.querySelector('[role="alert"]')).not.toBeNull();
		});

		it('calls console.error with prefixed message', () => {
			const spy = jest.spyOn(console, 'error').mockImplementation(() => { });
			mgr.showError(makeEmbed(), 'oops');
			expect(spy).toHaveBeenCalledWith('EmbedManager Error: oops');
			spy.mockRestore();
		});

		it('replaces existing container content', () => {
			const embed = makeEmbed();
			embed.innerHTML = '<p>old content</p>';
			mgr.showError(embed, 'new error');
			expect(embed.querySelector('p')).toBeNull();
			expect(embed.querySelector('.embed-error')).not.toBeNull();
		});
	});

	// ── buildEmbedSrc ──────────────────────────────────────────────────────────

	describe('buildEmbedSrc', () => {

		describe('youtube', () => {
			it('upgrades regular youtube.com to youtube-nocookie.com', () => {
				const embed = makeEmbed({ 'data-type': 'youtube' });
				const result = mgr.buildEmbedSrc(embed, 'https://www.youtube.com/embed/abc123', 'youtube');
				expect(result).toContain('youtube-nocookie.com');
				expect(result).not.toContain('www.youtube.com/embed');
			});

			it('does not double-convert already-nocookie URLs', () => {
				const embed = makeEmbed({ 'data-type': 'youtube' });
				const result = mgr.buildEmbedSrc(embed, 'https://www.youtube-nocookie.com/embed/abc123', 'youtube');
				expect(result).not.toContain('youtube-nocookie-nocookie');
			});

			it('appends rel=0 and modestbranding=1', () => {
				const embed = makeEmbed({ 'data-type': 'youtube' });
				const result = mgr.buildEmbedSrc(embed, 'https://www.youtube.com/embed/abc123', 'youtube');
				expect(result).toContain('rel=0');
				expect(result).toContain('modestbranding=1');
			});

			it('adds autoplay=1 when data-autoplay is "true"', () => {
				const embed = makeEmbed({ 'data-type': 'youtube', 'data-autoplay': 'true' });
				const result = mgr.buildEmbedSrc(embed, 'https://www.youtube.com/embed/abc123', 'youtube');
				expect(result).toContain('autoplay=1');
			});

			it('does not add autoplay when data-autoplay is absent', () => {
				const embed = makeEmbed({ 'data-type': 'youtube' });
				const result = mgr.buildEmbedSrc(embed, 'https://www.youtube.com/embed/abc123', 'youtube');
				expect(result).not.toContain('autoplay=1');
			});
		});

		describe('vimeo', () => {
			const BASE = 'https://player.vimeo.com/video/12345';

			it('appends dnt=1 for privacy by default', () => {
				const embed = makeEmbed({ 'data-type': 'vimeo' });
				const result = mgr.buildEmbedSrc(embed, BASE, 'vimeo');
				expect(result).toContain('dnt=1');
			});

			it('appends badge=0 and autopause=0', () => {
				const embed = makeEmbed({ 'data-type': 'vimeo' });
				const result = mgr.buildEmbedSrc(embed, BASE, 'vimeo');
				expect(result).toContain('badge=0');
				expect(result).toContain('autopause=0');
			});

			it('appends h= when data-hash is set', () => {
				const embed = makeEmbed({ 'data-type': 'vimeo', 'data-hash': 'secret99' });
				const result = mgr.buildEmbedSrc(embed, BASE, 'vimeo');
				expect(result).toContain('h=secret99');
			});

			it('does not duplicate h= if already present in src', () => {
				const embed = makeEmbed({ 'data-type': 'vimeo', 'data-hash': 'secret99' });
				const result = mgr.buildEmbedSrc(embed, `${BASE}?h=secret99`, 'vimeo');
				expect((result.match(/h=/g) || []).length).toBe(1);
			});

			it('appends app_id when data-app-id is set', () => {
				const embed = makeEmbed({ 'data-type': 'vimeo', 'data-app-id': '58479' });
				const result = mgr.buildEmbedSrc(embed, BASE, 'vimeo');
				expect(result).toContain('app_id=58479');
			});

			it('adds autoplay=1 when data-autoplay is "true"', () => {
				const embed = makeEmbed({ 'data-type': 'vimeo', 'data-autoplay': 'true' });
				const result = mgr.buildEmbedSrc(embed, BASE, 'vimeo');
				expect(result).toContain('autoplay=1');
			});
		});

		describe('codepen', () => {
			const PEN_URL = 'https://codepen.io/user/pen/abcdef';
			const EMBED_URL = 'https://codepen.io/user/embed/abcdef';

			it('converts /pen/ URL to /embed/ URL', () => {
				const embed = makeEmbed({ 'data-type': 'codepen' });
				const result = mgr.buildEmbedSrc(embed, PEN_URL, 'codepen');
				expect(result).toContain('/embed/');
				expect(result).not.toContain('/pen/');
			});

			it('converts /pen/ URL to /embed/preview/ when data-preview is "true"', () => {
				const embed = makeEmbed({ 'data-type': 'codepen', 'data-preview': 'true' });
				const result = mgr.buildEmbedSrc(embed, PEN_URL, 'codepen');
				expect(result).toContain('/embed/preview/');
			});

			it('inserts /preview/ into existing /embed/ URL when data-preview is "true"', () => {
				const embed = makeEmbed({ 'data-type': 'codepen', 'data-preview': 'true' });
				const result = mgr.buildEmbedSrc(embed, EMBED_URL, 'codepen');
				expect(result).toContain('/embed/preview/');
			});

			it('appends default-tab=result when not specified', () => {
				const embed = makeEmbed({ 'data-type': 'codepen' });
				const result = mgr.buildEmbedSrc(embed, PEN_URL, 'codepen');
				expect(result).toContain('default-tab=result');
			});

			it('uses custom theme-id and default-tab', () => {
				const embed = makeEmbed({
					'data-type': 'codepen',
					'data-theme-id': 'dark',
					'data-default-tab': 'js,result',
				});
				const result = mgr.buildEmbedSrc(embed, PEN_URL, 'codepen');
				expect(result).toContain('theme-id=dark');
				expect(result).toContain('default-tab=js,result');
			});

			it('sets editable=true when data-editable is "true"', () => {
				const embed = makeEmbed({ 'data-type': 'codepen', 'data-editable': 'true' });
				const result = mgr.buildEmbedSrc(embed, PEN_URL, 'codepen');
				expect(result).toContain('editable=true');
			});

			it('sets editable=false by default', () => {
				const embed = makeEmbed({ 'data-type': 'codepen' });
				const result = mgr.buildEmbedSrc(embed, PEN_URL, 'codepen');
				expect(result).toContain('editable=false');
			});
		});

		describe('twitch', () => {
			it('appends &parent= with the current hostname', () => {
				const embed = makeEmbed({ 'data-type': 'twitch' });
				const src = 'https://player.twitch.tv/?channel=test&autoplay=false';
				const result = mgr.buildEmbedSrc(embed, src, 'twitch');
				expect(result).toContain('&parent=');
			});
		});

		describe('tiktok', () => {
			it('converts a standard TikTok video URL to embed URL', () => {
				const embed = makeEmbed({ 'data-type': 'tiktok' });
				const src = 'https://www.tiktok.com/@user/video/1234567890';
				const result = mgr.buildEmbedSrc(embed, src, 'tiktok');
				expect(result).toBe('https://www.tiktok.com/embed/v2/1234567890');
			});

			it('handles trailing slash in TikTok URL', () => {
				const embed = makeEmbed({ 'data-type': 'tiktok' });
				const src = 'https://www.tiktok.com/@user/video/1234567890/';
				const result = mgr.buildEmbedSrc(embed, src, 'tiktok');
				expect(result).toBe('https://www.tiktok.com/embed/v2/1234567890');
			});

			it('handles query strings in TikTok URL', () => {
				const embed = makeEmbed({ 'data-type': 'tiktok' });
				const src = 'https://www.tiktok.com/@user/video/1234567890?share_app_id=1233';
				const result = mgr.buildEmbedSrc(embed, src, 'tiktok');
				expect(result).toBe('https://www.tiktok.com/embed/v2/1234567890');
			});

			it('passes through an already-embed TikTok URL unchanged', () => {
				const embed = makeEmbed({ 'data-type': 'tiktok' });
				const src = 'https://www.tiktok.com/embed/v2/1234567890';
				const result = mgr.buildEmbedSrc(embed, src, 'tiktok');
				expect(result).toBe(src);
			});
		});

		describe('soundcloud', () => {
			it('converts a track URL to the SoundCloud player URL', () => {
				const embed = makeEmbed({ 'data-type': 'soundcloud' });
				const src = 'https://soundcloud.com/artist/track-name';
				const result = mgr.buildEmbedSrc(embed, src, 'soundcloud');
				expect(result).toContain('https://w.soundcloud.com/player/');
				expect(result).toContain(encodeURIComponent(src));
			});

			it('supports custom color via data-color', () => {
				const embed = makeEmbed({ 'data-type': 'soundcloud', 'data-color': '00aabb' });
				const result = mgr.buildEmbedSrc(embed, 'https://soundcloud.com/a/b', 'soundcloud');
				expect(result).toContain('color=00aabb');
			});

			it('passes through an API URL unchanged', () => {
				const embed = makeEmbed({ 'data-type': 'soundcloud' });
				const src = 'https://api.soundcloud.com/tracks/123456';
				expect(mgr.buildEmbedSrc(embed, src, 'soundcloud')).toBe(src);
			});
		});

		describe('spotify', () => {
			it('converts a track URL to the Spotify embed URL', () => {
				const embed = makeEmbed({ 'data-type': 'spotify' });
				const result = mgr.buildEmbedSrc(embed, 'https://open.spotify.com/track/abc123?si=xyz', 'spotify');
				expect(result).toBe('https://open.spotify.com/embed/track/abc123');
			});

			it('converts an album URL to the Spotify embed URL', () => {
				const embed = makeEmbed({ 'data-type': 'spotify' });
				const result = mgr.buildEmbedSrc(embed, 'https://open.spotify.com/album/abc123', 'spotify');
				expect(result).toBe('https://open.spotify.com/embed/album/abc123');
			});

			it('converts a playlist URL to the Spotify embed URL', () => {
				const embed = makeEmbed({ 'data-type': 'spotify' });
				const result = mgr.buildEmbedSrc(embed, 'https://open.spotify.com/playlist/abc123', 'spotify');
				expect(result).toBe('https://open.spotify.com/embed/playlist/abc123');
			});

			it('converts an episode URL to the Spotify embed URL', () => {
				const embed = makeEmbed({ 'data-type': 'spotify' });
				const result = mgr.buildEmbedSrc(embed, 'https://open.spotify.com/episode/abc123', 'spotify');
				expect(result).toBe('https://open.spotify.com/embed/episode/abc123');
			});
		});

		describe('gist / github', () => {
			it('converts a gist.github.com URL to a .js script URL', () => {
				const embed = makeEmbed({ 'data-type': 'gist' });
				const result = mgr.buildEmbedSrc(embed, 'https://gist.github.com/user/abc123', 'gist');
				expect(result).toBe('https://gist.github.com/abc123.js');
			});

			it('handles the "github" type alias the same way', () => {
				const embed = makeEmbed({ 'data-type': 'github' });
				const result = mgr.buildEmbedSrc(embed, 'https://gist.github.com/user/def456', 'github');
				expect(result).toBe('https://gist.github.com/def456.js');
			});
		});

		describe('unknown type', () => {
			it('returns the src unchanged for unrecognised types', () => {
				const embed = makeEmbed({ 'data-type': 'unknown' });
				const src = 'https://example.com/embed/123';
				expect(mgr.buildEmbedSrc(embed, src, 'unknown')).toBe(src);
			});
		});
	});

	// ── lazyLoadEmbed ──────────────────────────────────────────────────────────

	describe('lazyLoadEmbed', () => {
		it('shows an error when data-src is missing', () => {
			const embed = makeEmbed({ 'data-type': 'youtube' });
			mgr.lazyLoadEmbed(embed);
			expect(embed.querySelector('.embed-error')).not.toBeNull();
		});

		it('shows an error when data-src is not a valid URL', () => {
			const embed = makeEmbed({ 'data-type': 'youtube', 'data-src': 'not-a-url' });
			mgr.lazyLoadEmbed(embed);
			expect(embed.querySelector('.embed-error')).not.toBeNull();
		});

		it('shows an error for javascript: URI (security)', () => {
			const embed = makeEmbed({ 'data-type': 'youtube', 'data-src': 'javascript:alert(1)' });
			mgr.lazyLoadEmbed(embed);
			expect(embed.querySelector('.embed-error')).not.toBeNull();
		});

		it('creates an iframe for a valid YouTube embed', () => {
			const embed = makeEmbed({
				'data-type': 'youtube',
				'data-src': 'https://www.youtube.com/embed/abc123',
				'data-title': 'My Video',
			});
			document.body.appendChild(embed);
			mgr.lazyLoadEmbed(embed);
			const iframe = embed.querySelector('iframe');
			expect(iframe).not.toBeNull();
			expect(iframe.title).toBe('My Video');
		});

		it('sets allowfullscreen attribute (not property) on the iframe', () => {
			const embed = makeEmbed({
				'data-type': 'youtube',
				'data-src': 'https://www.youtube.com/embed/abc123',
			});
			document.body.appendChild(embed);
			mgr.lazyLoadEmbed(embed);
			const iframe = embed.querySelector('iframe');
			expect(iframe.getAttribute('allowfullscreen')).toBe('');
		});

		it('does not set deprecated frameBorder attribute', () => {
			const embed = makeEmbed({
				'data-type': 'youtube',
				'data-src': 'https://www.youtube.com/embed/abc123',
			});
			document.body.appendChild(embed);
			mgr.lazyLoadEmbed(embed);
			const iframe = embed.querySelector('iframe');
			expect(iframe.getAttribute('frameBorder')).toBeNull();
			expect(iframe.getAttribute('frameborder')).toBeNull();
		});

		it('sets referrerpolicy on the iframe', () => {
			const embed = makeEmbed({
				'data-type': 'youtube',
				'data-src': 'https://www.youtube.com/embed/abc123',
			});
			document.body.appendChild(embed);
			mgr.lazyLoadEmbed(embed);
			const iframe = embed.querySelector('iframe');
			expect(iframe.referrerPolicy).toBe('no-referrer-when-downgrade');
		});

		it('applies default 16/9 aspect ratio when no data-height', () => {
			const embed = makeEmbed({
				'data-type': 'youtube',
				'data-src': 'https://www.youtube.com/embed/abc123',
			});
			document.body.appendChild(embed);
			mgr.lazyLoadEmbed(embed);
			expect(embed.style.aspectRatio).toBe('16/9');
		});

		it('uses a custom aspect ratio from data-aspect-ratio', () => {
			const embed = makeEmbed({
				'data-type': 'youtube',
				'data-src': 'https://www.youtube.com/embed/abc123',
				'data-aspect-ratio': '4/3',
			});
			document.body.appendChild(embed);
			mgr.lazyLoadEmbed(embed);
			expect(embed.style.aspectRatio).toBe('4/3');
		});

		it('sets explicit height and clears aspect-ratio when data-height is provided', () => {
			const embed = makeEmbed({
				'data-type': 'youtube',
				'data-src': 'https://www.youtube.com/embed/abc123',
				'data-height': '400px',
			});
			document.body.appendChild(embed);
			mgr.lazyLoadEmbed(embed);
			expect(embed.style.height).toBe('400px');
			expect(embed.style.aspectRatio).toBe('unset');
		});

		it('applies sandbox to website embeds', () => {
			const embed = makeEmbed({
				'data-type': 'website',
				'data-src': 'https://example.com',
			});
			document.body.appendChild(embed);
			mgr.lazyLoadEmbed(embed);
			const iframe = embed.querySelector('iframe');
			expect(iframe.sandbox.toString()).toContain('allow-scripts');
			expect(iframe.sandbox.toString()).toContain('allow-same-origin');
		});

		it('does NOT apply sandbox to non-website embeds', () => {
			const embed = makeEmbed({
				'data-type': 'youtube',
				'data-src': 'https://www.youtube.com/embed/abc123',
			});
			document.body.appendChild(embed);
			mgr.lazyLoadEmbed(embed);
			const iframe = embed.querySelector('iframe');
			expect(iframe.getAttribute('sandbox')).toBeNull();
		});

		['twitter', 'x', 'instagram', 'gist', 'github'].forEach((type) => {
			it(`delegates "${type}" to handleSpecialEmbed instead of creating an iframe`, () => {
				const spy = jest.spyOn(mgr, 'handleSpecialEmbed').mockImplementation(() => { });
				const embed = makeEmbed({ 'data-type': type, 'data-src': 'https://example.com' });
				mgr.lazyLoadEmbed(embed);
				expect(spy).toHaveBeenCalledWith(embed, type);
				expect(embed.querySelector('iframe')).toBeNull();
				spy.mockRestore();
			});
		});
	});

	// ── handleSpecialEmbed ────────────────────────────────────────────────────

	describe('handleSpecialEmbed', () => {

		describe('twitter / x', () => {
			it('creates a .twitter-tweet blockquote for type "twitter"', () => {
				const embed = makeEmbed({
					'data-type': 'twitter',
					'data-src': 'https://twitter.com/user/status/123456',
					'data-title': 'A tweet',
				});
				document.body.appendChild(embed);
				mgr.handleSpecialEmbed(embed, 'twitter');
				expect(embed.querySelector('.twitter-tweet')).not.toBeNull();
			});

			it('creates a .twitter-tweet blockquote for type "x" as well', () => {
				const embed = makeEmbed({
					'data-type': 'x',
					'data-src': 'https://twitter.com/user/status/123456',
				});
				document.body.appendChild(embed);
				mgr.handleSpecialEmbed(embed, 'x');
				expect(embed.querySelector('.twitter-tweet')).not.toBeNull();
			});

			it('sets data-lang and data-theme on the blockquote', () => {
				const embed = makeEmbed({
					'data-type': 'twitter',
					'data-src': 'https://twitter.com/user/status/123456',
					'data-lang': 'fr',
					'data-theme': 'dark',
				});
				document.body.appendChild(embed);
				mgr.handleSpecialEmbed(embed, 'twitter');
				const bq = embed.querySelector('.twitter-tweet');
				expect(bq.getAttribute('data-lang')).toBe('fr');
				expect(bq.getAttribute('data-theme')).toBe('dark');
			});

			it('loads the Twitter widgets script', () => {
				const spy = jest.spyOn(mgr, 'loadExternalScript');
				const embed = makeEmbed({
					'data-type': 'twitter',
					'data-src': 'https://twitter.com/user/status/123456',
				});
				document.body.appendChild(embed);
				mgr.handleSpecialEmbed(embed, 'twitter');
				expect(spy).toHaveBeenCalledWith(
					'https://platform.twitter.com/widgets.js',
					'twitter-widget'
				);
				spy.mockRestore();
			});
		});

		describe('instagram', () => {
			it('creates an .instagram-media blockquote', () => {
				const embed = makeEmbed({
					'data-type': 'instagram',
					'data-src': 'https://www.instagram.com/p/abc123/',
					'data-title': 'A post',
				});
				document.body.appendChild(embed);
				mgr.handleSpecialEmbed(embed, 'instagram');
				const bq = embed.querySelector('.instagram-media');
				expect(bq).not.toBeNull();
			});

			it('sets data-instgrm-permalink on the blockquote', () => {
				const embed = makeEmbed({
					'data-type': 'instagram',
					'data-src': 'https://www.instagram.com/p/abc123/',
				});
				document.body.appendChild(embed);
				mgr.handleSpecialEmbed(embed, 'instagram');
				const bq = embed.querySelector('.instagram-media');
				expect(bq.getAttribute('data-instgrm-permalink')).toContain('instagram.com');
			});

			it('sets data-instgrm-version="14"', () => {
				const embed = makeEmbed({
					'data-type': 'instagram',
					'data-src': 'https://www.instagram.com/p/abc123/',
				});
				document.body.appendChild(embed);
				mgr.handleSpecialEmbed(embed, 'instagram');
				const bq = embed.querySelector('.instagram-media');
				expect(bq.getAttribute('data-instgrm-version')).toBe('14');
			});

			it('loads the Instagram embed script', () => {
				const spy = jest.spyOn(mgr, 'loadExternalScript');
				const embed = makeEmbed({
					'data-type': 'instagram',
					'data-src': 'https://www.instagram.com/p/abc123/',
				});
				document.body.appendChild(embed);
				mgr.handleSpecialEmbed(embed, 'instagram');
				expect(spy).toHaveBeenCalledWith(
					'https://www.instagram.com/embed.js',
					'instagram-embed'
				);
				spy.mockRestore();
			});
		});

		describe('gist / github', () => {
			it('appends a <script> tag with the .js gist URL', () => {
				const embed = makeEmbed({
					'data-type': 'gist',
					'data-src': 'https://gist.github.com/user/abc123',
				});
				document.body.appendChild(embed);
				mgr.handleSpecialEmbed(embed, 'gist');
				const script = embed.querySelector('script');
				expect(script).not.toBeNull();
				expect(script.src).toContain('abc123.js');
			});
		});
	});

	// ── loadExternalScript ────────────────────────────────────────────────────

	describe('loadExternalScript', () => {
		it('appends a <script> with the right src and id to the body', () => {
			mgr.loadExternalScript('https://cdn.example.com/lib.js', 'my-script');
			const script = document.getElementById('my-script');
			expect(script).not.toBeNull();
			expect(script.src).toBe('https://cdn.example.com/lib.js');
		});

		it('sets async and defer on the script', () => {
			mgr.loadExternalScript('https://cdn.example.com/lib2.js', 'my-script-2');
			const script = document.getElementById('my-script-2');
			expect(script.async).toBe(true);
			expect(script.defer).toBe(true);
		});

		it('does not add a duplicate script tag when called twice with the same id', () => {
			mgr.loadExternalScript('https://cdn.example.com/lib3.js', 'dedup-script');
			mgr.loadExternalScript('https://cdn.example.com/lib3.js', 'dedup-script');
			expect(document.querySelectorAll('#dedup-script').length).toBe(1);
		});
	});

	// ── processContainer ──────────────────────────────────────────────────────

	describe('processContainer', () => {
		it('calls lazyLoadEmbed for a valid .embed-container', () => {
			const spy = jest.spyOn(mgr, 'lazyLoadEmbed');
			const embed = makeEmbed({ 'data-type': 'youtube', 'data-src': 'https://www.youtube.com/embed/abc' });
			mgr.processContainer(embed);
			expect(spy).toHaveBeenCalledWith(embed);
		});

		it('does nothing for an element that lacks the embed-container class', () => {
			const spy = jest.spyOn(mgr, 'lazyLoadEmbed');
			const div = document.createElement('div');
			mgr.processContainer(div);
			expect(spy).not.toHaveBeenCalled();
		});

		it('does nothing for null', () => {
			const spy = jest.spyOn(mgr, 'lazyLoadEmbed');
			mgr.processContainer(null);
			expect(spy).not.toHaveBeenCalled();
		});
	});

	// ── addEmbed ──────────────────────────────────────────────────────────────

	describe('addEmbed', () => {
		it('calls setupObserver with the container wrapped in an array', () => {
			const spy = jest.spyOn(mgr, 'setupObserver');
			const embed = makeEmbed({ 'data-type': 'youtube' });
			mgr.addEmbed(embed);
			expect(spy).toHaveBeenCalledWith([embed]);
		});

		it('does nothing for an element without the embed-container class', () => {
			const spy = jest.spyOn(mgr, 'setupObserver');
			mgr.addEmbed(document.createElement('div'));
			expect(spy).not.toHaveBeenCalled();
		});

		it('does nothing for null', () => {
			const spy = jest.spyOn(mgr, 'setupObserver');
			mgr.addEmbed(null);
			expect(spy).not.toHaveBeenCalled();
		});
	});

	// ── setupEmbeds ───────────────────────────────────────────────────────────

	describe('setupEmbeds', () => {
		it('calls setupObserver with all .embed-container elements in the DOM', () => {
			const spy = jest.spyOn(mgr, 'setupObserver');
			document.body.innerHTML = `
				<div class="embed-container" data-type="youtube" data-src="https://www.youtube.com/embed/a"></div>
				<div class="embed-container" data-type="vimeo"   data-src="https://player.vimeo.com/video/1"></div>
				<div class="other-element"></div>
			`;
			mgr.setupEmbeds();
			expect(spy).toHaveBeenCalled();
			const passed = spy.mock.calls[0][0];
			expect(passed.length).toBe(2);
		});
	});

	// ── setupObserver ─────────────────────────────────────────────────────────

	describe('setupObserver', () => {
		it('creates an IntersectionObserver with the configured rootMargin', () => {
			const embed = makeEmbed({ 'data-type': 'youtube' });
			document.body.appendChild(embed);
			mgr.setupObserver([embed]);
			expect(IntersectionObserver).toHaveBeenCalledWith(
				expect.any(Function),
				{ rootMargin: '200px 0px' }
			);
		});

		it('adds a placeholder to empty containers', () => {
			const embed = makeEmbed({ 'data-type': 'youtube' });
			document.body.appendChild(embed);
			mgr.setupObserver([embed]);
			expect(embed.querySelector('.embed-placeholder')).not.toBeNull();
		});

		it('does not add a placeholder when one already exists', () => {
			const embed = makeEmbed({ 'data-type': 'youtube' });
			embed.innerHTML = '<div class="embed-placeholder">already here</div>';
			document.body.appendChild(embed);
			mgr.setupObserver([embed]);
			expect(embed.querySelectorAll('.embed-placeholder').length).toBe(1);
		});

		it('calls observe for each embed container', () => {
			const mockObserver = { observe: jest.fn(), unobserve: jest.fn(), disconnect: jest.fn() };
			IntersectionObserver.mockReturnValueOnce(mockObserver);

			const a = makeEmbed({ 'data-type': 'youtube' });
			const b = makeEmbed({ 'data-type': 'vimeo' });
			document.body.append(a, b);
			mgr.setupObserver([a, b]);
			expect(mockObserver.observe).toHaveBeenCalledTimes(2);
		});
	});
});
