"use client";

import { useActionState, useState, useEffect } from "react";
import { onboardVendor, getDbLocations } from "../actions";
import { Store, MapPin, Phone, Sparkles } from "lucide-react";

export default function VendorOnboardingPage() {
  const [state, formAction, isPending] = useActionState(onboardVendor, null);
  const [selectedState, setSelectedState] = useState("Lagos");
  const [selectedArea, setSelectedArea] = useState("");
  const [dbLocations, setDbLocations] = useState<any[]>([]);

  useEffect(() => {
    getDbLocations().then((locs) => {
      if (locs && locs.length > 0) {
        setDbLocations(locs);
      }
    });
  }, []);

  return (
    <div className="min-h-screen bg-base-200 flex flex-col justify-center px-4 py-8 sm:px-6">
      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-primary text-primary-content flex items-center justify-center mx-auto mb-3 shadow-lg shadow-primary/20">
            <Store className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-base-content">
            Launch Your Food Kitchen
          </h1>
          <p className="text-xs text-base-content/60 mt-1 max-w-xs mx-auto">
            Just 3 quick details to get your storefront ready. You can configure bank payout & hours in settings anytime.
          </p>
        </div>

        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body p-6">
            {state?.error && (
              <div role="alert" className="alert alert-error text-xs py-2.5 mb-4">
                <span>{state.error}</span>
              </div>
            )}

            <form action={formAction} className="flex flex-col gap-4 text-xs">
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-bold text-xs flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-primary" />
                    Kitchen / Restaurant Name *
                  </span>
                </label>
                <input
                  type="text"
                  name="business_name"
                  required
                  placeholder="e.g. Mama Put & Grills"
                  className="input input-bordered input-md w-full focus:input-primary text-sm font-semibold"
                />
              </div>

              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-bold text-xs flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-primary" />
                    Phone Number (Orders & Dispatch) *
                  </span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="0803 123 4567"
                  className="input input-bordered input-md w-full focus:input-primary font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs">State *</span>
                  </label>
                  <select
                    name="state"
                    value={selectedState}
                    onChange={(e) => {
                      setSelectedState(e.target.value);
                      setSelectedArea("");
                    }}
                    className="select select-bordered select-md w-full text-xs font-semibold"
                  >
                    {dbLocations.length > 0 ? (
                      dbLocations.map((st) => (
                        <option key={st.id} value={st.name}>
                          {st.name}
                        </option>
                      ))
                    ) : (
                      <option value="">Loading states...</option>
                    )}
                  </select>
                </div>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-primary" />
                      Area in {selectedState} *
                    </span>
                  </label>
                  <input
                    type="text"
                    name="city_area"
                    required
                    list="onboarding-cities-datalist"
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    placeholder={`e.g. ${
                      dbLocations.find((l) => l.name === selectedState)?.cities?.[0]?.name || "Ikeja, Yaba"
                    }`}
                    className="input input-bordered input-md w-full focus:input-primary text-xs font-medium"
                  />
                  <datalist id="onboarding-cities-datalist">
                    {(dbLocations.find((l) => l.name === selectedState)?.cities || []).map((c: any) => (
                      <option key={c.id} value={c.name} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-base-200/60 border border-base-300/40 text-[11px] text-base-content/70 mt-1 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                <span>
                  <strong>Tip:</strong> You can add your bank account for transfers, menu dishes, and delivery landmarks inside your Settings tab once inside.
                </span>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="btn btn-primary w-full mt-3 font-bold shadow-md shadow-primary/20 text-sm"
              >
                {isPending ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Setting Up Storefront...
                  </>
                ) : (
                  "Launch My Kitchen 🚀"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
