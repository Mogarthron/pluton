from flask import Flask, render_template, redirect, url_for, request, jsonify, flash 
from flask_login import LoginManager, login_user, logout_user, current_user, login_required

from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, BooleanField, SubmitField
from wtforms.validators import DataRequired, Length, EqualTo

from datetime import datetime as dt, timedelta

from app import app
from models import *

login_manager = LoginManager()
login_manager.init_app(app=app)

@login_manager.user_loader
def load_user(uid):
    return db.session.query(Users).get(uid) 

@app.route('/', methods=["GET", "POST"])
def index():
    return render_template("index.html", user=current_user)



class Login_form(FlaskForm):
    user_name = StringField('Username',  validators=[DataRequired()])
    password = PasswordField('Password', validators=[DataRequired()])
    submit = SubmitField('Log In')



@app.route("/login", methods=["GET", "POST"])
def login():

    if db.session.query(Users).count() == 0:
            print("brak userów!!!!")                   
            return redirect(url_for("dodaj_urzytkownika"))
          
    form = Login_form()
    if form.validate_on_submit():

        user_name = form.user_name.data
        password = form.password.data       
       
        user = db.session.query(Users).filter(Users.user_name == user_name).first()

        if user and user.check_password(password):  
            login_user(user)  
            flash('Logged in successfully.', 'success')
            return redirect(url_for('index'))  
        
        else:
            flash('Invalid username or password', 'danger')  

    return render_template('login.html', form=form)


class User_form(FlaskForm):
    user_name = StringField('Username', validators=[DataRequired(), Length(min=4, max=128)])
    password = PasswordField('Password', validators=[DataRequired(), Length(min=4)])
    confirm_password = PasswordField('Confirm Password', 
                                     validators=[DataRequired(), EqualTo('password', message='Passwords must match')])
    role = StringField('Role', validators=[DataRequired(), Length(max=128)])
    user_number = StringField('User Number', validators=[Length(max=10)])
    admin = BooleanField('Admin')
    quality_controll = BooleanField('Quality Control', default=True)
    
    submit = SubmitField('Dodaj nowego Urzytkownika')


@app.route("/add_user", methods=["POST", "GET"])
# @login_required
def add_user():

    form = User_form()
    if form.validate_on_submit():
        new_user = Users(
            user_name=form.user_name.data,
            password=form.password.data,
            role= form.role.data,
            user_number=form.user_number.data,
            admin=form.admin.data,
            quality_controll=form.quality_controll.data
        )

        db.session.add(new_user)
        db.session.commit()

        flash('User registered successfully!', 'success')

        return redirect(url_for('login'))

    return render_template("add_user.html", form=form)


@app.route("/logout")
def logout():
    logout_user()
    return render_template("index.html")

@app.route("/test")
def test():
    return render_template("test.html")


@app.route("/asp_module", methods=["POST", "GET"])
def asp_module():

    return render_template("asp_module.html")



@app.route('/api/schedule', methods=['GET'])
def get_schedule():
    start_time = dt.strptime("2025-06-29 08:00", "%Y-%m-%d %H:%M")
    # def minutes(dt): return int((dt - start_time).total_seconds() / 60)

    data = {
        "startTime": start_time.strftime("%Y-%m-%d %H:%M"),
        "machines": []
    }
    return jsonify(data)