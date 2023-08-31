#!/usr/bin/env python
# -*- coding: utf-8 -*-

import regex as re
import math
import os.path as path

stop_words = []
proto_words = []

with(open(path.join(path.dirname(__file__), "..", "stopwords.txt"), "r")) as f:
    stop_words = set([x.strip() for x in f.readlines()])

with(open(path.join(path.dirname(__file__), "..", "protowords.txt"), "r")) as f:
    proto_words = set([x.strip() for x in f.readlines()])


def clean_lines(lines):
    """
    Returns the text that are present in a file after removing formating
    marks

    :param lines: List of plain text lines
    :type lines: list[str]
    """
    for line in lines:
        line = line.strip()
        line = re.sub("[[:space:]]+\([^(]*\)", "", line).strip()
        line = re.sub(r"[0-9]+(\.[0-9]+)*\.?[[:space:]]*", "", line).strip()
        line = re.sub(r"[[:space:]]*((\.+)|([[:space:]]+))[[:space:]]*[0-9]*$", "", line).strip()
        if line:
            yield line

def get_keywords(lines, tagger, idf_doc_count, idf_table, threshold, maximum_words):
    """
    Finds keywords in the provided lines of text using the tf-idf measure.

    :param lines: Preprocessed lines of text
    :type lines: list[str]

    :param tagger: Loaded Morphodita model for normalization of the text
    :type tagger: Morphodita

    :param idf_doc_count: Number of documents used for creating the idf table
    :type idf_doc_count: int

    :param idf_table: Precomputed IDF table.
    :type idf_table: dict

    :param threshold: Minimum score that is acceptable for a keyword.

    :param maximum_words: Maximum number of words to be returned.

    """
    word_stat = {}
    word_count = 0

    for line in clean_lines(lines):
        norm_words = tagger.normalize(line)[0]

        for [lemma, orig] in norm_words:
            if lemma.lower() not in stop_words and "." not in lemma:
                if lemma not in word_stat:
                    word_stat[lemma] = [0, orig if orig.lower() in proto_words else lemma]
                word_stat[lemma][0] += 1
                word_count += 1
    word_count = float(word_count)

    tf_idf = {}
    for word, count in word_stat.items():
        tf = math.log(1 + count[0] / word_count)
        idf = math.log(idf_doc_count)
        if word in idf_table:
            idf = math.log(idf_doc_count / idf_table[word])
        tf_idf[word] = tf * idf

    sorted_terms = sorted(word_stat.items(), key=lambda x: -tf_idf[x[0]])
    return [[x[1][1], tf_idf[x[0]]] for x in sorted_terms if len(x[1][1]) < 20][:maximum_words]
