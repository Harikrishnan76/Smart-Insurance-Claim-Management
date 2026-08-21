from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db, UserDB
from schemas import UserResponse, MessageResponse
from auth import get_current_admin

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_admin: UserDB = Depends(get_current_admin),
):
    """List all users (admin only)."""
    users = db.query(UserDB).filter(UserDB.role == "customer").all()
    return [UserResponse.model_validate(u) for u in users]


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_admin: UserDB = Depends(get_current_admin),
):
    """Get a specific user (admin only)."""
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse.model_validate(user)


@router.delete("/{user_id}", response_model=MessageResponse)
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_admin: UserDB = Depends(get_current_admin),
):
    """Delete a user (admin only)."""
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == "admin":
        raise HTTPException(status_code=403, detail="Cannot delete admin users")
    db.delete(user)
    db.commit()
    return MessageResponse(success=True, message=f"User {user_id} deleted.")
