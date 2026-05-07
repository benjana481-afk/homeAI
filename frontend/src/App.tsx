import { Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import Compare from "./pages/Compare";
import Home from "./pages/Home";
import Login from "./pages/Login";
import MyDesigns from "./pages/MyDesigns";
import Register from "./pages/Register";
import Result from "./pages/Result";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/result" element={<Result />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/my-designs" element={<MyDesigns />} />
      </Routes>
    </AuthProvider>
  );
}
