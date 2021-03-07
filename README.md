# Community Chanting Books as HTML and JSON

The [Community Chanting Books] re-formatted into HTML and JSON.

[View / download the HTML and JSON](https://mahadana.github.io/ccb/).

## Originals

- Community Chanting Book - English - Volume 1 ([PDF](https://raw.githubusercontent.com/profound-labs/community-chanting-book/master/pdf/Chanting-Book-EN-Vol-1-Web-2015-09-16.pdf)) ([Publisher](https://www.amaravati.org/dhamma-books/chanting-book/))
- Community Chanting Book - English - Volume 2 ([PDF](https://raw.githubusercontent.com/profound-labs/community-chanting-book/master/pdf/Chanting-Book-EN-Vol-2-Web-2015-10-08.pdf)) ([Publisher](https://www.amaravati.org/dhamma-books/chanting-book-volume-two/))
- LaTeX Source Code ([GitHub](https://github.com/profound-labs/community-chanting-book))

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

## License

The reformatted HTML and JSON are copyrighted by [Amaravati Buddhist Monastery]
/ [Amaravati Publications] and licensed under [Creative Commons No Derivatives].

Computer source code is released as [Public Domain].

[amaravati buddhist monastery]: https://www.amaravati.org/
[amaravati publications]: https://www.amaravati.org/support/amaravati-publications/
[community chanting books]: https://github.com/profound-labs/community-chanting-book
[creative commons no derivatives]: https://creativecommons.org/licenses/by-nc-nd/3.0/
[public domain]: https://creativecommons.org/publicdomain/zero/1.0/
