from src.starbucks_genie.api import app
from flask import Flask
# if __name__ == '__main__':
#     app.run(debug=True, port=3001) 
app = Flask(__name__)
app.config['DEBUG'] = True 
@app.route('/')
def home():
    return "Welcome to the Starbucks Genie API!"