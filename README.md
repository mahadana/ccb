# Community Chanting Books as HTML and JSON

The [Community Chanting Books] re-formatted into HTML and JSON.

## License

The reformatted HTML and JSON are copyrighted by [Amaravati Publications] and
licensed under [Creative Commons No Derivatives].

Computer source code is released as [Public Domain].

## Originals

- PDF Vol 1: https://www.amaravati.org/dhamma-books/chanting-book/
- PDF Vol 2: https://www.amaravati.org/dhamma-books/chanting-book-volume-two/
- LaTeX: https://github.com/profound-labs/community-chanting-book

## Build

The build toolchains assumes a Debian-like system running on Linux amd64.

```sh
sudo apt-get install -y nodejs npm # or as you see fit...
sudo apt-get install -y \
  curl git make mupdf-tools perl woff-tools woff2 \
  texlive texlive-fonts-extra texlive-latex-extra texlive-luatex
git clone https://github.com/mahadana/ccb-html-json.git
cd ccb-html-json
make
```

[amaravati publications]: https://www.amaravati.org/support/amaravati-publications/
[community chanting book]: https://github.com/profound-labs/community-chanting-book
[creative commons no derivatives]: https://creativecommons.org/licenses/by-nc-nd/3.0/
[creative commons public domain]: https://creativecommons.org/publicdomain/zero/1.0/
