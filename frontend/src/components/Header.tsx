import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Header() {
  const { email, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-3 hover:opacity-80">
        <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center text-white text-lg font-bold">
          H
        </div>
        <div>
          <h1 className="font-bold text-xl text-slate-800">HomAI</h1>
          <p className="text-xs text-slate-400">עיצוב הבית שלך עם בינה מלאכותית</p>
        </div>
      </Link>

      <div className="flex items-center gap-3">
        {isLoggedIn ? (
          <>
            <Link to="/compare" className="btn-secondary text-sm">
              📊 השוואה
            </Link>
            <Link to="/my-designs" className="btn-secondary text-sm">
              🎨 העיצובים שלי
            </Link>
            <span className="hidden md:block text-sm text-slate-500" dir="ltr">{email}</span>
            <button onClick={onLogout} className="text-sm text-slate-500 hover:text-slate-700">
              יציאה
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-sm text-slate-600 hover:text-slate-800">
              התחברות
            </Link>
            <Link to="/register" className="btn-primary text-sm py-2 px-4">
              הרשמה
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
