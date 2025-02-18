from qualitycontroll_flask import db
from sqlalchemy import  String, Integer, Numeric, SmallInteger, Boolean, Float, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime as dt
import bcrypt
from flask_login import UserMixin


class Users(db.Model, UserMixin):
    __tablename__ = "users"

    uid = db.Column(Integer, primary_key=True)
    user_name = db.Column(String(128), nullable=False, unique=True)
    password = db.Column(String(512), nullable=False) 
    role = db.Column(String(128), nullable=False)   
    user_number = db.Column(String(10), nullable=True)

    admin = db.Column(Boolean, default=False)
    quality_controll = db.Column(Boolean, default=True)

    def __init__(self, user_name, password, role=None, user_number=None, **permisions):
        self.user_name = user_name
        self.password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        self.role = role
        self.user_number = user_number
        self.admin = permisions["admin"]
        self.quality_controll = permisions["quality_controll"]



    def get_id(self):
        return self.uid
    
    def set_new_password(self, new_password):
        self.password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    def check_password(self, password):
        return bcrypt.checkpw(password.encode('utf-8'), self.password.encode('utf-8'))

    def __repr__(self):
        return f"<{self.username}: id {self.uid}, role {self.role}>"