@echo off
echo Starting FlexItOut Server...
python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt
set FLASK_APP=app.py
flask run --host=0.0.0.0 --port=5000
