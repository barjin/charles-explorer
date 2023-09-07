#!/usr/bin/env python

from fastapi import FastAPI, Request
import uvicorn
import os
import pickle
import keywords
import argparse
from Morphodita import Morphodita

cs_tagger = None
cs_idf_doc_count = None
cs_idf_table = None

en_tagger = None
en_idf_doc_count = None
en_idf_table = None

app = FastAPI()

@app.post('/')
async def post_request(data: Request, lang: str = "en"):

    tagger = lang == "cs" and cs_tagger or en_tagger
    idf_doc_count = lang == "cs" and cs_idf_doc_count or en_idf_doc_count
    idf_table = lang == "cs" and cs_idf_table or en_idf_table

    lines = str((await data.body()).decode('utf-8')).splitlines()
    return keywords.get_keywords(lines, tagger, idf_doc_count, idf_table, 0, 15)

@app.get('/status')
def get_status():
    return "OK"

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Runs the KER server.')
    parser.add_argument("--port", help="Port the server runs on", type=int, default=8547)
    parser.add_argument("--host", help="IP address the server will run at", type=str, default="0.0.0.0")
    args = parser.parse_args()

    args.cs_morphodita = os.path.join(os.path.dirname(os.path.realpath(__file__)), "../models/", "cs.tagger")
    args.cs_idf = os.path.join(os.path.dirname(os.path.realpath(__file__)), "../models/", "cs_idf_table.pickle")
    args.en_morphodita = os.path.join(os.path.dirname(os.path.realpath(__file__)), "../models/", "en.tagger")
    args.en_idf = os.path.join(os.path.dirname(os.path.realpath(__file__)), "../models/", "en_idf_table.pickle")


    if os.path.exists(args.cs_morphodita):
        cs_tagger = Morphodita(args.cs_morphodita)
    else:
        print("File with Czech Morphodita model does not exist: {}".format(args.cs_morphodita))
        exit(1)

    if os.path.exists(args.cs_idf):
        f_idf = open(args.cs_idf, 'rb')
        cs_idf_doc_count = float(pickle.load(f_idf))
        cs_idf_table = pickle.load(f_idf)
        f_idf.close()
    else:
        print("File with Czech IDF model does not exist: {}".format(args.cs_idf))
        exit(1)

    if os.path.exists(args.en_morphodita):
        en_tagger = Morphodita(args.en_morphodita)
    else:
        print("File with English Morphodita model does not exist: {}".format(args.en_morphodita))
        exit(1)

    if os.path.exists(args.en_idf):
        f_idf = open(args.en_idf, 'rb')
        en_idf_doc_count = float(pickle.load(f_idf))
        en_idf_table = pickle.load(f_idf)
        f_idf.close()
    else:
        print("File with English IDF model does not exist: {}".format(args.en_idf))
        exit(1)

uvicorn.run(app, host=args.host, port=args.port)
