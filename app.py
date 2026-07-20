# =======================
# 1️⃣ IMPORTS
# =======================

from fileinput import filename

import cloudinary
import cloudinary.uploader

# Flask core
from typing import Any

from flask import Flask, flash, request, jsonify, session

# Database
from flask_sqlalchemy import SQLAlchemy

# Environment variables
from dotenv import load_dotenv
import os

# Security (password hashing)
from werkzeug.datastructures.file_storage import FileStorage
from werkzeug.security import generate_password_hash, check_password_hash

# Optional (if you use timestamps in models)
from datetime import datetime

from flask import render_template, request

from flask import redirect

from flask import session

from flask import jsonify, request

from flask import session, redirect

from flask import session, redirect, url_for

from datetime import timedelta




# =======================
# 2️⃣ CONFIG
# =======================
app = Flask(__name__)
load_dotenv()

print("DATABASE_URL =", os.getenv("DATABASE_URL"))
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(days=30)

app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)



cloudinary.config(
    cloud_name="gxy7cvmb",
    api_key="365885744375553",
    api_secret="7GVD_RcUAVEoeTZPodw9Ru8wVus",
    secure=True
)



# =======================
# 3️⃣ DATABASE MODEL
# =======================
class User(db.Model):
  

    id = db.Column(db.Integer, primary_key=True)
    phone = db.Column(db.String(15), unique=True, nullable=True)
    username = db.Column(db.String(100), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=True)

    password_hash = db.Column(db.String(255), nullable=False)

    is_active = db.Column(db.Boolean, default=True)

    bio = db.Column(db.Text, nullable=True)
    profile_photo = db.Column(db.String(255), nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # ✅ ADD THIS METHOD
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

with app.app_context():
    
 db.create_all()

 class Emoji(db.Model):
    __tablename__ = "emoji"

    id = db.Column(db.Integer, primary_key=True)
    emoji = db.Column(db.String(10), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(100), nullable=True)
    keywords = db.Column(db.Text, nullable=True)


with app.app_context():
    db.create_all()
# =======================
# 4️⃣ ROUTES
# =======================



@app.route("/")
def home():
    if "user_id" in session:
        return redirect(url_for("profile"))
    return redirect(url_for("login"))



@app.route("/signup", methods=["GET", "POST"])
def signup():

    # OUTPUT
    if request.method == "GET":
        return render_template("signup.html")

    # INPUT
    username = request.form.get("username")
    contact = request.form.get("contact")
    password = request.form.get("password")

    # CHECK
    if not username:
        flash("Username is required")
        return redirect("/signup")

    if not contact:
        flash("Phone number or Email is required")
        return redirect("/signup")

    if not password:
        flash("Password is required")
        return redirect("/signup")

    # DECISION
    email = None
    phone = None

    if "@" in contact:
        email = contact
    else:
        phone = contact

    username_exists = User.query.filter_by(username=username).first()
    email_exists = User.query.filter_by(email=email).first() if email else None
    phone_exists = User.query.filter_by(phone=phone).first() if phone else None

    if username_exists:
        flash("Username already exists")
        return redirect("/signup")

    if email_exists:
        flash("Email already exists")
        return redirect("/signup")

    if phone_exists:
        flash("Phone number already exists")
        return redirect("/signup")

    # ACTION
    hashed_password = generate_password_hash(password)

    new_user = User(
        username=username,
        email=email,
        phone=phone,
        password_hash=hashed_password,
        profile_photo="default-profile.png"
    )

    db.session.add(new_user)
    db.session.commit()

    session["user_id"] = new_user.id
    session.permanent = True

    # OUTPUT
    flash("Signup successful")
    return redirect("/profile")


@app.route("/login", methods=["GET", "POST"])
def login():

    if request.method == "GET":
        return render_template("login.html")

    identifier = request.form.get("identifier")
    password = request.form.get("password")

    print("Identifier:", identifier)

    user = User.query.filter(
        (User.username == identifier) |
        (User.email == identifier)
    ).first()

    print("User:", user)

    if not user:
        return "User not found", 404

    if not user.check_password(password):
        return "Invalid password", 401

    session["user_id"] = user.id
    session.permanent = True

    return redirect(url_for("profile"))



@app.route("/profile")
def profile():

    # CHECK
    user_id =session.get("user_id")

    # DECISION
    if not user_id:
        flash("Please log in first.")
        return redirect(url_for("login"))

    # ACTION
    user = User.query.get(user_id)

    if not user:
        flash("User not found.")
        return redirect(url_for("login"))

    # OUTPUT
    return render_template("profile.html", user=user, current_user_id=user_id)


@app.route("/edit-profile", methods=["GET", "POST"])
def edit_profile():

    # INPUT
    user_id: Any | None = session.get("user_id")

    # CHECK
    if not user_id:
        flash("Please log in first.")
        return redirect(url_for("login"))

    user = User.query.get(user_id)

    if not user:
        flash("User not found.")
        return redirect("/login")

    # DECISION
    if request.method == "POST":

        # INPUT
        username = request.form.get("username")
        bio = request.form.get("bio")
        profile_photo: FileStorage | None = request.files.get("profile_photo")

        # CHECK
        if not username:
            flash("Username is required.")
            return redirect("/edit-profile")

        # ACTION
        user.username = username
        user.bio = bio

        if profile_photo:
            result = cloudinary.uploader.upload(
                profile_photo,
                folder="profile_pics",
                public_id=str(user.id),
                overwrite=True
            )
            user.profile_photo = result["secure_url"]

        db.session.commit()

        # OUTPUT
        flash("Profile updated successfully.")
        return redirect("/profile")

    # OUTPUT
    return render_template("editprofile.html", user=user)


@app.route("/search", methods=["GET"])
def search():

    # Get the text from the search box
    query = request.args.get("q", "").strip()

    users = []

    # Only search if the user typed something
    if query:
        users = User.query.filter(
            User.username.ilike(f"%{query}%")
        ).all()

    return render_template(
        "search.html",
        users=users,
        query=query
    )

@app.route("/api/search")
def api_search():

    query = request.args.get("q", "").strip()

    if not query:
        return jsonify([])

    users = User.query.filter(
        User.username.ilike(f"%{query}%")
    ).all()

    return jsonify([
        {
            "username": user.username,
            "bio": user.bio,
            "profile_photo": user.profile_photo,
            "url": f"/profile/{user.username}"
        }
        for user in users
    ])


@app.route("/profile/<username>")
def view_profile(username):

    user = User.query.filter_by(username=username).first()

    if not user:
        return "User not found", 404

    current_user_id = session.get("user_id")
    return render_template("profile.html", user=user, current_user_id=current_user_id)


@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))



@app.route("/emojis-search")
def emojis_search_page():
    return render_template("emojis search.html")



@app.route("/api/emojis-search")
def api_emojis_search():
    query = request.args.get("q", "")

    if not query:
        return jsonify([])

    emojis = Emoji.query.filter(
        Emoji.keywords.ilike(f"%{query}%")
    ).limit(20).all()

    results = []

    for item in emojis:
        results.append({
            "emoji": item.emoji,
            "name": item.name
        })

    return jsonify(results)



if __name__ == "__main__":
    app.run(debug=True)