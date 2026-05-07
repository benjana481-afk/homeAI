from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


ROOM_TYPES = {
    "living_room": "סלון",
    "bedroom": "חדר שינה",
    "kitchen": "מטבח",
    "bathroom": "חדר אמבטיה",
    "garden": "גינה",
    "yard": "חצר",
    "balcony": "מרפסת",
    "office": "חדר עבודה",
    "dining_room": "חדר אוכל",
    "kids_room": "חדר ילדים",
}

DESIGN_STYLES = {
    "modern": {
        "label": "מודרני",
        "description": "קווים נקיים, חומרים איכותיים, פלטת צבעים ניטרלית",
        "emoji": "🏙️",
    },
    "minimalist": {
        "label": "מינימליסטי",
        "description": "פחות זה יותר, שטחים פנויים, פונקציונליות מעל הכל",
        "emoji": "⬜",
    },
    "rustic": {
        "label": "כפרי",
        "description": "עץ טבעי, טקסטורות חמות, תחושת בית",
        "emoji": "🪵",
    },
    "scandinavian": {
        "label": "סקנדינבי",
        "description": "בהיר, פונקציונלי, חמים עם גוונים טבעיים",
        "emoji": "🌿",
    },
    "mediterranean": {
        "label": "ים תיכוני",
        "description": "צבעים חמים, אריחים, פתוח לאוויר",
        "emoji": "🫒",
    },
    "industrial": {
        "label": "תעשייתי",
        "description": "ברזל, בטון, לבנים חשופות, מחסן מעוצב",
        "emoji": "🏭",
    },
    "bohemian": {
        "label": "בוהמיאני",
        "description": "צבעים עשירים, שטיחים, צמחים, אקלקטי",
        "emoji": "🎨",
    },
    "luxury": {
        "label": "יוקרה",
        "description": "חומרים יקרים, מראה עשיר, עיצוב מרשים",
        "emoji": "👑",
    },
}

ISRAELI_STORES = {
    "IKEA Israel": "https://www.ikea.com/il/he/",
    "HomeCenter": "https://www.homecenter.co.il/",
    "ACE": "https://www.ace.co.il/",
    "Keter": "https://www.keter.com/il/",
    "Ivory": "https://www.ivory.co.il/",
    "Castro Home": "https://www.castrodesign.co.il/",
    "Habitat": "https://www.habitat.co.il/",
}

# Domains for each store — used to build Google `site:` searches that find
# real product pages indexed on the store's site (more reliable than guessing
# each store's internal search URL pattern, which often changes and 404s).
STORE_DOMAINS = {
    "IKEA Israel": "ikea.com/il",
    "HomeCenter": "homecenter.co.il",
    "ACE": "ace.co.il",
    "Keter": "keter.com",
    "Ivory": "ivory.co.il",
    "Castro Home": "castrodesign.co.il",
    "Habitat": "habitat.co.il",
}


class DesignRequest(BaseModel):
    room_type: str
    style: str
    budget_nis: int
    image_base64: str


class DesignResponse(BaseModel):
    analysis: str
    redesign_image_url: str
    design_brief: str
    style_label: str
    room_label: str


class ShoppingRequest(BaseModel):
    design_brief: str
    room_type: str
    style: str
    budget_nis: int


class ShoppingItem(BaseModel):
    name: str
    description: str
    category: str
    store: str
    store_url: str          # Direct search URL for the product in the store
    google_shopping_url: str  # Google Shopping search to compare prices across stores
    search_query: str        # The Hebrew search query used
    estimated_price_nis: int
    priority: str
    image_url: Optional[str] = None  # og:image scraped from the product page


class ShoppingResponse(BaseModel):
    items: list[ShoppingItem]
    total_essential: int
    total_recommended: int
    total_optional: int
    within_budget: bool
    budget_nis: int


class StylesResponse(BaseModel):
    styles: dict
    room_types: dict


# ---------- Auth ----------

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    email: str


class UserInfo(BaseModel):
    id: int
    email: str
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Saved Designs ----------

class SaveDesignRequest(BaseModel):
    room_type: str
    style: str
    room_label: str
    style_label: str
    budget_nis: int
    is_video: bool
    original_image_base64: str   # the user's uploaded photo/video as base64
    original_mime_type: str      # e.g. "image/jpeg" or "video/mp4"
    redesign_image_url: str      # DALL-E URL — backend will download it
    analysis: str
    design_brief: str
    shopping: dict               # full ShoppingResponse as dict


class SavedDesignSummary(BaseModel):
    """Light version for the list view — no heavy fields."""
    id: int
    room_label: str
    style_label: str
    budget_nis: int
    is_video: bool
    original_image_url: str   # served from /uploads/...
    redesign_image_url: str
    created_at: datetime


class SavedDesignDetail(BaseModel):
    """Full version for detail view."""
    id: int
    room_type: str
    style: str
    room_label: str
    style_label: str
    budget_nis: int
    is_video: bool
    original_image_url: str
    redesign_image_url: str
    analysis: str
    design_brief: str
    shopping: dict
    created_at: datetime


# ---------- Edit Design (שלב 2) ----------

class EditDesignRequest(BaseModel):
    redesign_image_url: str  # /uploads/redesigns/... or external URL
    edit_prompt: str         # Hebrew text from user
    style: str
    room_type: str


class EditDesignResponse(BaseModel):
    redesign_image_url: str  # /uploads/redesigns/...


# ---------- Compare Styles (שלב 4) ----------

class CompareRequest(BaseModel):
    room_type: str
    styles: list[str] = Field(min_length=2, max_length=5)
    budget_nis: int
    image_base64: str


class CompareResultItem(BaseModel):
    style: str
    style_label: str
    redesign_image_url: str
    analysis: str
    design_brief: str


class CompareResponse(BaseModel):
    room_label: str
    results: list[CompareResultItem]
