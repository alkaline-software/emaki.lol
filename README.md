# emaki.lol

Docs site for emaki, built with [Quarto](https://quarto.org).

## Develop

```sh
quarto preview
```

## Deploy

Pushing to `main` runs `.github/workflows/publish.yml`, which renders the site and pushes it to the `gh-pages` branch. Netlify serves `emaki.lol` from that branch.

## Navbar widgets

`js/navbar-widgets.js` adds a dark-mode toggle, a keyboard-shortcuts button (press `?`), and a GitHub stars/forks dropdown. Styles are in `css/theme.scss`.
