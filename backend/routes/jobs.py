from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.job import Job, JobApplication
from models.user import db, User, Notification

jobs_bp = Blueprint('jobs', __name__)

@jobs_bp.route('/jobs', methods=['GET'])
@jwt_required()
def get_jobs():
    jobs = Job.query.order_by(Job.created_at.desc()).all()
    return jsonify([job.to_dict() for job in jobs])

@jobs_bp.route('/jobs', methods=['POST'])
@jwt_required()
def create_job():
    current_user_id = get_jwt_identity()
    data = request.get_json()

    required_fields = ['title', 'company_name', 'location', 'job_type', 'required_experience', 'description']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400

    new_job = Job(
        title=data['title'],
        company_name=data['company_name'],
        location=data['location'],
        job_type=data['job_type'],
        required_experience=data['required_experience'],
        description=data['description'],
        posted_by=current_user_id
    )

    try:
        db.session.add(new_job)
        db.session.commit()
        return jsonify(new_job.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@jobs_bp.route('/jobs/<int:job_id>/apply', methods=['POST'])
@jwt_required()
def apply_to_job(job_id):
    current_user_id = get_jwt_identity()
    
    # Check if job exists
    job = Job.query.get_or_404(job_id)
    
    # Check if user has already applied
    existing_application = JobApplication.query.filter_by(
        user_id=current_user_id,
        job_id=job_id
    ).first()
    
    if existing_application:
        return jsonify({'error': 'You have already applied to this job'}), 400
    
    # Create new application
    application = JobApplication(
        user_id=current_user_id,
        job_id=job_id,
        status='pending'
    )
    
    # Create notification for job poster
    notification = Notification(
        user_id=job.posted_by,
        sender_id=current_user_id,
        type='job_application',
        message=f'You have received a new job application for {job.title}'
    )
    
    try:
        db.session.add(application)
        db.session.add(notification)
        db.session.commit()
        return jsonify(application.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@jobs_bp.route('/jobs/<int:job_id>/applications', methods=['GET'])
@jwt_required()
def get_job_applications(job_id):
    current_user_id = get_jwt_identity()
    
    # Check if job exists and user is the poster
    job = Job.query.get_or_404(job_id)
    if job.posted_by != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    applications = JobApplication.query.filter_by(job_id=job_id).all()
    return jsonify([app.to_dict() for app in applications])

@jobs_bp.route('/jobs/applications/<int:application_id>/status', methods=['PUT'])
@jwt_required()
def update_application_status(application_id):
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    if 'status' not in data or data['status'] not in ['accepted', 'rejected']:
        return jsonify({'error': 'Invalid status'}), 400
    
    application = JobApplication.query.get_or_404(application_id)
    job = Job.query.get(application.job_id)
    
    # Check if user is the job poster
    if job.posted_by != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Update application status
    application.status = data['status']
    
    # Create notification for applicant
    notification = Notification(
        user_id=application.user_id,
        sender_id=current_user_id,
        type='job_application_status',
        message=f'Your application for {job.title} has been {data["status"]}'
    )
    
    try:
        db.session.add(notification)
        db.session.commit()
        return jsonify(application.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@jobs_bp.route('/jobs/search', methods=['GET'])
@jwt_required()
def search_jobs():
    query = request.args.get('q', '')
    location = request.args.get('location', '')
    job_type = request.args.get('type', '')

    jobs_query = Job.query

    if query:
        jobs_query = jobs_query.filter(
            (Job.title.ilike(f'%{query}%')) |
            (Job.company_name.ilike(f'%{query}%')) |
            (Job.description.ilike(f'%{query}%'))
        )
    
    if location:
        jobs_query = jobs_query.filter(Job.location.ilike(f'%{location}%'))
    
    if job_type:
        jobs_query = jobs_query.filter(Job.job_type == job_type)

    jobs = jobs_query.order_by(Job.created_at.desc()).all()
    return jsonify([job.to_dict() for job in jobs]) 