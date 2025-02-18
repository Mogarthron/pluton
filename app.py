from flask import Flask 
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

app = Flask(__name__, template_folder='templates')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///pluton_db.db'
app.secret_key = "Secret Key"
db = SQLAlchemy(app)

migrate = Migrate(app, db)

from routes import *


if __name__ == "__main__":
    app.run(debug=True)
