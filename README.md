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

## Building for Distribution

```bash
cd admin && npm run build && cd ..
bash build.sh
```

This creates `jug-ai.zip` ready for WordPress installation.
