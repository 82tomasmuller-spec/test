"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "../AdminContext";

interface ClubEntry {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  contactEmail: string;
  createdAt: string;
  memberships?: {
    id: string;
    role: string;
    user: {
      name: string;
      email: string;
    };
  }[];
}

export default function SuperAdminPage() {
  const { user } = useAdmin();
  const router = useRouter();
  const [clubs, setClubs] = useState<ClubEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && !user.isSuperAdmin) {
      router.push("/admin");
      return;
    }

    async function fetchClubs() {
      setLoading(true);
      try {
        const res = await fetch("/api/superadmin/clubs", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setClubs(data.clubs ?? data ?? []);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }

    if (user?.isSuperAdmin) {
      fetchClubs();
    }
  }, [user, router]);

  async function toggleClubActive(clubId: string, activate: boolean) {
    try {
      const res = await fetch(`/api/superadmin/clubs/${clubId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: activate }),
      });
      if (res.ok) {
        setClubs((prev) =>
          prev.map((c) =>
            c.id === clubId ? { ...c, isActive: activate } : c
          )
        );
      }
    } catch {
      // silently fail
    }
  }

  if (!user?.isSuperAdmin) {
    return null;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">SuperAdmin</h1>
        <p className="text-sm text-slate-500 mt-1">Sprava vsech klubu v systemu</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <svg className="animate-spin h-8 w-8 text-indigo-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : clubs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <p className="text-slate-500">Zatim neni registrovan zadny klub.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Klub</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Slug</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Admin</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-700">Stav</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-700">Registrace</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-700">Akce</th>
                </tr>
              </thead>
              <tbody>
                {clubs.map((club, idx) => {
                  const adminMember = club.memberships?.find(
                    (m) => m.role === "ADMIN"
                  );
                  return (
                    <tr
                      key={club.id}
                      className={`border-b border-slate-100 ${
                        idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                      } hover:bg-indigo-50/50 transition-colors`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{club.name}</div>
                        <div className="text-xs text-slate-500">{club.contactEmail}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                        {club.slug}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {adminMember ? (
                          <div>
                            <div className="text-sm">{adminMember.user.name}</div>
                            <div className="text-xs text-slate-500">
                              {adminMember.user.email}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {club.isActive ? (
                          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Aktivni
                          </span>
                        ) : (
                          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                            Neaktivni
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500 text-xs">
                        {new Date(club.createdAt).toLocaleDateString("cs-CZ")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {club.isActive ? (
                          <button
                            onClick={() => toggleClubActive(club.id, false)}
                            className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            Deaktivovat
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleClubActive(club.id, true)}
                            className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors"
                          >
                            Aktivovat
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 text-sm text-slate-500">
            Celkem: {clubs.length} klubu
          </div>
        </div>
      )}
    </div>
  );
}
