"use client";

import { useState } from "react";
import { updatePlatformSetting } from "../../actions";
import { Sliders, Save, CheckCircle2, Clock, DollarSign } from "lucide-react";
import type { Database } from "@/types/database.types";

type Setting = Database["public"]["Tables"]["platform_settings"]["Row"];

export default function SettingsManager({
  initialSettings,
}: {
  initialSettings: Setting[];
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const getSettingValue = (key: string) => {
    return settings.find((s) => s.key === key)?.value || "";
  };

  const handleSave = async (key: string, value: string) => {
    setSavingKey(key);
    setSuccessMsg(null);

    const res = await updatePlatformSetting(key, value);
    setSavingKey(null);

    if (res?.error) {
      alert(`Error saving setting: ${res.error}`);
    } else {
      setSettings((prev) =>
        prev.map((s) => (s.key === key ? { ...s, value } : s))
      );
      setSuccessMsg(`Setting "${key}" updated successfully!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
          <Sliders className="w-6 h-6 text-primary" />
          Platform Settings
        </h1>
        <p className="text-xs text-base-content/60 mt-1">
          Adjust payment deadlines, financial defaults, and store automation rules.
        </p>
      </div>

      {successMsg && (
        <div role="alert" className="alert alert-success text-xs py-2.5 text-white">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Settings Cards */}
      <div className="flex flex-col gap-4">
        {/* Payment Wait Time Setting */}
        <div className="card bg-base-100 border border-base-300 shadow-xs">
          <div className="card-body p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <Clock className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm text-base-content">
                  Customer Transfer Wait Duration
                </h3>
                <p className="text-xs text-base-content/60 mt-0.5">
                  How many minutes a customer has to make a direct bank transfer and upload their receipt before the order is automatically cancelled.
                </p>

                <div className="flex items-center gap-3 mt-3 max-w-xs">
                  <input
                    type="number"
                    min="1"
                    max="120"
                    id="wait_time_input"
                    defaultValue={getSettingValue("payment_wait_time_minutes") || "15"}
                    className="input input-bordered input-sm w-28 focus:input-primary font-bold text-center"
                  />
                  <span className="text-xs font-semibold text-base-content/70">
                    Minutes
                  </span>

                  <button
                    onClick={() => {
                      const input = document.getElementById(
                        "wait_time_input"
                      ) as HTMLInputElement;
                      if (input) {
                        handleSave("payment_wait_time_minutes", input.value);
                      }
                    }}
                    disabled={savingKey === "payment_wait_time_minutes"}
                    className="btn btn-primary btn-sm font-bold gap-1 shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Currency Settings */}
        <div className="card bg-base-100 border border-base-300 shadow-xs">
          <div className="card-body p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-accent/20 text-accent-content flex items-center justify-center shrink-0 mt-0.5">
                <DollarSign className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm text-base-content">
                  Currency & Denomination
                </h3>
                <p className="text-xs text-base-content/60 mt-0.5">
                  Default currency code and symbol displayed across checkouts, vendor payouts, and line items.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 max-w-md">
                  <div>
                    <label className="label py-1">
                      <span className="label-text text-xs font-semibold">
                        Currency Symbol
                      </span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        id="currency_symbol_input"
                        defaultValue={getSettingValue("currency_symbol") || "₦"}
                        className="input input-bordered input-sm w-20 text-center font-bold"
                      />
                      <button
                        onClick={() => {
                          const input = document.getElementById(
                            "currency_symbol_input"
                          ) as HTMLInputElement;
                          if (input) {
                            handleSave("currency_symbol", input.value);
                          }
                        }}
                        disabled={savingKey === "currency_symbol"}
                        className="btn btn-primary btn-sm font-bold"
                      >
                        Save
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="label py-1">
                      <span className="label-text text-xs font-semibold">
                        Currency Code
                      </span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        id="currency_code_input"
                        defaultValue={getSettingValue("currency") || "NGN"}
                        className="input input-bordered input-sm w-24 text-center font-bold font-mono"
                      />
                      <button
                        onClick={() => {
                          const input = document.getElementById(
                            "currency_code_input"
                          ) as HTMLInputElement;
                          if (input) {
                            handleSave("currency", input.value);
                          }
                        }}
                        disabled={savingKey === "currency"}
                        className="btn btn-primary btn-sm font-bold"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
