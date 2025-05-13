# This file makes the models directory a Python package 
from models.user import db, User
from models.post import Post, Comment, PostLike
from models.message import Message

__all__ = ['db', 'User', 'Post', 'Comment', 'PostLike', 'Message'] 