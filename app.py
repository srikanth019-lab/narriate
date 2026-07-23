# =======================
# 1️⃣ IMPORTS
# =======================
from flask import abort
from ast import If
from typing import Any
from datetime import datetime, timedelta

import cloudinary
import cloudinary.uploader

# Flask core
from flask import Flask, flash, request, jsonify, session, render_template, redirect, url_for

# Database
from flask_sqlalchemy import SQLAlchemy


# Environment variables
from dotenv import load_dotenv
import os

# Security (password hashing)
from werkzeug.datastructures.file_storage import FileStorage
from werkzeug.security import generate_password_hash, check_password_hash

from flask_migrate import Migrate

from flask import request, redirect, url_for



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
migrate = Migrate(app, db)



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


class Emoji(db.Model):
    __tablename__ = "emoji"

    id = db.Column(db.Integer, primary_key=True)
    emoji = db.Column(db.String(10), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(100), nullable=True)
    keywords = db.Column(db.Text, nullable=True)


class EmojiPost(db.Model):
    __tablename__ = "posts"

    id = db.Column(db.Integer, primary_key=True)

    emoji_id = db.Column(
        db.Integer,
        db.ForeignKey("emoji.id"),
        nullable=False
    )

    user_id = db.Column(
    db.Integer,
    db.ForeignKey("user.id"),
    nullable=False
)

    image_url = db.Column(db.String(500), nullable=False)

    content = db.Column(db.Text, nullable=True)
    media_type = db.Column(db.String(10), nullable=False)
    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    emoji = db.relationship(
        "Emoji",
        backref=db.backref("posts", lazy=True)
    )


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
    user_id = session.get("user_id")

    # DECISION
    if not user_id:
        flash("Please log in first.")
        return redirect(url_for("login"))

    # ACTION
    user = User.query.get(user_id)

    if not user:
        flash("User not found.")
        return redirect(url_for("login"))

    emoji_counts = (
        db.session.query(
            Emoji.id,
            Emoji.emoji,
            db.func.count(EmojiPost.id).label("post_count")
        )
        .join(EmojiPost, Emoji.id == EmojiPost.emoji_id)
        .filter(EmojiPost.user_id == user_id)
        .group_by(Emoji.id, Emoji.emoji)
        .all()
    )

    return render_template(
        "profile.html",
        user=user,
        current_user_id=user_id,
        emoji_counts=emoji_counts
    )


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
            "id": item.id,
        "emoji": item.emoji,
        "name": item.name
    })
        

    return jsonify(results)


@app.route("/emoji/<int:emoji_id>", methods=["GET", "POST"])
def emoji_gallery(emoji_id):
    emoji = Emoji.query.get_or_404(emoji_id)

    if request.method == "POST":
        file = request.files.get("image")

        if not file:
            return redirect(url_for("emoji_gallery", emoji_id=emoji.id))

        print("Filename:", file.filename)
        print("Mimetype:", file.mimetype)

        # Detect media type
        if file.mimetype.startswith("image/"):
            media_type = "image"
        elif file.mimetype.startswith("video/"):
            media_type = "video"
        else:
            return "Unsupported file type", 400

        # Upload to Cloudinary
        result = cloudinary.uploader.upload(
            file,
            resource_type="auto"
        )

        # Save in database
        new_post = EmojiPost(
            user_id=session["user_id"],
            emoji_id=emoji.id,
            image_url=result["secure_url"],
            media_type=media_type
        )


        print("Session user_id:", session.get("user_id"))
        print("New post user_id:", new_post.user_id)


        db.session.add(new_post)
        db.session.commit()

        return redirect(url_for("emoji_gallery", emoji_id=emoji.id))

 # This runs for GET requests
    posts = EmojiPost.query.filter_by(emoji_id=emoji.id).all()

    return render_template(
        "emoji gallery.html",
        emoji=emoji,
        posts=posts
    )
    

@app.route("/post/<int:post_id>")
def view_post(post_id):
    post = EmojiPost.query.get_or_404(post_id)
    posts = EmojiPost.query.filter_by(emoji_id=post.emoji_id).all()

    return render_template("view post.html", posts=posts, current_post=post)




@app.route("/post/<int:post_id>/delete", methods=["POST"])
def delete_post(post_id):

    user_id = session.get("user_id")
    post = EmojiPost.query.get_or_404(post_id)

    print("Session user_id:", user_id)
    print("Post user_id:", post.user_id)

    if not user_id:
        flash("Please log in first.")
        return redirect(url_for("login"))

    if post.user_id != user_id:
        abort(403)

    emoji_id = post.emoji_id

    db.session.delete(post)
    db.session.commit()

    return redirect(url_for("emoji_gallery", emoji_id=emoji_id))


if __name__ == "__main__":
    app.run(debug=True)