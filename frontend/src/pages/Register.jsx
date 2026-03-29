import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const set = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  const strength = (pw) => {
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 6) s++;
    if (pw.length >= 10) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^a-zA-Z0-9]/.test(pw)) s++;
    return s;
  };

  const pwStrength = strength(form.password);

  const getStrengthClass = () => {
    if (pwStrength === 0) return "w-0 bg-transparent";
    if (pwStrength <= 2) return "w-1/3 bg-red-400";
    if (pwStrength <= 4) return "w-2/3 bg-yellow-400";
    return "w-full bg-green-500";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error("Please fill in all fields");
    if (form.password.length < 6) return toast.error("Password must be at least 6 characters");
    if (form.password !== form.confirm) return toast.error("Passwords do not match");
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success("Account created successfully!");
      navigate("/");
    } catch (e) {
      toast.error(e.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-purple-50 flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-8 p-6 border border-gray-100 animate-[slideUp_0.4s_ease-out]">

        {/* Header */}
        <div className="mb-8 text-center pt-2">
          <h2 className="text-3xl font-semibold text-gray-900 tracking-tight">Create your account</h2>
          <p className="text-sm text-gray-500 mt-2.5">Join us to manage your work with ease.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1.5 font-medium">Full name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="John Doe"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 text-gray-900 placeholder-gray-400 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1.5 font-medium">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="name@example.com"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 text-gray-900 placeholder-gray-400 text-sm"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-sm text-gray-600 font-medium">Password</label>
            </div>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="Create a password"
                className="w-full pl-4 pr-12 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 text-gray-900 placeholder-gray-400 text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors bg-transparent border-none"
              >
                {showPass ? "Hide" : "Show"}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {form.password && (
              <div className="mt-2.5">
                <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden flex">
                  <div className={`h-full rounded-full transition-all duration-300 ${getStrengthClass()}`} />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1.5 font-medium">Confirm password</label>
            <input
              type={showPass ? "text" : "password"}
              value={form.confirm}
              onChange={(e) => set("confirm", e.target.value)}
              placeholder="Confirm your password"
              className={`w-full px-4 py-2.5 bg-gray-50 border rounded-lg focus:bg-white focus:outline-none focus:ring-2 transition-all duration-200 text-gray-900 placeholder-gray-400 text-sm ${form.confirm && form.password !== form.confirm
                  ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                  : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-100"
                }`}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold rounded-lg shadow hover:shadow-md hover:from-indigo-600 hover:to-purple-700 hover:-translate-y-px active:scale-95 transition-all duration-200 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              "Sign up"
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors relative group"
          >
            Login
            <span className="absolute -bottom-0.5 left-0 w-0 h-[1.5px] bg-indigo-500 transition-all duration-300 group-hover:w-full"></span>
          </Link>
        </p>
      </div>
    </div>
  );
}
