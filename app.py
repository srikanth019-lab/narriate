# =======================
# 1️⃣ IMPORTS
# =======================

# -------- Standard Library --------
from sqlalchemy import Enum
import os
import uuid
from datetime import datetime, timedelta

# -------- Environment Variables --------
from dotenv import load_dotenv
load_dotenv()

# -------- Flask Core --------
import flask
# -------- Database --------
from flask_sqlalchemy import SQLAlchemy

# -------- Security --------
from werkzeug.security import generate_password_hash, check_password_hash

# -------- Real-Time (SocketIO) --------
from flask_socketio import SocketIO, emit, join_room

# -------- OAuth --------
from authlib.integrations.flask_client import OAuth


load_dotenv()

# =======================
# 2️⃣ APP INITIALIZATION
# =======================

app = flask.Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "dev_secret_key")

socketio = SocketIO(app, cors_allowed_origins="*")

# =======================
# 3️⃣ APP CONFIGURATION
# =======================
database_url = os.getenv("DATABASE_URL")

if database_url and database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

app.config["SQLALCHEMY_DATABASE_URI"] = database_url
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

app.config["GOOGLE_CLIENT_ID"] = os.getenv("GOOGLE_CLIENT_ID")
app.config["GOOGLE_CLIENT_SECRET"] = os.getenv("GOOGLE_CLIENT_SECRET")


# =======================
# 4️⃣ EXTENSIONS INITIALIZATION
# =======================
# Initialize Flask app



# -------------------------
# DATABASE CONFIG FIRST
# -------------------------

# -------------------------
# THEN initialize database
# -------------------------
db = SQLAlchemy(app)
oauth = OAuth(app)

with app.app_context():
    db.create_all()


# =======================
# 5️⃣ GOOGLE OAUTH REGISTRATION
# =======================

google = oauth.register(
    name="google",
    client_id=app.config["GOOGLE_CLIENT_ID"],
    client_secret=app.config["GOOGLE_CLIENT_SECRET"],
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"}
)
# =======================
# 6️⃣ DATABASE MODELS
# =======================

# ---------- USER MODEL ----------
class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    fullname = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(150), nullable=False, unique=True, index=True)
    password = db.Column(db.String(200), nullable=True)
    google_id = db.Column(db.String(200), unique=True, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
# During signup: email.lower()

    # Relationships
    streams = db.relationship("Stream", backref="streamer", lazy=True)
    chats = db.relationship("Chat", backref="user", lazy=True)
    invites_sent = db.relationship("Invite", backref="inviter", lazy=True)


# ---------- STREAM MODEL ----------
class Stream(db.Model):
    __tablename__ = "streams"

    id = db.Column(db.Integer, primary_key=True)
    streamer_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

     # live / ended
    title = db.Column(db.String(200), default="Live Stream")

    like_count = db.Column(db.Integer, default=0)
    heart_count = db.Column(db.Integer, default=0)
    viewer_count = db.Column(db.Integer, default=0)

    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    ended_at = db.Column(db.DateTime, nullable=True)
    
    status = db.Column(Enum("live", "ended", name="stream_status"), default="live")

    chats = db.relationship(
        "Chat",
        backref="stream",
        lazy=True,
        cascade="all, delete-orphan"
    )

    invites = db.relationship(
        "Invite",
        backref="stream",
        lazy=True,
        cascade="all, delete-orphan"
    )


# ---------- CHAT MODEL ----------
class Chat(db.Model):
    __tablename__ = "chats"

    id = db.Column(db.Integer, primary_key=True)
    
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    message = db.Column(db.Text, nullable=False)
    emoji_type = db.Column(db.String(20), nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    stream_id = db.Column(
    db.Integer,
    db.ForeignKey("streams.id"),
    nullable=False,
    index=True
)

class Invite(db.Model):
    __tablename__ = "invites"

    id = db.Column(db.Integer, primary_key=True)

    stream_id = db.Column(db.Integer, db.ForeignKey("streams.id"), nullable=False)

    inviter_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    link_token = db.Column(
        db.String(100),
        unique=True,
        nullable=False,
        default=lambda: str(uuid.uuid4()),
        index=True
    )

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    expires_at = db.Column(
        db.DateTime,
        default=lambda: datetime.utcnow() + timedelta(days=7)
    )



# =======================
# 7️⃣ HELPER FUNCTIONS
# =======================

from flask import g

def get_current_user():
    if hasattr(g, 'current_user'):
        return g.current_user
    user_id = flask.session.get("user_id")
    if not user_id:
        return None
    user = User.query.get(user_id)
    g.current_user = user
    return user 

# =======================
# AUTH LOGIC
# =======================

def create_user(fullname, email, password):
    """Create a new user account."""
    existing = User.query.filter_by(email=email).first()
    if existing:
        return None, "User already exists"

    hashed_password = generate_password_hash(password)

    new_user = User(
        fullname=fullname,
        email=email,
        password=hashed_password
    )

    db.session.add(new_user)
    db.session.commit()

    return new_user, None


def verify_user(email, password):
    """Verify login credentials."""
    user = User.query.filter_by(email=email).first()

    if not user:
        return None

    # Prevent crash if Google-only user tries password login
    if not user.password:
        return None

    if check_password_hash(user.password, password):
        return user

    return None


# =========================
# STREAM LOGIC
# =========================

def create_stream(user_id, title):
    new_stream = Stream(
        streamer_id=user_id,
        title=title,
        status="live",
        started_at=datetime.utcnow()
    )

    db.session.add(new_stream)
    db.session.commit()

    return new_stream


def end_stream(stream_id):
    stream = Stream.query.get(stream_id)
    if not stream:
        return None

    stream.status = "ended"
    stream.ended_at = datetime.utcnow()
    db.session.commit()

    return stream


# =========================
# CHAT LOGIC
# =========================

def add_chat(user_id, stream_id, message, emoji_type=None):
    new_chat = Chat(
        user_id=user_id,
        stream_id=stream_id,
        message=message,
        emoji_type=emoji_type,
        timestamp=datetime.utcnow()
    )

    db.session.add(new_chat)
    db.session.commit()

    return new_chat


# =========================
# INVITE LOGIC
# =========================

def create_invite(stream_id, inviter_id):
    invite = Invite(
        stream_id=stream_id,
        inviter_id=inviter_id
    )

    db.session.add(invite)
    db.session.commit()

    return invite


def validate_invite(token):
    invite = Invite.query.filter_by(link_token=token).first()

    if not invite:
        return None

    # Check expiration
    if invite.expires_at < datetime.utcnow():
        return None

    return invite

  # =======================
# 4️⃣ ROUTES
# =======================

# -----------------------
# Home Page
# -----------------------
@app.route("/")
def index():
    current_user = get_current_user()
    if not current_user:
        return flask.redirect(flask.url_for("login"))

    return flask.render_template("index.html", user=current_user)


# -----------------------
# Signup
# -----------------------
@app.route("/signup", methods=["GET", "POST"])
def signup():
    if flask.request.method == "POST":
        fullname = flask.request.form.get("fullname")
        email = flask.request.form.get("email")
        password = flask.request.form.get("password")

        user, error = create_user(fullname, email, password)

        if error:
            flask.flash(error)
            return flask.redirect(flask.url_for("signup"))

        # Check invite token
        invite_token = flask.session.get("invite_token")

        if invite_token:
            invite = validate_invite(invite_token)

            if invite:
                flask.session["user_id"] = user.id
                flask.session.pop("invite_token")

                return flask.redirect(
                    flask.url_for("stream_page", stream_id=invite.stream_id)
                )

        flask.flash("Account created successfully!")
        return flask.redirect(flask.url_for("login"))

    return flask.render_template("signup.html")

# -----------------------
# Login
# -----------------------
@app.route("/login", methods=["GET", "POST"])
def login():
    if flask.request.method == "POST":
        email = flask.request.form.get("email")
        password = flask.request.form.get("password")

        user = verify_user(email, password)

        if user:
            flask.session["user_id"] = user.id
            flask.flash("Login successful!")
            return flask.redirect(flask.url_for("index"))

        flask.flash("Invalid credentials.")
        return flask.redirect(flask.url_for("login"))

    return flask.render_template("login.html")


# -----------------------
# Go Live
# -----------------------
@app.route("/go-live")
def go_live():
    current_user = get_current_user()
    if not current_user:
        return flask.redirect(flask.url_for("login"))

    new_stream = create_stream(current_user.id, "Live Stream")

    return flask.redirect(flask.url_for("stream_page", stream_id=new_stream.id))


# -----------------------
# Stream Page
# -----------------------
@app.route("/live/<int:stream_id>")
def stream_page(stream_id):

    stream = Stream.query.get_or_404(stream_id)

    current_user = get_current_user()

    if not current_user:
        return flask.redirect(flask.url_for("login"))

    # Check if streamer
    is_streamer = current_user.id == stream.streamer_id

    # Increase viewers only if viewer
    if not is_streamer:
        stream.viewer_count += 1
        db.session.commit()

    # Choose template
    if is_streamer:
        template = "live.html"
    else:
        template = "viewer.html"

    return flask.render_template(
        template,
        stream=stream,
        is_streamer=is_streamer,
        username=current_user.fullname,
        viewer_count=stream.viewer_count
    )

@app.route("/use-invite/<token>")
def use_invite(token):
    invite = validate_invite(token)
    if not invite:
        flask.flash("Invalid or expired invite link.")
        return flask.redirect(flask.url_for("index"))

    # If user not logged in, save the token in session
    if not get_current_user():
        flask.session["invite_token"] = token
        return flask.redirect(flask.url_for("signup"))

    # If already logged in, redirect to stream
    return flask.redirect(flask.url_for("stream_page", stream_id=invite.stream_id))


# -----------------------
# Socket Events
# -----------------------
@socketio.on("join")
def handle_join(data):
    room = data["room"]
    join_room(room)


@socketio.on("signal")
def handle_signal(data):
    room = data["room"]
    emit("signal", data, room=room, include_self=False)
 

# -----------------------
# Logout
# -----------------------
@app.route("/logout")
def logout():
    flask.session.pop("user_id", None)
    flask.flash("Logged out successfully.")
    return flask.redirect(flask.url_for("login"))


# -----------------------
# Google Login
# -----------------------
@app.route("/login/google")
def login_google():
    redirect_uri = flask.url_for("authorize_google", _external=True)
    return google.authorize_redirect(redirect_uri)


# -----------------------
# Google Callback
# -----------------------
@app.route("/authorize/google")
def authorize_google():
    # Exchange authorization code for token
    token = google.authorize_access_token()
    
    # Fetch user info from Google
    resp = google.get("https://openidconnect.googleapis.com/v1/userinfo")
    user_info = resp.json()
    
    email = user_info["email"]
    name = user_info["name"]
    google_id = user_info["sub"]
    
    # Check if user exists in DB
    user = User.query.filter_by(email=email).first()
    
    if not user:
        user = User(    
            fullname=name,
            email=email,
            google_id=google_id
        )
        db.session.add(user)
        db.session.commit()
    
    # Log in the user
    flask.session["user_id"] = user.id
    
    return flask.redirect(flask.url_for("index"))



import os

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)