import sys
import os

# Add the parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.user import User, db
from flask import Flask
from config import Config

def run_migration():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Initialize the database
    db.init_app(app)
    
    with app.app_context():
        try:
            # Add is_admin column if it doesn't exist
            with db.engine.begin() as conn:
                try:
                    conn.execute('ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE')
                except Exception as e:
                    print(f"Warning: {e}")
            
            # Set up admin user (replace with your admin email)
            admin_email = 'zeynep@hotmail.com'  # Change this to your admin email
            admin = User.query.filter_by(email=admin_email).first()
            
            if admin:
                admin.is_admin = True
                db.session.commit()
                print(f"User {admin_email} has been set as admin")
            else:
                print(f"Admin user {admin_email} not found. Please create the user first.")
            
            print("Migration completed successfully")
        except Exception as e:
            print(f"Error during migration: {str(e)}")
            db.session.rollback()

if __name__ == '__main__':
    run_migration() 