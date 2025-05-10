from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Enum as SqlEnum
from datetime import datetime
from enum import Enum

db = SQLAlchemy()

class JobType(Enum):
    FULL_TIME = 'FULL_TIME'
    PART_TIME = 'PART_TIME'
    INTERNSHIP = 'INTERNSHIP'
    REMOTE = 'REMOTE'

class ExperienceLevel(Enum):
    ENTRY = 'ENTRY'
    MID = 'MID'
    SENIOR = 'SENIOR'
    EXECUTIVE = 'EXECUTIVE'

class ConnectionStatus(Enum):
    PENDING = 'PENDING'
    ACCEPTED = 'ACCEPTED'
    REJECTED = 'REJECTED'
    BLOCKED = 'BLOCKED'

class Account(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(128), nullable=False)
    type = db.Column(db.String(10), nullable=False)  # 'user' or 'admin'
    user = db.relationship('User', backref='account', uselist=False)
    admin = db.relationship('Admin', backref='account', uselist=False)

class Admin(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.Integer, db.ForeignKey('account.id'), nullable=False)
    adminid = db.Column(db.String(64), unique=True)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.Integer, db.ForeignKey('account.id'), nullable=False)
    profile_photo = db.Column(db.String(256))
    name = db.Column(db.String(64))
    surname = db.Column(db.String(64))
    job_title = db.Column(db.String(64))
    education = db.Column(db.String(256))
    experiences = db.Column(db.String(512))
    posts = db.relationship('Post', backref='author', lazy=True)
    jobs = db.relationship('Job', backref='author', lazy=True)
    comments = db.relationship('Comment', backref='author', lazy=True)
    sent_connections = db.relationship('Connection', foreign_keys='Connection.sender_id', backref='sender', lazy=True)
    received_connections = db.relationship('Connection', foreign_keys='Connection.receiver_id', backref='receiver', lazy=True)

class Job(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(128))
    description = db.Column(db.Text)
    location = db.Column(db.String(128))
    company_name = db.Column(db.String(128))
    job_type = db.Column(SqlEnum(JobType))
    required_experience = db.Column(SqlEnum(ExperienceLevel))
    author_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    posted_at = db.Column(db.DateTime, default=datetime.utcnow)

class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text)
    image_url = db.Column(db.String(256))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    author_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    comments = db.relationship('Comment', backref='post', lazy=True)

class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    author_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    post_id = db.Column(db.Integer, db.ForeignKey('post.id'))
    parent_id = db.Column(db.Integer, db.ForeignKey('comment.id'))
    replies = db.relationship('Comment', backref=db.backref('parent', remote_side=[id]), lazy=True)

class Connection(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    receiver_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    status = db.Column(SqlEnum(ConnectionStatus), default=ConnectionStatus.PENDING)
    created_at = db.Column(db.DateTime, default=datetime.utcnow) 