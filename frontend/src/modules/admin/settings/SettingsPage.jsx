import { useState, useEffect } from "react";
import { useApiQuery, useApiMutation } from "@/hooks/useApi";
import toast from "react-hot-toast";
import {
  Save,
  RefreshCcw,
  Bell,
  Shield,
  Globe,
  Info,
  Palette,
  Plus,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";
import { getApi, putApi } from '@/services/api';
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { List } from "lucide-react";

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("general");

  const { data: settings, isLoading, refetch } = useApiQuery(["settings"], async () => {
    const res = await getApi('system/settings');
    return res.data;
  });

  const [localColors, setLocalColors] = useState([]);

  // Sync localColors when settings load
  useEffect(() => {
    if (settings?.homeColors) {
      try {
        const parsed = JSON.parse(settings.homeColors);
        if (Array.isArray(parsed)) {
          setLocalColors(parsed);
        }
      } catch (e) {
        console.error("Failed to parse homeColors setting");
      }
    }
  }, [settings]);

  const updateMutation = useApiMutation({
    mutationFn: (data) => putApi('system/settings', data),
    onSuccess: () => {
      toast.success("Settings updated successfully!");
      refetch();
    },
    onError: (err) => {
      toast.error(
        `Failed to update settings: ${err.message || "Unknown error"}`,
      );
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    // Add the stringified colors to the payload
    data.homeColors = JSON.stringify(localColors);

    updateMutation.mutate(data);
  };

  const addColor = () => {
    setLocalColors([...localColors, { name: "", hex: "#000000", image: "" }]);
  };

  const removeColor = (index) => {
    setLocalColors(localColors.filter((_, i) => i !== index));
  };

  const updateColor = (index, key, value) => {
    const updated = [...localColors];
    updated[index][key] = value;
    setLocalColors(updated);
  };

  const tabs = [
    { id: "general", label: "General", icon: Globe },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">System Settings</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage global configurations for your application.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <aside className="lg:w-64 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium
                  ${
                    activeTab === tab.id
                      ? "bg-primary-600/10 text-primary-400 border border-primary-500/20"
                      : "text-gray-400 hover:bg-gray-800 border border-transparent"
                  }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </aside>

        {/* Settings Form */}
        <div className="flex-1 card p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {activeTab === "general" && (
              <div className="space-y-4">
                <Input
                  label="App Name"
                  name="appName"
                  placeholder="My Application"
                  defaultValue={settings?.appName || "Generic Template"}
                />
                <Input
                  label="App Email"
                  name="appEmail"
                  type="email"
                  placeholder="support@example.com"
                  defaultValue={settings?.appEmail || "admin@example.com"}
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-300">
                    Currency Settings
                  </label>
                  <select
                    name="currency"
                    defaultValue={settings?.currency || "$"}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 text-gray-100 text-sm px-3 py-2"
                  >
                    <option value="$">USD ($)</option>
                    <option value="€">EUR (€)</option>
                    <option value="£">GBP (£)</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-gray-800 mt-4">
                  <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
                    Application Info
                  </h3>
                  <p className="text-xs text-gray-500">Configure global application identifiers and descriptions.</p>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex gap-3">
                  <Info className="text-blue-400 shrink-0" size={20} />
                  <p className="text-sm text-blue-300">
                    Security settings are configured via environment variables
                    for sensitive data.
                  </p>
                </div>
                <Input
                  label="Session Timeout (minutes)"
                  name="sessionTimeout"
                  type="number"
                  defaultValue="60"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="mfaRequired"
                    id="mfa"
                    className="rounded border-gray-700 bg-gray-800"
                  />
                  <label
                    htmlFor="mfa"
                    className="text-sm text-gray-300 cursor-pointer"
                  >
                    Require 2FA for all administrators
                  </label>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-4">
                <p className="text-sm text-gray-400">
                  Configure which events trigger email notifications.
                </p>
                <div className="space-y-3">
                  {[
                    "User Registration",
                    "System Alerts",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-800 bg-gray-900/50"
                    >
                      <span className="text-gray-300 text-sm">{item}</span>
                      <input
                        type="checkbox"
                        defaultChecked
                        className="rounded border-gray-700 bg-gray-800 text-primary-600"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-gray-800 flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                icon={RefreshCcw}
                onClick={() => refetch()}
              >
                Reset
              </Button>
              <Button
                type="submit"
                icon={Save}
                loading={updateMutation.isPending}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
