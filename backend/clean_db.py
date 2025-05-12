from app import app
from models.post import Post, Comment, PostLike
from models.user import User

def clean_database():
    with app.app_context():
        # Delete all records from each table
        PostLike.query.delete()
        Comment.query.delete()
        Post.query.delete()
        User.query.delete()
        
        # Commit the changes
        db.session.commit()
        print("Database cleaned successfully!")

if __name__ == "__main__":
    clean_database() 