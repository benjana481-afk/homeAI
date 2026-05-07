# HomAI — עיצוב הבית שלך עם AI

אפליקציה שמצלמת חדר → מייצרת עיצוב AI → בונה רשימת קנייה מחנויות ישראליות.

## מבנה הפרויקט

```
home-design-ai/
├── backend/    # Python FastAPI + OpenAI
├── frontend/   # React + TypeScript + Tailwind (Web)
└── mobile/     # Expo React Native (iOS + Android)
```

---

## הפעלה

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# ערוך .env והכנס את ה-OPENAI_API_KEY שלך

uvicorn main:app --reload
# פועל על http://localhost:8000
```

### 2. Frontend (Web)

```bash
cd frontend
npm install
npm run dev
# פועל על http://localhost:5173
```

### 3. Mobile (Expo)

```bash
cd mobile
npm install
npx expo start
# סרוק QR עם Expo Go
```

> **מכשיר אמיתי:** שנה את `BASE_URL` בקובץ `mobile/services/api.ts` ל-IP של המחשב שלך.

---

## API Endpoints

| Method | Path | תיאור |
|--------|------|-------|
| GET | `/api/design/styles` | רשימת סגנונות וסוגי חדרים |
| POST | `/api/design/generate` | Web: multipart/form-data |
| POST | `/api/design/generate-base64` | Mobile: JSON עם base64 |
| POST | `/api/shopping/generate` | רשימת קנייה |
| GET | `/health` | בדיקת תקינות |

---

## משתני סביבה

```env
OPENAI_API_KEY=sk-...
```
