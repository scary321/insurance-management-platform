import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const STAFF_NAV = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/customers", label: "Customers" },
  { to: "/policies", label: "Policies" },
  { to: "/claims", label: "Claims" },
  { to: "/premiums", label: "Premiums" },
  { to: "/documents", label: "Documents" },
  { to: "/reports", label: "Reports" },
];

const CUSTOMER_NAV = [
  { to: "/", label: "Home", end: true },
  { to: "/policies", label: "My policies" },
  { to: "/claims", label: "My claims" },
  { to: "/premiums", label: "My premiums" },
  { to: "/documents", label: "My documents" },
];

export default function Layout() {
  const { user, isStaff, logout } = useAuth();
  const navigate = useNavigate();

  const NAV = isStaff ? STAFF_NAV : CUSTOMER_NAV;

  const initials = (user?.name || "?")
    .split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="min-h-screen bg-paper">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-60 bg-pine text-white/90 flex flex-col">
        <div className="px-6 pt-7 pb-6">
          <div className="flex items-center gap-2.5">
            <span className="inline-block h-6 w-1 rounded-full bg-bronze" />
            <div className="leading-tight">
              <div className="font-display text-[17px] text-white">Assured</div>
              <div className="label text-white/40 mt-0.5">Policy Ledger</div>
            </div>
          </div>
        </div>

        <nav className="px-3 flex-1 space-y-0.5">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-pine-soft text-white"
                    : "text-white/55 hover:text-white hover:bg-pine-soft/60",
                ].join(" ")
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={[
                      "h-1.5 w-1.5 rounded-full transition-colors",
                      isActive ? "bg-bronze" : "bg-white/20 group-hover:bg-white/40",
                    ].join(" ")}
                  />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-pine-line">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="h-8 w-8 rounded-full bg-bronze/20 text-bronze-soft grid place-items-center font-mono text-xs">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm text-white">{user?.name}</div>
              <div className="label text-white/40">{user?.role}</div>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate("/login"); }}
            className="mt-1 w-full text-left rounded-lg px-3 py-2 text-sm text-white/55 hover:text-white hover:bg-pine-soft/60 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="pl-60">
        <main className="mx-auto max-w-6xl px-8 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
