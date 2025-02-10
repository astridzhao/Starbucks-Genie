from src.starbucks_genie.api import app
from flask import Flask
from flask_cors import CORS
# if __name__ == '__main__':
#     app.run(debug=True, port=3001) 
CORS(app, 
     origins=["http://localhost:3000", "https://starbucks-genie.vercel.app"],
     allow_headers=["Content-Type"],
     supports_credentials=True,
     methods=["GET", "POST", "OPTIONS"])

@app.route('/')
def home():
    return "Welcome to the Starbucks Genie API!"