from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.job import Job
from models.user import db

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