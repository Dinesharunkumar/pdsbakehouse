# PD's Bake House

A static multi-page pastry shop website built with HTML, Tailwind CSS CDN and vanilla JavaScript. It is designed to work on GitHub Pages under a repository sub-path and uses relative links throughout.

## Folder structure

```text
.
├── 404.html
├── about-chef.html
├── about-shop.html
├── catalog.html
├── contact.html
├── css/
│   └── custom.css
├── data/
│   ├── cakes.json
│   ├── brownies.json
│   ├── diwali-sale.json
│   ├── gallery.json
│   ├── hampers.json
│   ├── menu.json
│   ├── reviews.json
│   └── site.json
├── index.html
├── js/
│   ├── app.js
│   ├── catalog.js
│   ├── carousel.js
│   └── order.js
├── previous-works.html
├── reviews.html
├── assets/
│   └── images/
│       ├── products/
│       │   ├── cakes/
│       │   ├── brownies/
│       │   ├── menu/
│       │   ├── hampers/
│       │   └── diwali/
│       └── gallery/
└── README.md
```

## How to enable or disable a page

Edit the `pages` array in `data/site.json`.

```json
{
    "id": "hampers",
    "title": "Hampers",
    "file": "catalog.html",
    "data": "hampers.json",
    "enabled": 0,
    "order": 8
}
```

- Set `enabled` to `1` to show it in the navigation and footer.
- Set `enabled` to `0` to hide it from menus and the home page.
- If someone visits the page URL directly, the app shows a friendly unavailable message.

## How to add a product

1. Add the product image files into the matching folder under `assets/images/products/`.
2. Add the item object to the relevant JSON file under `data/`.
3. Keep the item schema as:

```json
{
    "id": "cake-name",
    "name": "Cake Name",
    "category": "Signature Cakes",
    "description": "Short description",
    "images": [
        "assets/images/products/cakes/image-1.jpg",
        "assets/images/products/cakes/image-2.jpg"
    ],
    "badge": "Best Seller",
    "eggless": true,
    "available": true,
    "leadDays": 2,
    "originalPrice": 1850,
    "options": {
        "sizes": [{ "label": "1 kg", "price": 1850 }],
        "flavours": ["Vanilla", "Chocolate"],
        "allowMessage": true,
        "allowDate": true
    }
}
```

## How to add a new seasonal page

To add a new seasonal catalog page like `christmas-sale`:

1. Create a new JSON file in `data/`, for example `christmas-sale.json`.
2. Add a page entry in `data/site.json`:

```json
{
    "id": "christmas-sale",
    "title": "Christmas Sale",
    "file": "catalog.html",
    "data": "christmas-sale.json",
    "enabled": 1,
    "order": 12
}
```

3. The same `catalog.html?page=<id>` template will load it automatically; no new HTML file is required.

## Local preview

Because `fetch()` is used to load JSON files, run a local web server instead of opening HTML files directly.

### VS Code Live Server

- Open the project folder in VS Code.
- Right-click `index.html` and choose "Open with Live Server".

### Python

```bash
cd /path/to/project
python -m http.server 8000
```

Then open `http://localhost:8000`.

## GitHub Pages deployment

This project is a static website, so it can be hosted on GitHub Pages without any backend or build step.

### Why we use Python locally

The `python -m http.server 8000` command is only for local testing. It serves the files from your computer so you can preview the website in a browser before publishing.

GitHub Pages does not run Python for your site. It simply hosts the static files in your repository.

### Deploy to GitHub Pages

1. Push the project to a GitHub repository.
2. In GitHub, open the repository.
3. Go to Settings > Pages.
4. Under Source, choose Deploy from a branch.
5. Select the default branch such as `main`.
6. Leave the folder as `/` or `/root` depending on your repository layout.
7. Click Save.
8. GitHub will build and publish the site.
9. Your site will be live at:
   `https://username.github.io/repo-name/`

### Important for repo sub-path hosting

Because GitHub Pages usually lives under a sub-path like `/repo-name/`, all links and asset URLs must be relative, not root-based.

Good examples:

```html
<link rel="stylesheet" href="css/custom.css" />
<script type="module" src="js/app.js"></script>
<a href="catalog.html?page=cakes">Cakes</a>
```

Avoid:

```html
<link rel="stylesheet" href="/css/custom.css" />
<script src="/js/app.js"></script>
```

These absolute `/...` paths may not work when the site is hosted in a GitHub Pages folder.

### If you buy a custom domain

Yes — you can host this site on a custom domain too.

If you buy a domain like `yourbakery.com`, you can point it to GitHub Pages by configuring the domain in GitHub Pages and setting the DNS records with your domain provider.

Typical setup:

- GitHub Pages: enable custom domain in Settings > Pages
- Domain provider: create an A record or CNAME pointing to GitHub Pages
- Then the site can be served at `https://yourbakery.com`

This works well for static sites like this one because there is no backend or database to configure.

### Custom domain vs GitHub Pages subdomain

- GitHub Pages default: `https://username.github.io/repo-name/`
- Custom domain: `https://yourbakery.com`

Both are valid for this project, and both will work because the site is fully static.

### Quick deploy checklist

1. Create a GitHub repository and push all project files.
2. Open the repository in GitHub.
3. Go to Settings > Pages.
4. Select the branch to deploy from, usually `main`.
5. Save the Pages settings.
6. Wait a minute or two for GitHub to publish.
7. Open the generated URL.
8. If you have a custom domain, add it under Pages settings and update your DNS records.

### Custom domain DNS example

For a domain like `yourbakery.com`, your registrar usually needs:

- an `A` record pointing to GitHub Pages IPs, or
- a `CNAME` record pointing to `username.github.io`

Then, in GitHub, enter the custom domain and enable it in Pages settings.

## Photo folders to use

Put your actual product and gallery images in these folders:

- `assets/images/products/cakes/`
- `assets/images/products/brownies/`
- `assets/images/products/menu/`
- `assets/images/products/hampers/`
- `assets/images/products/diwali/`
- `assets/images/gallery/`

Recommended naming pattern:

- `product-name-1.jpg`
- `product-name-2.jpg`
- `product-name-3.jpg`
- `product-name-4.jpg`

Use WebP where possible for performance, but the code accepts JPG/JPEG/PNG/WebP images.
