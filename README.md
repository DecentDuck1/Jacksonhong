# Jackson Hong — Portfolio

Personal portfolio at https://jacksonhong.me.

This is a static HTML, CSS, and JavaScript site with no build step.

## Local preview

```sh
python3 -m http.server 4173
```

Open http://localhost:4173. Edit `index.html` for hardware projects and `software.html` for software projects. Both pages share `styles.css` and `app.js`; `software.css` contains the software page’s layout. The Software link in the main navigation connects the pages. Images and licensed fonts are in `assets/`.

## Hosting

GitHub Pages publishes the repository root from the `main` branch. `CNAME` sets the custom domain; `.nojekyll` keeps the files unchanged.
