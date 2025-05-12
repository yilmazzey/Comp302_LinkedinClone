from app import create_app
from models.user import db, User
from models.post import Post, Comment, Like

def clean_database():
    app = create_app()
    with app.app_context():
        try:
            # Delete all data from tables
            Like.query.delete()
            Comment.query.delete()
            Post.query.delete()
            User.query.delete()
            
            # Commit the changes
            db.session.commit()
            print("Database cleaned successfully!")
            
        except Exception as e:
            db.session.rollback()
            print(f"Error cleaning database: {str(e)}")
        finally:
            db.session.close()

if __name__ == "__main__":
    clean_database() 