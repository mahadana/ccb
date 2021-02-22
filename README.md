# Community Chanting Book as HTML and JSON

This is the [Community Chanting Book] re-formated into HTML and JSON.

## License

The reformatted HTML, JSON and fonts are copyrighted by [Amaravati Buddhist
Monastery] and licensed under [Creative Commons No Derivatives].

All source code in this repository is licensed as [Creative Commons Public
Domain].

## Originals

- PDF Vol 1: https://www.amaravati.org/dhamma-books/chanting-book/
- PDF Vol 2: https://www.amaravati.org/dhamma-books/chanting-book-volume-two/
- LaTeX: https://github.com/profound-labs/community-chanting-book

## Build

```sh
sudo apt-get install -y nodejs npm # or whatever you prefer...
sudo apt-get install -y \
  git make mupdf-tools pandoc perl woff-tools woff2 \
  texlive texlive-fonts-extra texlive-latex-extra texlive-luatex
git clone https://github.com/mahadana/ccb-html-json.git
cd ccb-html-json
make
```

[amaravati buddhist monastery]: https://www.amaravati.org/
[community chanting book]: https://github.com/profound-labs/community-chanting-book
[creative commons no derivatives]: https://creativecommons.org/licenses/by-nc-nd/3.0/
[creative commons public domain]: https://creativecommons.org/publicdomain/zero/1.0/
