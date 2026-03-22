# Jug.ai - AI Chatbot for WordPress

A WordPress plugin that adds an AI chatbot trained on your website content. Powered by [Jug.ai](https://jug.ai).

## Requirements

- WordPress 6.0+
- PHP 7.4+

## Installation

### From ZIP

1. Download the latest release `.zip` file
2. In WordPress admin, go to **Plugins > Add New > Upload Plugin**
3. Upload the zip and activate
4. Navigate to **Jug.ai** in the admin sidebar

### From Source

```bash
git clone https://github.com/jug-ai/jug-ai-wordpress.git
cd jug-ai-wordpress/admin
npm install
npm run build
```

Then symlink or copy the plugin folder into `wp-content/plugins/`.

## Development

```bash
cd admin
npm install
npm start    # Watch mode with hot reload
```

The React admin UI source lives in `admin/src/`. The build output goes to `admin/build/` which is loaded by the PHP plugin.

## Architecture

- **PHP Plugin Core** (`includes/`): Bootstrap, API client, REST proxy, widget injection, settings
- **React Admin UI** (`admin/src/`): Login, onboarding wizard, dashboard, conversations, settings
- **Widget**: Injected via `wp_footer` hook, loads chat/agent script from app.jug.ai

### Dashboard “website” cards (bots)

Cards are loaded from the **Jug AI HTTP API** (`GET /bots`) using your OTP login — **not** from WordPress or MongoDB. You must be signed in inside the plugin; then you see one card per bot in your Jug account.

### Training URL: localhost vs production

The scraper needs a **reachable public URL**. A typical `http://localhost/...` WordPress install is not something Jug’s servers can crawl, so use a public site for dev testing.

- **Production (default):** the plugin passes `home_url()` as `defaultTrainingUrl` (your live WordPress site).
- **Local / dev:** point training at a public site (e.g. `https://attio.com`) with a small filter in a mu-plugin or theme `functions.php`:

```php
add_filter( 'jug_ai_default_training_url', function () {
	return 'https://attio.com';
});
```

Remove the filter (or return `home_url()`) when you want onboarding to use the real WordPress URL in production.

## Building for Distribution

```bash
cd admin && npm run build && cd ..
bash build.sh
```

This creates `jug-ai.zip` ready for WordPress installation.
