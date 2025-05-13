from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

# Association table for connections
connections = db.Table('connections',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('connected_user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('status', db.String(20), default='pending'),  # pending, accepted, rejected
    db.Column('created_at', db.DateTime, default=datetime.utcnow)
)

class Notification(db.Model):
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # 'connection_request', 'connection_accepted', etc.
    message = db.Column(db.String(255), nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', foreign_keys=[user_id], backref='notifications')
    sender = db.relationship('User', foreign_keys=[sender_id])

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'sender_id': self.sender_id,
            'type': self.type,
            'message': self.message,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'sender_name': f"{self.sender.first_name} {self.sender.last_name}" if self.sender else None,
            'sender_photo': self.sender.profile_photo if self.sender else None
        }

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    profile_photo = db.Column(db.String(256))
    job_title = db.Column(db.String(100))
    location = db.Column(db.String(100))
    bio = db.Column(db.Text)
    education = db.Column(db.Text)
    experience = db.Column(db.Text)
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Connection relationships
    connections = db.relationship(
        'User',
        secondary=connections,
        primaryjoin=(id == connections.c.user_id),
        secondaryjoin=(id == connections.c.connected_user_id),
        backref=db.backref('connected_by', lazy='dynamic'),
        lazy='dynamic'
    )
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'profile_photo': self.profile_photo,
            'job_title': self.job_title,
            'location': self.location,
            'bio': self.bio,
            'education': self.education,
            'experience': self.experience,
            'is_admin': self.is_admin,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'connections_count': self.get_connections_count(),
            'pending_requests_count': self.get_pending_requests_count()
        }
    
    def get_connection_status(self, other_user_id):
        """Get the connection status between this user and another user"""
        connection = db.session.query(connections).filter(
            ((connections.c.user_id == self.id) & (connections.c.connected_user_id == other_user_id)) |
            ((connections.c.user_id == other_user_id) & (connections.c.connected_user_id == self.id))
        ).first()
        return connection[2] if connection else None  # Return the status
    
    def get_connections_count(self):
        """Get the number of accepted connections"""
        return db.session.query(connections).filter(
            ((connections.c.user_id == self.id) | (connections.c.connected_user_id == self.id)) &
            (connections.c.status == 'accepted')
        ).count()
    
    def get_pending_requests_count(self):
        """Get the number of pending connection requests"""
        return db.session.query(connections).filter(
            (connections.c.connected_user_id == self.id) &
            (connections.c.status == 'pending')
        ).count() 