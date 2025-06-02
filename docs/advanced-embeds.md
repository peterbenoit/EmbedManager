# Advanced Embedding with EmbedManager

EmbedManager now supports a wide variety of content types beyond the basics. Here's how to use each embed type:

## Twitter/X Embed

```html
<div class="embed-container"
     data-type="twitter"
     data-src="1234567890123456789"
     data-title="View this tweet"
     data-lang="en"
     data-theme="dark">
</div>
```

You can use either the tweet ID or the full tweet URL as the `data-src`. Additional attributes:

- `data-lang`: Set the language (default: "en")
- `data-theme`: Set theme to "light" or "dark" (default: "light")

## Instagram Embed

```html
<div class="embed-container"
     data-type="instagram"
     data-src="https://www.instagram.com/p/ABCDEFGHIJK/"
     data-title="Instagram post">
</div>
```

## TikTok Embed

```html
<div class="embed-container"
     data-type="tiktok"
     data-src="https://www.tiktok.com/@username/video/1234567890123456789"
     data-title="TikTok video">
</div>
```

## SoundCloud Embed

```html
<div class="embed-container"
     data-type="soundcloud"
     data-src="https://soundcloud.com/artist/track-name"
     data-color="ff5500"
     data-autoplay="false"
     data-show-comments="true"
     data-title="Listen to this track">
</div>
```

Additional attributes:

- `data-color`: Hex color for player (default: "ff5500")
- `data-autoplay`: Set to "true" to autoplay (default: "false")
- `data-show-comments`: Set to "true" to show comments (default: "true")

## Spotify Embed

```html
<div class="embed-container"
     data-type="spotify"
     data-src="https://open.spotify.com/track/1234567890123456789"
     data-title="Listen on Spotify">
</div>
```

Works with tracks, albums, playlists, and podcast episodes. Just use the standard Spotify URL.

## GitHub Gist Embed

```html
<div class="embed-container"
     data-type="gist"
     data-src="username/gist-id"
     data-title="Code snippet">
</div>
```

You can use either the Gist ID or the full Gist URL.

## Google Maps Embed

```html
<div class="embed-container"
     data-type="maps"
     data-src="https://www.google.com/maps?q=New+York+City"
     data-api-key="YOUR_GOOGLE_MAPS_API_KEY"
     data-title="View on Google Maps">
</div>
```

For some maps functionality, you'll need to provide your Google Maps API key via the `data-api-key` attribute.
