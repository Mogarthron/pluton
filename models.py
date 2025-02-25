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
    add_wearehouse = db.Column(Boolean, default=False)

    def __init__(self, user_name, password, role=None, user_number=None, **permisions):
        self.user_name = user_name
        self.password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        self.role = role
        self.user_number = user_number
        self.admin = permisions["admin"]
        self.quality_controll = permisions["quality_controll"]
        self.add_position = permisions["add_position"]
        self.add_werehouse = permisions["add_wearehouse"]

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

    slid = db.Column(Integer, primary_key=True)
    werehouse_id = db.Column(Integer, ForeignKey('werehouse.wid'), nullable=False)
    location_type = db.Column(String(128), nullable=False)
    location_code = db.Column(String(64), nullable=False)

    width = db.Column(Numeric(10, 2), nullable=False)
    height = db.Column(Numeric(10, 2), nullable=False)
    depth = db.Column(Numeric(10, 2), nullable=False)

    max_weight = db.Column(Numeric(10, 2), nullable=False)


class Item_group(db.Model):
    __tablename__ = "item_group"
    
    igid = db.Column(db.Integer, primary_key=True)
    group_name = db.Column(db.String(100), unique=True, nullable=False)  # Nazwa grupy produktowej
    group_number = db.Column(db.String(10), nullable=False)  # Numer grupy produktowej
    description = db.Column(db.Text, nullable=True)  # Opis grupy

    parent_id = db.Column(db.Integer, db.ForeignKey('item_group.igid'), nullable=True)

    parent = db.relationship('Item_group', remote_side=[igid], backref="subgroups")


class Unit(db.Model):
    __tablename__ = "unit"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)  # Pełna nazwa, np. "kilogram"
    abbreviation = db.Column(db.String(10), unique=True, nullable=False)  # Skrót, np. "kg"
    conversion_factor = db.Column(db.Float, nullable=True, default=1.0)  # Przelicznik do jednostki głównej


class Item(db.Model):
    __tablename__ = "item"

    iid = db.Column(Integer, primary_key=True)
    item_number = db.Column(String(10), nullable=False) 
    item_name = db.Column(String(128), nullable=False)
    item_type = db.Column(String(128), nullable=False)
    item_description = db.Column(String(256), nullable=True)

    group_1_id = db.Column(Integer, db.ForeignKey('item_group.igid'), nullable=False)
    group_2_id = db.Column(Integer, db.ForeignKey('item_group.igid'), nullable=True)
    group_3_id = db.Column(Integer, db.ForeignKey('item_group.igid'), nullable=True)

    group1 = db.relationship('Item_group', foreign_keys=[group_1_id])
    group2 = db.relationship('Item_group', foreign_keys=[group_2_id])
    group3 = db.relationship('Item_group', foreign_keys=[group_3_id])

    # Powiązanie z jednostkami miary
    unit_primary_id = db.Column(db.Integer, db.ForeignKey('unit.id'), nullable=False)  # Jednostka główna (wymagana)
    unit_secondary_id = db.Column(db.Integer, db.ForeignKey('unit.id'), nullable=True)  # Jednostka pomocnicza (opcjonalna)

    # Relacje do jednostek miary
    unit_primary = db.relationship('Unit', foreign_keys=[unit_primary_id])
    unit_secondary = db.relationship('Unit', foreign_keys=[unit_secondary_id])

    created_at = db.Column(DateTime, default=dt.now(), nullable=False)
    last_update = db.Column(DateTime, default=dt.now(), nullable=False)

    weight = db.Column(Numeric(10, 2), nullable=False)
    width = db.Column(Numeric(10, 2), nullable=False)
    height = db.Column(Numeric(10, 2), nullable=False)
    depth = db.Column(Numeric(10, 2), nullable=False)

    path_to_image = db.Column(String(256), nullable=True)
    path_to_project = db.Column(String(256), nullable=True)
    
    stock_level = db.Column(Integer, nullable=False, default=0)
    reorder_point = db.Column(Integer, nullable=True)

    safety_stock = db.Column(Integer, default=0, nullable=False)
    min_level = db.Column(Integer, default=0, nullable=False)
    max_level = db.Column(Integer, nullable=False)

# Model typu jednostki magazynowej
class Storage_unit_type(db.Model):
    __tablename__ = "storage_unit_type"

    sutid = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)  # Nazwa np. "Europaleta"
    abbreviation = db.Column(db.String(20), unique=True, nullable=False)  # Skrót np. "EPAL"
    width = db.Column(db.Numeric(10, 2), nullable=False)  # Szerokość w cm
    height = db.Column(db.Numeric(10, 2), nullable=False)  # Wysokość w cm
    depth = db.Column(db.Numeric(10, 2), nullable=False)  # Głębokość w cm
    tare_weight = db.Column(db.Numeric(10, 2), nullable=False)  # Waga własna jednostki w kg
    

# Model jednostki magazynowej
class Storage_unit(db.Model):
    __tablename__ = "storage_unit"

    suid = db.Column(db.Integer, primary_key=True)
    
    # Typ jednostki magazynowej
    unit_type_id = db.Column(db.Integer, db.ForeignKey('storage_unit_type.sutid'), nullable=False)
    unit_type = db.relationship('StorageUnitType')

    storage_notes = db.Column(db.Text, nullable=True)  # Uwagi dotyczące przechowywania (np. "Przechowywać w suchym miejscu")

    # Powiązanie z lokalizacją magazynową
    storage_location_id = db.Column(db.Integer, db.ForeignKey('storage_location.slid'), nullable=False)
    storage_location = db.relationship('Storage_location')

    created_at = db.Column(db.DateTime, default=dt.now, nullable=False)  # Data utworzenia jednostki
    last_movement_at = db.Column(db.DateTime, default=dt.now, nullable=False)  # Data ostatniego przesunięcia

    is_blocked = db.Column(db.Boolean, default=False, nullable=False)  # Czy jednostka jest zablokowana

# Model relacji między jednostką magazynową a pozycją (Item)
class Storage_unit_item(db.Model):
    __tablename__ = "storage_unit_item"

    id = db.Column(db.Integer, primary_key=True)

    # Powiązanie z jednostką magazynową
    storage_unit_id = db.Column(db.Integer, db.ForeignKey('storage_unit.suid'), nullable=False)
    storage_unit = db.relationship('StorageUnit')

    # Powiązanie z pozycją (Item)
    item_id = db.Column(db.Integer, db.ForeignKey('item.iid'), nullable=False)
    item = db.relationship('Item')

    quantity = db.Column(db.Numeric(10, 2), nullable=False)  # Ilość pozycji w jednostce magazynowej
    created_at = db.Column(db.DateTime, default=dt.now, nullable=False)  # Data dodania pozycji do jednostki

    