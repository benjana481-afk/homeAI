"""SQLAlchemy ORM models — User and Design."""
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, Boolean
from sqlalchemy.orm import relationship

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    designs = relationship("Design", back_populates="user", cascade="all, delete-orphan")


class Design(Base):
    __tablename__ = "designs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Metadata
    room_type = Column(String, nullable=False)
    style = Column(String, nullable=False)
    room_label = Column(String, nullable=False)
    style_label = Column(String, nullable=False)
    budget_nis = Column(Integer, nullable=False)
    is_video = Column(Boolean, default=False, nullable=False)

    # Local file paths (relative to /uploads), saved permanently so DALL-E URL expiration doesn't break us
    original_image_path = Column(String, nullable=False)   # the user's uploaded photo/video
    redesign_image_path = Column(String, nullable=False)   # downloaded DALL-E result

    # AI output
    analysis = Column(Text, nullable=False)
    design_brief = Column(Text, nullable=False)
    shopping_items_json = Column(Text, nullable=False)  # serialized ShoppingResult

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    user = relationship("User", back_populates="designs")
