#!/bin/sh

set -eu
cd "$(dirname $0)"/..

CB_DIR=.tmp/cb

find $CB_DIR -name '*.tex' \
  -exec perl -pi -e 's/\\theLanguage/english/g' {} \; \
  -exec perl -pi -e 's/\\prul\{/\\underline{/g' {} \; \
  -exec perl -pi -e 's/\\(?:instr|soloinstr)\{([^}]*)\}/\n\n$1/g' {} \; \
  -exec perl -pi -e 's/\\(begin|end)\{(leader|english)\}//g' {} \; \
  -exec perl -pi -e 's/\\tr(?:line)?{(.+)}/$1/g' {} \; \
  -exec perl -pi -e 's/\\newline//g' {} \; \
  -exec perl -pi -e 's/^.+PartSettings$//' {} \;
perl -ni -e 'print unless 10 .. 11' \
  $CB_DIR/chapters/english/pali-phonetics-and-pronunciation.tex
perl -ni -e 'print unless 28 .. 29' \
  $CB_DIR/chapters/english/pali-phonetics-and-pronunciation.tex
perl -pi -e 's/(\[[^\]]*\])/{$1}/g' \
  $CB_DIR/chapters/english/parittas.tex
