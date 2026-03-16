# EmbedManager

A lightweight, dependency-free JavaScript library for embedding content from YouTube, Vimeo, Twitch, CodePen, TikTok, Spotify, SoundCloud, GitHub Gists, Google Maps, Twitter/X, and Instagram — with **lazy loading** via the Intersection Observer API.

## Features

- Lazy loads iframes only when they scroll into view
- Supports 14+ embed types out of the box
- Privacy-enhanced YouTube (`youtube-nocookie.com`) by default
- Vimeo `dnt=1` (Do Not Track) by default
- Sandboxed `<iframe>` for raw website embeds
- Accessible (`aria-label`, `role="alert"`, `aria-live`)
- Zero dependencies — pure vanilla JS (~8.6 KB minified)

## CDN Usage

### jsDelivr (recommended)

```html
<!-- Pinned to a specific version -->
<script src="https://cdn.jsdelivr.net/npm/embed-manager@1.0.0/dist/embedManager.min.js"></script>

<!-- Always latest -->
<script src="https://cdn.jsdelivr.net/npm/embed-manager/dist/embedManager.min.js"></script>
```

### unpkg

```html
<!-- Pinned to a specific version -->
<script src="https://unpkg.com/embed-manager@1.0.0/dist/embedManager.min.js"></script>

<!-- Always latest -->
<script src="https://unpkg.com/embed-manager/dist/embedManager.min.js"></script>
```

Loading the script auto-initializes `window.EmbedManager` and begins observing any `.embed-container` elements on the page.

## npm

```sh
npm install embed-manager
```

```js
const EmbedManager = require('embed-manager');
const mgr = new EmbedManager({ rootMargin: '300px 0px' });
```

## Quick Start

Add a container with `data-type` and `data-src`:

```html
<!-- YouTube -->
<div class="embed-container"
     data-type="youtube"
     data-src="https://www.youtube.com/embed/dQw4w9WgXcQ"
     data-title="Never Gonna Give You Up">
</div>

<!-- Vimeo with privacy hash -->
<div class="embed-container"
     data-type="vimeo"
     data-src="https://player.vimeo.com/video/123456789"
     data-hash="myPrivateHash"
     data-title="My Vimeo Video">
</div>

<!-- CodePen -->
<div class="embed-container"
     data-type="codepen"
     data-src="https://codepen.io/user/pen/abcdef"
     data-default-tab="result"
     data-title="My Pen">
</div>

<!-- Spotify track -->
<div class="embed-container"
     data-type="spotify"
     data-src="https://open.spotify.com/track/abc123"
     data-title="My Track"
     data-aspect-ratio="unset"
     data-height="152px">
</div>
```

Then include EmbedManager via CDN (or npm) — no further setup needed.

## Supported Types

| `data-type` | Description |
|-------------|-------------|
| `youtube` | YouTube (auto-upgraded to `youtube-nocookie.com`) |
| `vimeo` | Vimeo (supports `data-hash` for private videos) |
| `twitch` | Twitch player/chat |
| `codepen` | CodePen pens & embeds |
| `spotify` | Spotify tracks, albums, playlists, episodes |
| `soundcloud` | SoundCloud tracks |
| `tiktok` | TikTok videos |
| `twitter` / `x` | Tweets (via Twitter widget.js blockquote) |
| `instagram` | Instagram posts & reels |
| `gist` / `github` | GitHub Gists (via script embed) |
| `maps` / `google-maps` | Google Maps embed |
| `website` | Any URL (sandboxed iframe) |

## Options

```js
new EmbedManager({
  rootMargin: '200px 0px' // IntersectionObserver margin (default)
});
```

## Data Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `data-type` | — | Embed type (required) |
| `data-src` | — | Source URL (required) |
| `data-title` | `"Untitled Embed"` | iframe/aria title |
| `data-width` | `100%` | Container width |
| `data-height` | — | Explicit height (disables aspect-ratio) |
| `data-aspect-ratio` | `16/9` | CSS aspect-ratio |
| `data-autoplay` | — | Set `"true"` to autoplay (YouTube, Vimeo) |
| `data-hash` | — | Vimeo privacy hash |
| `data-app-id` | — | Vimeo app_id |
| `data-theme-id` | — | CodePen theme ID |
| `data-default-tab` | `result` | CodePen default tab |
| `data-editable` | — | Set `"true"` for editable CodePen |
| `data-preview` | — | Set `"true"` for CodePen preview mode |
| `data-color` | `ff5500` | SoundCloud player color |
| `data-show-comments` | — | Set `"true"` for SoundCloud comments |
| `data-api-key` | — | Google Maps API key |
| `data-lang` | `en` | Twitter embed language |
| `data-theme` | `light` | Twitter embed theme |

## API

```js
// Auto-initialized on page load as window.EmbedManager
// Or create your own instance:
const mgr = new EmbedManager();

// Process a container immediately (bypasses IntersectionObserver)
mgr.processContainer(document.querySelector('.embed-container'));

// Add a dynamically created container to the lazy-load queue
mgr.addEmbed(document.querySelector('.new-embed'));
```

## Release Steps

```sh
# 1. Bump version
npm version patch   # or minor / major

# 2. Preview what will be published
npm run pack:check

# 3. Publish (runs tests + build automatically via prepublishOnly)
npm publish

# 4. Push tag to GitHub
git push origin main --tags
```

## License

MIT © [Peter Benoit](https://github.com/peterbenoit)
