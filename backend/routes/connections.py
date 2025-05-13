from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user import User, db, connections, Notification
from sqlalchemy import and_, or_

connections_bp = Blueprint('connections', __name__)

@connections_bp.route('/suggested-connections', methods=['GET'])
@jwt_required()
def get_suggested_connections():
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    # Get users who are not already connected with the current user
    existing_connections = db.session.query(connections).filter(
        or_(
            connections.c.user_id == current_user_id,
            connections.c.connected_user_id == current_user_id
        )
    ).all()
    
    connected_user_ids = set()
    for conn in existing_connections:
        if conn[0] == current_user_id:
            connected_user_ids.add(conn[1])
        else:
            connected_user_ids.add(conn[0])
    
    # Get users who are not connected and not the current user
    suggested_users = User.query.filter(
        User.id != current_user_id,
        ~User.id.in_(connected_user_ids)
    ).limit(10).all()
    
    return jsonify({
        'suggested_connections': [user.to_dict() for user in suggested_users]
    })

@connections_bp.route('/connections', methods=['GET'])
@jwt_required()
def get_connections():
    current_user_id = get_jwt_identity()
    
    # Get all accepted connections
    user_connections = db.session.query(connections).filter(
        and_(
            or_(
                connections.c.user_id == current_user_id,
                connections.c.connected_user_id == current_user_id
            ),
            connections.c.status == 'accepted'
        )
    ).all()
    
    connected_user_ids = set()
    for conn in user_connections:
        if conn[0] == current_user_id:
            connected_user_ids.add(conn[1])
        else:
            connected_user_ids.add(conn[0])
    
    connected_users = User.query.filter(User.id.in_(connected_user_ids)).all()
    # Filter out any user IDs that do not exist in the users table
    valid_user_ids = set(user.id for user in connected_users)
    filtered_connected_users = [user for user in connected_users if user.id in valid_user_ids]
    print("Returning connections:", [user.id for user in filtered_connected_users])
    return jsonify({
        'connections': [user.to_dict() for user in filtered_connected_users]
    })

@connections_bp.route('/connect/<int:user_id>', methods=['POST'])
@jwt_required()
def send_connection_request(user_id):
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    target_user = User.query.get(user_id)
    
    if not target_user:
        return jsonify({'error': 'User not found'}), 404
    
    if current_user_id == user_id:
        return jsonify({'error': 'Cannot connect with yourself'}), 400
    
    # Check if connection already exists
    existing_connection = db.session.query(connections).filter(
        or_(
            and_(connections.c.user_id == current_user_id, connections.c.connected_user_id == user_id),
            and_(connections.c.user_id == user_id, connections.c.connected_user_id == current_user_id)
        )
    ).first()
    
    if existing_connection:
        return jsonify({'error': 'Connection already exists'}), 400
    
    # Create new connection request
    db.session.execute(
        connections.insert().values(
            user_id=current_user_id,
            connected_user_id=user_id,
            status='pending'
        )
    )
    
    # Create notification for the target user
    notification = Notification(
        user_id=user_id,
        sender_id=current_user_id,
        type='connection_request',
        message=f"{current_user.first_name} {current_user.last_name} sent you a connection request"
    )
    db.session.add(notification)
    
    db.session.commit()
    
    return jsonify({'message': 'Connection request sent successfully'})

@connections_bp.route('/connection-requests', methods=['GET'])
@jwt_required()
def get_connection_requests():
    current_user_id = get_jwt_identity()
    
    # Get pending connection requests
    pending_requests = db.session.query(connections).filter(
        and_(
            connections.c.connected_user_id == current_user_id,
            connections.c.status == 'pending'
        )
    ).all()
    
    requesters = User.query.filter(
        User.id.in_([req[0] for req in pending_requests])
    ).all()
    
    return jsonify({
        'connection_requests': [user.to_dict() for user in requesters]
    })

@connections_bp.route('/connection-requests/<int:user_id>', methods=['PUT'])
@jwt_required()
def respond_to_connection_request(user_id):
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    requester = User.query.get(user_id)
    action = request.json.get('action')  # 'accept' or 'reject'
    
    if not requester:
        return jsonify({'error': 'User not found'}), 404
    
    if action not in ['accept', 'reject']:
        return jsonify({'error': 'Invalid action'}), 400
    
    # Update connection status only if pending
    updated = db.session.query(connections).filter(
        and_(
            connections.c.user_id == user_id,
            connections.c.connected_user_id == current_user_id,
            connections.c.status == 'pending'
        )
    ).update({'status': 'accepted' if action == 'accept' else 'rejected'})
    
    # Only send notification if we actually accepted a pending request
    if action == 'accept' and updated:
        notification = Notification(
            user_id=user_id,
            sender_id=current_user_id,
            type='connection_accepted',
            message=f"{current_user.first_name} {current_user.last_name} accepted your connection request"
        )
        db.session.add(notification)
    
    db.session.commit()
    
    return jsonify({'message': f'Connection request {action}ed successfully'})

@connections_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    current_user_id = get_jwt_identity()
    
    notifications = Notification.query.filter_by(
        user_id=current_user_id,
        is_read=False
    ).order_by(Notification.created_at.desc()).all()
    
    return jsonify({
        'notifications': [notification.to_dict() for notification in notifications]
    })

@connections_bp.route('/notifications/<int:notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_notification_read(notification_id):
    current_user_id = get_jwt_identity()
    
    notification = Notification.query.filter_by(
        id=notification_id,
        user_id=current_user_id
    ).first()
    
    if not notification:
        return jsonify({'error': 'Notification not found'}), 404
    
    notification.is_read = True
    db.session.commit()
    
    return jsonify({'message': 'Notification marked as read'}) 