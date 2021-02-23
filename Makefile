CB_GIT_URL   := https://github.com/profound-labs/community-chanting-book.git
CB_GIT_HASH  := f67b543b3314d7dad38e1d59ce4e945bfb7e6dff
WORDS_GIT_URL := https://github.com/dwyl/english-words.git
WORDS_GIT_HASH := 11735d0d68f051b817ad224e14d999acc94fcf00
PANDOC_VERSION := 2.11.4
PANDOC_URL   := https://github.com/jgm/pandoc/releases/download/$(PANDOC_VERSION)/pandoc-$(PANDOC_VERSION)-linux-amd64.tar.gz

DIST_DIR     := dist
SRC_DIR      := src
TMP_DIR      := .tmp
CB_DIR       := $(TMP_DIR)/cb
PRE_DIR      := $(TMP_DIR)/pre
WORDS_DIR    := $(TMP_DIR)/words
PANDOC_DIR   := $(TMP_DIR)/pandoc

WORDS_DICT   := $(WORDS_DIR)/words_dictionary.json
PANDOC_BIN   := $(PANDOC_DIR)/pandoc
CB_DEPS      := $(CB_DIR)/main-en-vol1.tex $(CB_DIR)/main-en-vol2.tex
HTML_DEPS    := $(PRE_DIR)/1.html $(PRE_DIR)/2.html
TOC_DEPS     := $(PRE_DIR)/1.toc $(PRE_DIR)/2.toc

JS_DEPS      := $(SRC_DIR)/shared.js $(SRC_DIR)/config.yaml node_modules
SRC_PREPROC  := $(SRC_DIR)/preprocess.sh
SRC_MKHTML   := $(SRC_DIR)/make-html.js
SRC_MKINDEX  := $(SRC_DIR)/make-index.js
SRC_MKJSON   := $(SRC_DIR)/make-json.js
SRC_MK1HTML  := $(SRC_DIR)/make-one-html.js
SRC_MK1JSON  := $(SRC_DIR)/make-one-json.js
SRC_STYLE    := $(SRC_DIR)/style.css

DIST_JSON    := $(DIST_DIR)/json/ccb-1.1.1.json
DIST_1JSON   := $(DIST_DIR)/ccb.json
DIST_HTML    := $(DIST_DIR)/html/ccb-1.1.1.html
DIST_1HTML   := $(DIST_DIR)/ccb.html
DIST_INDEX   := $(DIST_DIR)/index.html
DIST_STYLE   := $(DIST_DIR)/style.css

FONTS        := AlegreyaXSansSC-Bold \
		GentiumIncantation-Italic \
		GentiumIncantation-Regular \
		Ubuntu-L \
		Ubuntu-X-Medium

DIST_FONTS   := $(patsubst %,$(DIST_DIR)/fonts/%.woff,$(FONTS)) \
		$(patsubst %,$(DIST_DIR)/fonts/%.woff2,$(FONTS))

.PHONY: all clean

all: $(DIST_JSON) $(DIST_1JSON) $(DIST_HTML) $(DIST_1HTML) $(DIST_INDEX) \
	$(DIST_STYLE) $(DIST_FONTS)

$(DIST_INDEX): $(JS_DEPS) $(SRC_MKINDEX) $(DIST1_JSON)
	npm run make-index

$(DIST_1HTML): $(JS_DEPS) $(SRC_MK1HTML) $(DIST_1JSON)
	npm run make-one-html

$(DIST_HTML): $(JS_DEPS) $(SRC_MKHTML) $(DIST_1JSON)
	npm run make-html

$(DIST_1JSON): $(JS_DEPS) $(SRC_MK1JSON) $(DIST_JSON) $(TOC_DEPS)
	npm run make-one-json

$(DIST_JSON): $(JS_DEPS) $(SRC_MKJSON) $(HTML_DEPS) $(WORDS_DICT)
	npm run make-json

.SECONDEXPANSION:
$(DIST_DIR)/fonts/%: $$(wildcard $$(CB_DIR)/fonts/$$(basename %).*)
	@mkdir -p $(@D)
	@cp -f $< $(@D)/$(<F)
	@if test $(suffix $@) = .woff; then \
		sfnt2woff $(@D)/$(<F); \
	else \
		woff2_compress $(@D)/$(<F); \
	fi
	@rm -f $(@D)/$(<F)

$(DIST_STYLE): $(SRC_STYLE)
	@mkdir -p $(@D)
	cp -f $< $@

$(PRE_DIR)/%.html: $(CB_DIR)/main-en-vol%.tex $(PANDOC_BIN)
	@mkdir -p $(PRE_DIR)
	cd $(CB_DIR) && $(abspath PANDOC_BIN) $(abspath $<) -o $(abspath $@)

$(PRE_DIR)/1.toc: $(CB_DIR)/pdf/Chanting-Book-EN-Vol-1-Web-2015-09-16.pdf
	@mkdir -p $(PRE_DIR)
	mutool show -e $< outline > $@

$(PRE_DIR)/2.toc: $(CB_DIR)/pdf/Chanting-Book-EN-Vol-2-Web-2015-10-08.pdf
	@mkdir -p $(PRE_DIR)
	mutool show -e $< outline > $@

$(CB_DEPS): $(CB_DIR) $(SRC_PREPROC)
	cd $(CB_DIR) && git reset --hard $(CB_GIT_HASH)
	sh $(SRC_PREPROC)
	touch $(CB_DEPS)

$(CB_DIR):
	test -d $@ || git clone $(CB_GIT_URL) $(CB_DIR)
	@touch $@

$(PANDOC_BIN):
	@mkdir -p $(@D)
	cd $(PANDOC_DIR) && curl -Ls $(PANDOC_URL) | \
		tar zxv --strip-components=2 \
		pandoc-$(PANDOC_VERSION)/bin/pandoc
	@touch $@

$(WORDS_DICT): $(WORDS_DIR)
	cd $(WORDS_DIR) && git reset --hard $(WORDS_GIT_HASH)
	@touch $@

$(WORDS_DIR):
	test -d $@ || git clone $(WORDS_GIT_URL) $(WORDS_DIR)
	@touch $@

node_modules: package.json package-lock.json
	npm clean-install
	@touch $@

clean:
	rm -rf $(DIST_DIR) $(TMP_DIR) node_modules
