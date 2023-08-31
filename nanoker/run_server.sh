#!/bin/bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

virtualenv $SCRIPT_DIR/venv
source $SCRIPT_DIR/venv/bin/activate

pip install -r $SCRIPT_DIR/requirements.txt

python3 $SCRIPT_DIR/src/server.py