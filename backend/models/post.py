from datetime import datetime
from models.user import db
from models.user import User

class Post(db.Model):
    __tablename__ = 'posts'
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    image_url = db.Column(db.String(256))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    author = db.relationship('User', backref=db.backref('posts', lazy=True))
    comments = db.relationship('Comment', backref='post', lazy=True, cascade='all, delete-orphan')
    likes = db.relationship('PostLike', backref='post', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        try:
            author_name = ""
            author_profile_photo = ""
            author_job_title = ""
            
            if self.author:
                author_name = f"{self.author.first_name or ''} {self.author.last_name or ''}"
                author_profile_photo = self.author.profile_photo or ''
                author_job_title = self.author.job_title or ''
            
            return {
                'id': self.id,
                'content': self.content,
                'image_url': self.image_url,
                'created_at': self.created_at.isoformat() if self.created_at else None,
                'author_id': self.author_id,
                'author_name': author_name.strip(),
                'author_profile_photo': author_profile_photo,
                'author_job_title': author_job_title,
                'comments': [comment.to_dict() for comment in self.comments] if self.comments else [],
                'likes_count': len(self.likes) if self.likes else 0,
                'liked_by_user': False  # This will be set by the API based on the current user
            }
        except Exception as e:
            print(f"Error in Post.to_dict for post {self.id}: {str(e)}")
            # Return a minimal version of the post data
            return {
                'id': self.id,
                'content': self.content,
                'created_at': self.created_at.isoformat() if self.created_at else None,
                'author_id': self.author_id,
                'author_name': 'Unknown User',
                'author_profile_photo': '',
                'author_job_title': '',
                'comments': [],
                'likes_count': 0,
                'liked_by_user': False
            }

class Comment(db.Model):
    __tablename__ = 'comments'
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('posts.id'), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'content': self.content,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'author_id': self.author_id,
            'post_id': self.post_id
        }

class PostLike(db.Model):
    __tablename__ = 'post_likes'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('posts.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Ensure a user can only like a post once
    __table_args__ = (db.UniqueConstraint('user_id', 'post_id', name='unique_post_like'),)
    
    user = db.relationship('User', backref=db.backref('post_likes', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'post_id': self.post_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        } 