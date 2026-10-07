"use client";

import { useActionState } from "react";
import { loginAdmin } from "../actions";
import Link from "next/link";
import { Utensils, Shield, ArrowLeft } from "lucide-react";

export default function AdminLoginPage() {
  const [state, formAction, isPending] = useActionState(loginAdmin, null);

  return (
    <div className="min-h-screen bg-base-200 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-base-content/70 hover:text-primary transition-colors mb-6 mx-auto block w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Store
        </Link>

        <div className="flex justify-center items-center gap-2 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-content shadow-lg shadow-primary/20">
            <Utensils className="w-6 h-6" />
          </div>
        </div>

        <h2 className="text-center text-3xl font-black tracking-tight">
          <span className="text-primary">CYGLASE</span>{" "}
          <span className="text-secondary">FOODS</span>
        </h2>
        <div className="flex items-center justify-center gap-1.5 mt-2">
          <Shield className="w-4 h-4 text-primary" />
          <p className="text-center text-sm font-semibold uppercase tracking-wider text-base-content/70">
            Admin Portal
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body">
            {state?.error && (
              <div role="alert" className="alert alert-error text-sm py-2.5 mb-4">
                <span>{state.error}</span>
              </div>
            )}

            <form action={formAction} className="flex flex-col gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Admin Email</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="admin@cyglase.com"
                  defaultValue="admin@cyglase.com"
                  className="input input-bordered w-full focus:input-primary"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Password</span>
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="••••••••••••"
                  defaultValue="Things-don@make=sense"
                  className="input input-bordered w-full focus:input-primary"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="btn btn-primary w-full mt-2 font-bold shadow-md shadow-primary/20"
              >
                {isPending ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Authenticating...
                  </>
                ) : (
                  "Sign In to Dashboard"
                )}
              </button>
            </form>

            <div className="divider my-4 text-xs text-base-content/40">SECURED PLATFORM ACCESS</div>
            <p className="text-center text-xs text-base-content/60">
              Only authorized Cyglase Foods administrators can access this area.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
