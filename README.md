# Metro mdBook theme

<p align="center">
  <a href="https://sweaxizone.github.io/metro-mdbook/demo"><img src="https://img.shields.io/badge/Demo-gray"></a>
</p>

A nice Metro design language based theme for mdBook.

[A demo.](https://sweaxizone.github.io/metro-mdbook/demo)

## To do

- [ ] Replace "all" FontAwesome icons by outline Metro icons (missing some)

## Getting started

Requisites:

- mdBook 0.5.2 (newer patches *may be* compatible)

Run:

```sh
git clone https://github.com/sweaxizone/metro-mdbook com.sweaxizone.metro
```

Configure to point to that theme's `theme/` directory on your book manifest:

```toml
[output.html]
theme = "com.sweaxizone.metro/theme"
```