import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import Header from "../components/Header";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { from?: string; reason?: string } | null;
  const reason = state?.reason;
  const redirectTo = state?.from ?? "/";

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("הסיסמה חייבת להיות לפחות 6 תווים");
      return;
    }
    setLoading(true);
    try {
      await register(email, password);
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "ההרשמה נכשלה");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-50">
      <Header />
      <main className="max-w-md mx-auto px-4 py-12">
        <div className="card">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">הרשמה</h2>
          <p className="text-slate-500 text-sm mb-6">
            פתח חשבון כדי לשמור את העיצובים שלך ולהמשיך ליצור עוד
          </p>

          {reason === "guest_limit" && (
            <div className="bg-brand-50 border border-brand-200 text-brand-700 text-sm rounded-xl px-4 py-3 mb-6">
              ✨ ניצלת את העיצוב החינמי שלך. הירשם עכשיו (חינם!) כדי ליצור עוד עיצובים ולשמור אותם.
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">אימייל</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:border-brand-500"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">סיסמה</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:border-brand-500"
                dir="ltr"
                placeholder="לפחות 6 תווים"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-2">
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "נרשם..." : "הירשם"}
            </button>
          </form>

          <p className="text-sm text-slate-500 text-center mt-6">
            כבר יש לך חשבון?{" "}
            <Link to="/login" className="text-brand-600 font-semibold hover:underline">
              התחבר
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
