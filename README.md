# practice-repo

Now home to **Shay's Hearth**, a sample small-batch home goods shop built with Jekyll.

Practicing making repos.

## Files

- `hello.py` – a tiny Python script that prints a greeting
- `notes.md` – a place for practice notes
- `.gitignore` – tells Git which files to ignore

## Try it

```bash
python hello.py
```

## Jekyll site

This repo is also a Jekyll site published with GitHub Pages:
https://alanschafer.github.io/practice-repo/

- `_config.yml` – site settings (title, theme)
- `index.md` – home page
- `about.md` – about page
- `_posts/` – blog posts named `YYYY-MM-DD-title.md`

### Custom theme

The site uses a fully custom, hand-built theme (no Minima):

- `_layouts/` – page templates (`default`, `home`, `page`, `post`)
- `_includes/` – shared pieces (head, header, footer, logo)
- `assets/css/style.scss` – all styles; color tokens for dark and light mode are at the top
- `assets/js/main.js` – theme toggle, scroll reveals, reading progress, hover effects, copy buttons
- `_products/` – one Markdown file per product (title, price, category, image, details)
- `shop/index.html` – the shop page with category filters
- `journal/index.html` – the Journal archive
- `assets/img/` – the hearth photo and product images
- `404.html` – custom not-found page
