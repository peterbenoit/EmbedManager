# EmbedManager

**A lightweight, zero-dependency JavaScript library for intelligent, lazy-loaded embeds.**

[![npm version](https://img.shields.io/npm/v/embed-manager)](https://www.npmjs.com/package/embed-manager)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![jsDelivr](https://data.jsdelivr.com/v1/package/npm/embed-manager/badge)](https://www.jsdelivr.com/package/npm/embed-manager)

---

## What Is EmbedManager?

EmbedManager is a small (~8.6 KB minified) vanilla JavaScript library that handles embedding third-party content — YouTube videos, Vimeo clips, Spotify tracks, GitHub Gists, Google Maps, and more — without bloating your page with iframe overhead on load.

It works by observing the DOM with the [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API). Iframes are not injected until the embed container scrolls near the viewport, deferring network requests and saving bandwidth for content the user may never reach.

---

## Why I Built It

Every platform has its own embed format. YouTube wants `youtube-nocookie.com` for privacy. Twitch requires the current domain as a `parent` query parameter. Twitter/X embeds rely on a blockquote + external widget script. GitHub Gists inject a `<script>` tag. Getting all of these right — especially in a way that respects privacy, handles errors gracefully, and doesn't tank page performance — is tedious boilerplate to repeat across projects.

EmbedManager abstracts all of that into a single consistent pattern: add a `<div class="embed-container">` with a few `data-*` attributes, include the script, and you're done. Performance, privacy defaults, and accessibility are handled for you.

---

## Who Is It For?

- **Content creators and bloggers** who embed media from multiple platforms and want a single drop-in solution.
- **Frontend developers** building media-heavy pages who want lazy loading without a heavy dependency.
- **Documentation authors** who embed live demos (CodePen), audio (SoundCloud, Spotify), maps, and video in the same page.
- **Teams** that want privacy-respecting embeds by default (no tracking pixels or cookies loaded until the user actually reaches the content).

---

## Installation

### CDN (zero config)

```html
<script src="https://cdn.jsdelivr.net/npm/embed-manager/dist/embedManager.min.js"></script>
```

After the script loads, `window.EmbedManager` is auto-initialized and begins observing all `.embed-container` elements on the page.

### npm

```bash
npm install embed-manager
```

```javascript
import EmbedManager from 'embed-manager';

const mgr = new EmbedManager();
```

---

## Quick Start

Add a div with the class `embed-container`, set `data-type` to the platform, and point `data-src` at the content URL:

```html
<!-- YouTube -->
<div class="embed-container"
     data-type="youtube"
     data-src="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
     data-title="Never Gonna Give You Up">
</div>

<!-- Spotify track -->
<div class="embed-container"
     data-type="spotify"
     data-src="https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT"
     data-title="Never Gonna Give You Up"
     data-aspect-ratio="unset"
     data-height="152px">
</div>

<script src="https://cdn.jsdelivr.net/npm/embed-manager/dist/embedManager.min.js"></script>
```

That's it. EmbedManager handles the rest: URL normalization, iframe injection, lazy loading, and cleanup.

---

## Supported Platforms

| `data-type` value | Platform | Notes |
|---|---|---|
| `youtube` | YouTube | Auto-switches to `youtube-nocookie.com` |
| `vimeo` | Vimeo | `dnt=1` applied by default; supports private/unlisted hash |
| `twitch` | Twitch | Auto-injects `parent` domain parameter |
| `codepen` | CodePen | Preview mode, themes, editable pens |
| `spotify` | Spotify | Tracks, albums, playlists, podcast episodes |
| `soundcloud` | SoundCloud | Customizable player color |
| `tiktok` | TikTok | Converts share URLs to embed format |
| `twitter` or `x` | Twitter/X | Transforms blockquote → widget; accepts Tweet IDs |
| `instagram` | Instagram | Transforms blockquote → embed.js |
| `gist` or `github` | GitHub Gists | Script-based embed wrapped in srcdoc iframe |
| `maps` or `google-maps` | Google Maps | Requires API key via `data-api-key` |
| `website` | Any URL | Sandboxed iframe |

---

## Configuration

### Constructor Options

When using the npm module, pass options to the constructor:

```javascript
const mgr = new EmbedManager({
  rootMargin: '200px 0px', // Load embeds 200px before they enter the viewport
  embedTimeout: 15000      // MS before script-based embeds (Twitter, Instagram, Gist) time out
});
```

| Option | Type | Default | Description |
|---|---|---|---|
| `rootMargin` | `string` | `'200px 0px'` | IntersectionObserver root margin — how early to start loading |
| `embedTimeout` | `number` | `15000` | Timeout in milliseconds for third-party script-based embeds |

### Data Attributes

All configuration for individual embeds is done via `data-*` attributes on the container element.

#### Universal attributes

| Attribute | Required | Default | Description |
|---|---|---|---|
| `data-type` | yes | — | Platform identifier (see table above) |
| `data-src` | yes | — | Source URL or content ID |
| `data-title` | no | `'Untitled Embed'` | Sets the iframe `title` and `aria-label` |
| `data-width` | no | `100%` | Container width |
| `data-height` | no | — | Explicit height; disables aspect-ratio |
| `data-aspect-ratio` | no | `16/9` | CSS `aspect-ratio` applied when no height is set |

#### YouTube

| Attribute | Description |
|---|---|
| `data-autoplay` | Set to `"true"` to autoplay the video |

#### Vimeo

| Attribute | Description |
|---|---|
| `data-autoplay` | Set to `"true"` to autoplay |
| `data-hash` | Privacy hash for unlisted or private videos |
| `data-app-id` | Vimeo `app_id` parameter |

#### CodePen

| Attribute | Default | Description |
|---|---|---|
| `data-theme-id` | — | CodePen theme ID |
| `data-default-tab` | `result` | Which tab to show: `html`, `css`, `js`, or `result` |
| `data-editable` | — | Set to `"true"` to make the pen editable |
| `data-preview` | — | Set to `"true"` for preview mode |

#### SoundCloud

| Attribute | Default | Description |
|---|---|---|
| `data-color` | `ff5500` | Player color as a hex value (without `#`) |
| `data-show-comments` | — | Set to `"true"` to show comments |

#### Twitter / X

| Attribute | Default | Description |
|---|---|---|
| `data-lang` | `en` | Language code for the embed UI |
| `data-theme` | `light` | Theme: `light` or `dark` |

#### Google Maps

| Attribute | Description |
|---|---|
| `data-api-key` | **Required.** Your Google Maps Embed API key |

---

## API Reference

### `new EmbedManager(options?)`

Creates a new instance and begins observing `.embed-container` elements in the DOM.

### `.processContainer(container)`

Immediately injects the iframe into a given container element, bypassing the IntersectionObserver. Useful when you need an embed to load right away regardless of scroll position.

```javascript
const container = document.querySelector('#my-embed');
mgr.processContainer(container);
```

### `.addEmbed(container)`

Adds a dynamically created container element to the lazy-load queue. Use this after appending new embed containers to the DOM at runtime.

```javascript
const el = document.createElement('div');
el.className = 'embed-container';
el.setAttribute('data-type', 'youtube');
el.setAttribute('data-src', 'https://www.youtube.com/watch?v=xyz');
document.body.appendChild(el);

mgr.addEmbed(el);
```

### `.isValidUrl(url)`

Returns `true` if the URL uses `https:` or `http:`. Blocks `javascript:` and `data:` URIs. Primarily used internally, but available if you need it.

---

## Examples

### Vimeo with a private video hash

```html
<div class="embed-container"
     data-type="vimeo"
     data-src="https://vimeo.com/123456789"
     data-hash="myPrivateHash"
     data-title="Private Reel">
</div>
```

### Editable CodePen showing HTML and result tabs

```html
<div class="embed-container"
     data-type="codepen"
     data-src="https://codepen.io/username/pen/abcdef"
     data-default-tab="html,result"
     data-editable="true"
     data-title="My Demo Pen">
</div>
```

### GitHub Gist

```html
<div class="embed-container"
     data-type="gist"
     data-src="https://gist.github.com/username/abc123def456"
     data-title="Example Gist">
</div>
```

### Google Maps

```html
<div class="embed-container"
     data-type="maps"
     data-src="https://www.google.com/maps/place/Eiffel+Tower"
     data-api-key="YOUR_API_KEY"
     data-title="Eiffel Tower">
</div>
```

### Custom aspect ratio / fixed height

```html
<!-- Square embed -->
<div class="embed-container"
     data-type="vimeo"
     data-src="https://vimeo.com/123456789"
     data-aspect-ratio="1/1"
     data-title="Square video">
</div>

<!-- Fixed height (disables aspect-ratio) -->
<div class="embed-container"
     data-type="spotify"
     data-src="https://open.spotify.com/album/abc123"
     data-height="380px"
     data-aspect-ratio="unset"
     data-title="My Album">
</div>
```

### Dynamic embed via JavaScript

```javascript
import EmbedManager from 'embed-manager';

const mgr = new EmbedManager({ rootMargin: '400px 0px' });

function addVideo(url) {
  const container = document.createElement('div');
  container.className = 'embed-container';
  container.setAttribute('data-type', 'youtube');
  container.setAttribute('data-src', url);
  container.setAttribute('data-title', 'Dynamic video');

  document.querySelector('#video-list').appendChild(container);
  mgr.addEmbed(container);
}
```

---

## Privacy & Security

EmbedManager makes privacy-respecting choices by default:

- **YouTube** embeds use `youtube-nocookie.com`, which prevents YouTube from setting cookies unless the user interacts with the player.
- **Vimeo** embeds include `dnt=1` (Do Not Track), which asks Vimeo not to track the viewer.
- **URL validation** — Only `https:` and `http:` URLs are accepted. `javascript:` and `data:` URIs are rejected.
- **Website embeds** use a sandboxed iframe with a restrictive `sandbox` attribute and a `referrerpolicy` of `no-referrer-when-downgrade`.
- Accessibility attributes (`aria-label`, `role`, `aria-live`) are applied automatically to error states.

---

## Browser Support

EmbedManager requires the [Intersection Observer API](https://caniuse.com/intersectionobserver), which is supported in all modern browsers. There is no built-in polyfill — if you need to support older environments, include a polyfill before the library.

---

## License

MIT © [Peter Benoit](https://github.com/peterbenoit)
