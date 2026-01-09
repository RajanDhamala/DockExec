import { useState, useEffect, useRef } from "react"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Save, Bell, Shield, Smartphone, Mail, Trash2, Download, CheckCircle, XCircle, FileText
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { UAParser } from "ua-parser-js";
import toast from "react-hot-toast"
import { useNavigate } from "react-router-dom";


export default function PrefrencePage() {
  const parser = new UAParser();

  const navigate = useNavigate()

  const defaultPreferences = {
    theme: "light",
    language: "en",
    dataUsage: true,
    marketing: false,
  };

  function useLocalStorageState(key, defaultValue) {
    const [state, setState] = useState(() => {
      if (typeof window === "undefined") return defaultValue;
      try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : defaultValue;
      } catch {
        return defaultValue;
      }
    });

    useEffect(() => {
      localStorage.setItem(key, JSON.stringify(state));
    }, [key, state]);

    return [state, setState];
  }

  const [preferences, setPreferences] = useLocalStorageState(
    "userPreferences",
    defaultPreferences
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const updatePreference = (key, value) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  const handleDeleteAccount = async () => {
    console.log("Account deleted!");
    localStorage.removeItem("userPreferences");
    const reqs = await axios.delete(`http://localhost:8000/users/delAccount`, {
      withCredentials: true
    })
    if (!reqs.data.data.really) {
      toast.error("failed to delete account")
      setDeleteDialogOpen(false);
      return
    } else {
      setDeleteDialogOpen(false);
      navigate("/auth/login")
      window.location.reload()

    }
  };

  const handleSavePreferences = () => {
    // Preferences are already synced to localStorage automatically
    console.log("Preferences saved:", preferences);
  };

  // Update profile API
  const updateProfile = async (data) => {
    const response = await axios.put(`http://localhost:8000/users/updateProfile`, data, {
      withCredentials: true
    })
    return response.data
  }

  const fetchNotificationSettings = async () => {
    const response = await axios.get(`http://localhost:8000/notification`, {
      withCredentials: true
    })
    return response.data.data
  }

  const updateNotificationSettings = async (toggles) => {
    const response = await axios.post(
      `http://localhost:8000/notification/setNotfications`,
      { toggles },
      { withCredentials: true }
    )
    return response.data.data
  }

  const queryClient = useQueryClient()

  const {
    data: notificationData,
    isLoading: notificationLoading,
    isError: notificationError
  } = useQuery({
    queryKey: ["notificationSettings"],
    queryFn: fetchNotificationSettings
  })

  const [localSettings, setLocalSettings] = useState({})

  useEffect(() => {
    if (notificationData) {
      setLocalSettings({
        emailNotifications: notificationData.emailNotifications,
        pushNotifications: notificationData.pushNotifications,
        smsNotifications: notificationData.smsNotifications,
        workflowSuccess: notificationData.workflowSuccess,
        workflowFailure: notificationData.workflowFailure,
        weeklyReports: notificationData.weeklyReports,
        securityAlerts: notificationData.securityAlerts
      })
      setChangedFields(new Set())
    }
  }, [notificationData])

  const handleToggle = (field) => {
    setLocalSettings(prev => ({
      ...prev,
      [field]: !prev[field]
    }))

    setChangedFields(prev => {
      const newSet = new Set(prev)
      const originalValue = notificationData?.[field]
      const newValue = !localSettings[field]

      if (newValue !== originalValue) {
        newSet.add(field)
      } else {
        newSet.delete(field)
      }
      return newSet
    })
  }

  const notificationMutation = useMutation({
    mutationFn: updateNotificationSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificationSettings"] })
      setChangedFields(new Set())
    }
  })

  const handleCancel = () => {
    if (notificationData) {
      setLocalSettings({
        emailNotifications: notificationData.emailNotifications,
        pushNotifications: notificationData.pushNotifications,
        smsNotifications: notificationData.smsNotifications,
        workflowSuccess: notificationData.workflowSuccess,
        workflowFailure: notificationData.workflowFailure,
        weeklyReports: notificationData.weeklyReports,
        securityAlerts: notificationData.securityAlerts
      })
      setChangedFields(new Set())
    }
  }

  const notificationConfig = {
    channels: [
      {
        key: 'emailNotifications',
        label: 'Email Notifications',
        description: 'Receive notifications via email',
        icon: Mail
      },
      {
        key: 'pushNotifications',
        label: 'Push Notifications',
        description: 'Receive push notifications in browser',
        icon: Bell
      },
      {
        key: 'smsNotifications',
        label: 'SMS Notifications',
        description: 'Receive notifications via text message',
        icon: Smartphone
      }
    ],
    alerts: [
      {
        key: 'workflowSuccess',
        label: 'Workflow Success',
        description: 'Get notified when workflows complete successfully',
        icon: CheckCircle
      },
      {
        key: 'workflowFailure',
        label: 'Workflow Failure',
        description: 'Get notified when workflows fail',
        icon: XCircle
      },
      {
        key: 'weeklyReports',
        label: 'Weekly Reports',
        description: 'Receive weekly summary reports',
        icon: FileText
      },
      {
        key: 'securityAlerts',
        label: 'Security Alerts',
        description: 'Get notified about security-related events',
        icon: Shield
      }
    ]
  }

  const handleSaveNotification = () => {
    if (changedFields.size > 0) {
      notificationMutation.mutate(Array.from(changedFields))
    }
  }

  const [changedFields, setChangedFields] = useState(new Set())

  const isSaving = false
  const hasChanges = changedFields.size > 0


  return (
    <div className="space-y-8 ">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Notification & Preferences</h1>
          <p className="text-gray-600 dark:text-slate-400 mt-1">Manage your account Notifications and preferences </p>
        </div>
      </div>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 gap-2 md:grid-cols-5 h-auto p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <TabsTrigger value="notifications" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 dark:text-slate-300 dark:data-[state=active]:text-white">Notifications</TabsTrigger>
          <TabsTrigger value="preferences" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 dark:text-slate-300 dark:data-[state=active]:text-white">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-slate-700 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Notification Preferences</CardTitle>
              <CardDescription className="text-gray-500 dark:text-slate-400">Choose how and when you want to be notified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {notificationLoading ? (
                <div className="text-gray-500 dark:text-slate-400">Loading notification settings...</div>
              ) : notificationError ? (
                <div className="text-red-500 dark:text-red-400">Failed to load notification settings</div>
              ) : notificationData ? (
                <>
                  {/* Notification Channels */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notification Channels</h3>
                    <div className="space-y-3">
                      {notificationConfig.channels.map((item) => {
                        const Icon = item.icon
                        const isChanged = changedFields.has(item.key)
                        return (
                          <div
                            key={item.key}
                            className={`flex items-center justify-between p-4 border rounded-lg transition-colors
                          ${isChanged
                                ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500/50'
                                : 'border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <div className="font-medium text-sm text-gray-900 dark:text-white">{item.label}</div>
                                <div className="text-xs text-gray-500 dark:text-slate-400">{item.description}</div>
                              </div>
                            </div>
                            <Switch
                              className="data-[state=checked]:bg-blue-500 dark:data-[state=checked]:bg-blue-500"
                              checked={localSettings[item.key] ?? false}
                              onCheckedChange={() => handleToggle(item.key)}
                            />
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-slate-700" />

                  {/* Alert Types */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Alert Types</h3>
                    <div className="space-y-3">
                      {notificationConfig.alerts.map((item) => {
                        const Icon = item.icon
                        const isChanged = changedFields.has(item.key)

                        // Helper for dynamic colors
                        const getColorClasses = (key) => {
                          switch (key) {
                            case 'workflowSuccess': return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' };
                            case 'workflowFailure': return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' };
                            case 'securityAlerts': return { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400' };
                            default: return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' };
                          }
                        }
                        const colors = getColorClasses(item.key);

                        return (
                          <div
                            key={item.key}
                            className={`flex items-center justify-between p-4 border rounded-lg transition-colors
                          ${isChanged
                                ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500/50'
                                : 'border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${colors.bg}`}>
                                <Icon className={`w-5 h-5 ${colors.text}`} />
                              </div>
                              <div>
                                <div className="font-medium text-sm text-gray-900 dark:text-white">{item.label}</div>
                                <div className="text-xs text-gray-500 dark:text-slate-400">{item.description}</div>
                              </div>
                            </div>
                            <Switch
                              className="data-[state=checked]:bg-blue-500 dark:data-[state=checked]:bg-blue-500"
                              checked={localSettings[item.key] ?? false}
                              onCheckedChange={() => handleToggle(item.key)}
                            />
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                    {hasChanges && (
                      <Button
                        variant="outline"
                        className="border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                        onClick={handleCancel}
                        disabled={isSaving}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button
                      className="bg-blue-500 hover:bg-blue-600 text-white gap-2"
                      onClick={handleSaveNotification}
                      disabled={!hasChanges || isSaving}
                    >
                      <Save className="w-4 h-4" />
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-gray-500 dark:text-slate-400">No notification settings found</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="preferences" className="space-y-6">
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-slate-700 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Application Preferences</CardTitle>
              <CardDescription className="text-gray-500 dark:text-slate-400">Customize your application experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 dark:text-white">Appearance</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="theme" className="text-gray-700 dark:text-slate-300">Theme</Label>
                    <Select
                      value={preferences.theme}
                      onValueChange={(value) => updatePreference("theme", value)}
                    >
                      <SelectTrigger className="h-11 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:border-blue-500 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <SelectItem value="light" className="dark:text-white dark:focus:bg-gray-700">Light</SelectItem>
                        <SelectItem value="dark" className="dark:text-white dark:focus:bg-gray-700">Dark</SelectItem>
                        <SelectItem value="system" className="dark:text-white dark:focus:bg-gray-700">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language" className="text-gray-700 dark:text-slate-300">Language</Label>
                    <Select
                      value={"en"}
                      onValueChange={(value) => updatePreference("language", value)}
                    >
                      <SelectTrigger className="h-11 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:border-blue-500 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <SelectItem value="en" className="dark:text-white dark:focus:bg-gray-700">English</SelectItem>
                        <SelectItem value="es" className="dark:text-white dark:focus:bg-gray-700">Spanish</SelectItem>
                        <SelectItem value="fr" className="dark:text-white dark:focus:bg-gray-700">French</SelectItem>
                        <SelectItem value="de" className="dark:text-white dark:focus:bg-gray-700">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 dark:text-white">Data & Privacy</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Analytics & Usage Data</div>
                      <div className="text-sm text-gray-600 dark:text-slate-400">
                        Help improve our product by sharing usage data
                      </div>
                    </div>
                    <Switch
                      className="data-[state=checked]:bg-blue-500 dark:data-[state=checked]:bg-blue-500"
                      checked={preferences.dataUsage}
                      onCheckedChange={(checked) => updatePreference("dataUsage", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Marketing Communications</div>
                      <div className="text-sm text-gray-600 dark:text-slate-400">
                        Receive product updates and marketing emails
                      </div>
                    </div>
                    <Switch
                      className="data-[state=checked]:bg-blue-500 dark:data-[state=checked]:bg-blue-500"
                      checked={preferences.marketing}
                      onCheckedChange={(checked) => updatePreference("marketing", checked)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 dark:text-white">Data Export</h3>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    Export your data including workflows, logs, and account information.
                  </p>
                  <Button variant="outline" className="gap-2 bg-transparent border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <Download className="w-4 h-4" />
                    Export Data
                  </Button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="space-y-4">
                <h3 className="font-medium text-red-600 dark:text-red-400">Danger Zone</h3>
                <div className="p-4 border border-red-200 dark:border-red-900/50 rounded-lg bg-red-50 dark:bg-red-900/10">
                  <div className="space-y-4">
                    <div>
                      <div className="font-medium text-red-900 dark:text-red-400">Delete Account</div>
                      <div className="text-sm text-red-700 dark:text-red-400/80">
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </div>
                    </div>

                    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="gap-2 bg-red-600 hover:bg-red-700 text-white border-none">
                          <Trash2 className="w-4 h-4" />
                          Delete Account
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-slate-700">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-gray-900 dark:text-white">Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-500 dark:text-slate-400">
                            This action cannot be undone. This will permanently delete your
                            account and remove all your data from our servers including
                            workflows, logs, and preferences.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-white dark:bg-gray-800 text-gray-700 dark:text-white border-gray-300 dark:border-slate-600">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteAccount}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            Yes, delete my account
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSavePreferences}
                  className="bg-blue-500 hover:bg-blue-600 text-white gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
