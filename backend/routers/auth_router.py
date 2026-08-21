import json
import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db, UserDB, ClaimDB, ClaimTimelineDB
from schemas import (
    RegisterRequest, LoginRequest, TokenResponse, UserResponse,
    UpdateProfileRequest, MessageResponse
)
from auth import (
    hash_password, verify_password, create_access_token,
    get_current_user
)
from config import settings

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


def generate_user_id(role: str) -> str:
    prefix = "ADMIN" if role == "admin" else "CUST"
    return f"{prefix}{str(uuid.uuid4())[:8].upper()}"


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user account."""
    # Check duplicate email
    existing = db.query(UserDB).filter(UserDB.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = generate_user_id(data.role)

    user = UserDB(
        id=user_id,
        name=data.name,
        email=data.email,
        hashed_password=hash_password(data.password),
        mobile=data.mobile or "",
        address=data.address or "",
        city=data.city or "",
        state=data.state or "",
        pincode=data.pincode or "",
        role=data.role or "customer",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.id, "role": user.role})
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user)
    )


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    """Login and receive a JWT token."""
    user = db.query(UserDB).filter(UserDB.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token({"sub": user.id, "role": user.role})
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user)
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: UserDB = Depends(get_current_user)):
    """Get current authenticated user profile."""
    return UserResponse.model_validate(current_user)


@router.put("/me", response_model=UserResponse)
def update_profile(
    data: UpdateProfileRequest,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    """Update user profile fields."""
    if data.name is not None:
        current_user.name = data.name
    if data.mobile is not None:
        current_user.mobile = data.mobile
    if data.address is not None:
        current_user.address = data.address
    if data.city is not None:
        current_user.city = data.city
    if data.state is not None:
        current_user.state = data.state
    if data.pincode is not None:
        current_user.pincode = data.pincode

    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)
