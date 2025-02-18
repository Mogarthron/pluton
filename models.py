from app import db
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
    add_position = db.Column(Boolean, default=False)

    def __init__(self, user_name, password, role=None, user_number=None, **permisions):
        self.user_name = user_name
        self.password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        self.role = role
        self.user_number = user_number
        self.admin = permisions["admin"]
        self.quality_controll = permisions["quality_controll"]
        self.add_position = permisions["add_position"]

    def get_id(self):
        return self.uid
    
    def set_new_password(self, new_password):
        self.password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    def check_password(self, password):
        return bcrypt.checkpw(password.encode('utf-8'), self.password.encode('utf-8'))

    def __repr__(self):
        return f"<{self.username}: id {self.uid}, role {self.role}>"



class Werehouse(db.Model):
    __tablename__ = "werehouse"

    wid = db.Column(Integer, primary_key=True)
    werehouse_name = db.Column(String(128), nullable=False)
    werehouse_location = db.Column(String(128), nullable=False)
    address = db.Column(String(128), nullable=True)
    description = db.Column(String(256), nullable=True)

    storage_locations = db.relationship('Storage_location', backref='warehouse', lazy=True)


class Storage_location(db.Model):
    __tablename__ = "storage_location"

    sid = db.Column(Integer, primary_key=True)
    werehouse_id = db.Column(Integer, ForeignKey('werehouse.wid'), nullable=False)
    location_type = db.Column(String(128), nullable=False)
    location_code = db.Column(String(64), nullable=False)

    width = db.Column(Numeric(10, 2), nullable=False)
    height = db.Column(Numeric(10, 2), nullable=False)
    depth = db.Column(Numeric(10, 2), nullable=False)

    max_weight = db.Column(Numeric(10, 2), nullable=False)


class Item(db.Model):
    __tablename__ = "item"

    iid = db.Column(Integer, primary_key=True)
    item_name = db.Column(String(128), nullable=False)
    item_number = db.Column(String(10), nullable=False)
    item_type = db.Column(String(128), nullable=False)
    item_description = db.Column(String(256), nullable=True)

    created_at = db.Column(DateTime, default=dt.now(), nullable=False)
    last_update = db.Column(DateTime, default=dt.now(), nullable=False)

    safety_stock = db.Column(Integer, default=0, nullable=False)
    min_level = db.Column(Integer, default=0, nullable=False)
    max_level = db.Column(Integer, nullable=False)


    inventory_positions = db.relationship('Inventory_position', backref='item', lazy=True)

class Inventory_position(db.Model):
    __tablename__ = "inventory_position"

    ipid = db.Column(Integer, primary_key=True)   
    item_id = db.Column(Integer, db.ForeignKey('item.id'), nullable=False)
    
    entity_type = db.Column(String(20), nullable=False)  # 'supplier' lub 'customer'
    entity_name = db.Column(String(100), nullable=False)
    actual_price = db.Column(Float, default=0, nullable=False)
    
    stock_level = db.Column(Integer, nullable=False, default=0)
    reorder_point = db.Column(Integer, nullable=True)
    