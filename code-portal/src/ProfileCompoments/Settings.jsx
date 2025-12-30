

import { useState, useEffect } from "react"
import {
  Save,
  Bell,
  Shield,
  CreditCard,
  Smartphone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Trash2,
  Download,
  Upload,
  CheckCircle, XCircle, FileText
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { DashboardLayout } from "./DashboardLayout"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"

export default function SettingsPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: false,
    workflowSuccess: true,
    workflowFailure: true,
    weeklyReport: true,
    securityAlerts: true,
  })

  const fetchUserBasics = async () => {
    const response = await axios.get(`http://localhost:8000/profile/usrProfile`, {
      withCredentials: true
    })
    return response.data.data
  }

  // Update profile API
  const updateProfile = async (data) => {
    const response = await axios.put(`http://localhost:8000/users/updateProfile`, data, {
      withCredentials: true
    })
    return response.data
  }

  // Upload avatar API
  const uploadAvatar = async (file) => {
    const formData = new FormData()
    formData.append('avatar', file)
    const response = await axios.put(`http://localhost:8000/users/changeAvatar`, formData, {
      withCredentials: true,
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  }

  const handleNotificationChange = (key, value) => {
    setNotifications((prev) => ({ ...prev, [key]: value }))
  }
  const fetchNotificationSettings = async () => {
    const response = await axios.get(`http://localhost:8000/notification`, {
      withCredentials: true
    })
    return response.data.data
  }

  // Update notification settings
  const updateNotificationSettings = async (toggles) => {
    const response = await axios.post(
      `http://localhost:8000/notification/setNotfications`,
      { toggles },
      { withCredentials: true }
    )
    return response.data.data
  }

  // Inside your component:
  const queryClient = useQueryClient()

  const {
    data: notificationData,
    isLoading: notificationLoading,
    isError: notificationError
  } = useQuery({
    queryKey: ["notificationSettings"],
    queryFn: fetchNotificationSettings
  })

  // Local state for toggles
  const [localSettings, setLocalSettings] = useState({})

  // Sync local state when data loads
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

  // Handle toggle change locally
  const handleToggle = (field) => {
    setLocalSettings(prev => ({
      ...prev,
      [field]: !prev[field]
    }))

    // Track changed fields (toggle = changed from original)
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


  // Cancel changes
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

  // Notification settings config
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

  // Save all changes in bulk
  const handleSaveNotification = () => {
    if (changedFields.size > 0) {
      notificationMutation.mutate(Array.from(changedFields))
    }
  }

  const { data: profileData, isLoading: ProfileLoading, isError } = useQuery({
    queryKey: ["fetchUserBasics"],
    queryFn: fetchUserBasics
  })

  // Local form state
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    dob: '',
    bio: '',
    timezone: 'pst'
  })

  // Avatar state
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)

  // Track which fields have changed
  const [changedFields, setChangedFields] = useState(new Set())

  // Sync form data when profileData loads
  useEffect(() => {
    if (profileData) {
      setFormData({
        fullname: profileData.fullname || '',
        email: profileData.email || '',
        dob: profileData.dob || '',
        bio: profileData.bio || '',
        timezone: profileData.timezone || 'pst'
      })
      setAvatarPreview(profileData.avatar || null)
    }
  }, [profileData])

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Track if field changed from original
    if (profileData && value !== profileData[field]) {
      setChangedFields(prev => new Set(prev).add(field))
    } else {
      setChangedFields(prev => {
        const newSet = new Set(prev)
        newSet.delete(field)
        return newSet
      })
    }
  }

  // Handle avatar selection
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB')
        return
      }
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
      setChangedFields(prev => new Set(prev).add('avatar'))
    }
  }

  // Profile update mutation
  const profileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fetchUserBasics"] })
      setChangedFields(new Set())
    }
  })

  // Avatar upload mutation
  const avatarMutation = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fetchUserBasics"] })
      setAvatarFile(null)
    }
  })

  // Save all changes
  const handleSave = async () => {
    try {
      // Upload avatar if changed
      if (avatarFile) {
        await avatarMutation.mutateAsync(avatarFile)
      }

      // Update profile if any fields changed (excluding avatar)
      const fieldsToUpdate = new Set(changedFields)
      fieldsToUpdate.delete('avatar')

      if (fieldsToUpdate.size > 0) {
        const updateData = {}
        fieldsToUpdate.forEach(field => {
          updateData[field] = formData[field]
        })
        await profileMutation.mutateAsync(updateData)
      }

      setChangedFields(new Set())
    } catch (error) {
      console.error('Failed to save:', error)
    }
  }

  const isSaving = profileMutation.isPending || avatarMutation.isPending
  const hasChanges = changedFields.size > 0

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-1">Manage your account preferences and configuration</p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal information and profile settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {ProfileLoading ? (
                  <div className="text-gray-500">Loading profile...</div>
                ) : isError ? (
                  <div className="text-red-500">Failed to load profile</div>
                ) : profileData ? (
                  <>
                    <div className="flex items-center gap-6">
                      <Avatar className="w-20 h-20">
                        <AvatarImage src={avatarPreview || "/placeholder.svg?height=80&width=80"} />
                        <AvatarFallback className="text-lg">
                          {formData.fullname?.slice(0, 2).toUpperCase() || 'AE'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-2">
                        <input
                          type="file"
                          id="avatar-upload"
                          accept="image/jpeg,image/png,image/gif"
                          className="hidden"
                          onChange={handleAvatarChange}
                        />
                        <Button
                          variant="outline"
                          className="gap-2 bg-transparent"
                          onClick={() => document.getElementById('avatar-upload')?.click()}
                        >
                          <Upload className="w-4 h-4" />
                          Upload Photo
                        </Button>
                        <p className="text-sm text-gray-600">JPG, PNG or GIF. Max size 2MB.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Full Name</Label>
                        <Input
                          id="firstName"
                          value={formData.fullname}
                          onChange={(e) => handleInputChange('fullname', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dob">Date of Birth</Label>
                        <Input
                          id="dob"
                          type="date"
                          value={formData.dob}
                          onChange={(e) => handleInputChange('dob', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        placeholder="Tell us about yourself..."
                        value={formData.bio}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select
                        value={formData.timezone}
                        onValueChange={(value) => handleInputChange('timezone', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pst">Pacific Standard Time (PST)</SelectItem>
                          <SelectItem value="est">Eastern Standard Time (EST)</SelectItem>
                          <SelectItem value="cst">Central Standard Time (CST)</SelectItem>
                          <SelectItem value="mst">Mountain Standard Time (MST)</SelectItem>
                          <SelectItem value="utc">Coordinated Universal Time (UTC)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex justify-end gap-3">
                      {hasChanges && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setFormData({
                              fullname: profileData.fullname || '',
                              email: profileData.email || '',
                              dob: profileData.dob || '',
                              bio: profileData.bio || '',
                              timezone: profileData.timezone || 'pst'
                            })
                            setAvatarPreview(profileData.avatar || null)
                            setAvatarFile(null)
                            setChangedFields(new Set())
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                      <Button
                        className="bg-purple-600 hover:bg-purple-700 gap-2"
                        onClick={handleSave}
                        disabled={!hasChanges || isSaving}
                      >
                        <Save className="w-4 h-4" />
                        {isSaving ? 'Saving.. .' : 'Save Changes'}
                      </Button>
                    </div>
                  </>
                ) : (
                  <h1>There is no profile data</h1>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="notifications" className="space-y-6">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose how and when you want to be notified</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {notificationLoading ? (
                  <div className="text-gray-500">Loading notification settings...</div>
                ) : notificationError ? (
                  <div className="text-red-500">Failed to load notification settings</div>
                ) : notificationData ? (
                  <>
                    {/* Notification Channels */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-900">Notification Channels</h3>
                      <div className="space-y-3">
                        {notificationConfig.channels.map((item) => {
                          const Icon = item.icon
                          const isChanged = changedFields.has(item.key)
                          return (
                            <div
                              key={item.key}
                              className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 ${isChanged ? 'border-purple-300 bg-purple-50' : 'border-gray-200'
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                  <Icon className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                  <div className="font-medium text-sm text-gray-900">{item.label}</div>
                                  <div className="text-xs text-gray-500">{item.description}</div>
                                </div>
                              </div>
                              <Switch
                                checked={localSettings[item.key] ?? false}
                                onCheckedChange={() => handleToggle(item.key)}
                              />
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-200" />

                    {/* Alert Types */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-900">Alert Types</h3>
                      <div className="space-y-3">
                        {notificationConfig.alerts.map((item) => {
                          const Icon = item.icon
                          const isChanged = changedFields.has(item.key)
                          return (
                            <div
                              key={item.key}
                              className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 ${isChanged ? 'border-purple-300 bg-purple-50' : 'border-gray-200'
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${item.key === 'workflowSuccess' ? 'bg-green-100' :
                                  item.key === 'workflowFailure' ? 'bg-red-100' :
                                    item.key === 'securityAlerts' ? 'bg-orange-100' :
                                      'bg-blue-100'
                                  }`}>
                                  <Icon className={`w-5 h-5 ${item.key === 'workflowSuccess' ? 'text-green-600' :
                                    item.key === 'workflowFailure' ? 'text-red-600' :
                                      item.key === 'securityAlerts' ? 'text-orange-600' :
                                        'text-blue-600'
                                    }`} />
                                </div>
                                <div>
                                  <div className="font-medium text-sm text-gray-900">{item.label}</div>
                                  <div className="text-xs text-gray-500">{item.description}</div>
                                </div>
                              </div>
                              <Switch
                                checked={localSettings[item.key] ?? false}
                                onCheckedChange={() => handleToggle(item.key)}
                              />
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Save/Cancel Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                      {hasChanges && (
                        <Button
                          variant="outline"
                          onClick={handleCancel}
                          disabled={isSaving}
                        >
                          Cancel
                        </Button>
                      )}
                      <Button
                        className="bg-purple-600 hover:bg-purple-700 gap-2"
                        onClick={handleSaveNotification}
                        disabled={!hasChanges || isSaving}
                      >
                        <Save className="w-4 h-4" />
                        {isSaving ? 'Saving.. .' : 'Save Changes'}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-gray-500">No notification settings found</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>          <TabsContent value="security" className="space-y-6">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your account security and authentication</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Password</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter current password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input id="newPassword" type="password" placeholder="Enter new password" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input id="confirmPassword" type="password" placeholder="Confirm new password" />
                    </div>

                    <Button variant="outline" className="gap-2 bg-transparent">
                      <Lock className="w-4 h-4" />
                      Update Password
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Two-Factor Authentication</h3>
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <div className="font-medium">Authenticator App</div>
                      <div className="text-sm text-gray-600">Use an authenticator app for additional security</div>
                    </div>
                    <Badge variant="secondary" className="bg-red-100 text-red-700">
                      Disabled
                    </Badge>
                  </div>
                  <Button variant="outline" className="gap-2 bg-transparent">
                    <Shield className="w-4 h-4" />
                    Enable 2FA
                  </Button>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Active Sessions</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <div className="font-medium">Current Session</div>
                        <div className="text-sm text-gray-600">Chrome on macOS • San Francisco, CA</div>
                        <div className="text-xs text-gray-500">Last active: Now</div>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        Current
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <div className="font-medium">Mobile App</div>
                        <div className="text-sm text-gray-600">iPhone • San Francisco, CA</div>
                        <div className="text-xs text-gray-500">Last active: 2 hours ago</div>
                      </div>
                      <Button variant="outline" size="sm">
                        Revoke
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle>Billing & Subscription</CardTitle>
                <CardDescription>Manage your subscription and billing information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Current Plan</h3>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-lg">Pro Plan</div>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                        Active
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 mb-4">
                      $29/month • Billed monthly • Next billing: Jan 15, 2025
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Change Plan
                      </Button>
                      <Button variant="outline" size="sm">
                        Cancel Subscription
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Payment Method</h3>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <CreditCard className="w-5 h-5 text-gray-400" />
                      <div className="font-medium">•••• •••• •••• 4242</div>
                      <Badge variant="secondary">Default</Badge>
                    </div>
                    <div className="text-sm text-gray-600 mb-4">Expires 12/2027</div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Update Card
                      </Button>
                      <Button variant="outline" size="sm">
                        Add Payment Method
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Billing History</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <div className="font-medium">Dec 15, 2024</div>
                        <div className="text-sm text-gray-600">Pro Plan - Monthly</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">$29.00</span>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <div className="font-medium">Nov 15, 2024</div>
                        <div className="text-sm text-gray-600">Pro Plan - Monthly</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">$29.00</span>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle>Application Preferences</CardTitle>
                <CardDescription>Customize your application experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Appearance</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="theme">Theme</Label>
                      <Select defaultValue="light">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <Select defaultValue="en">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="de">German</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Data & Privacy</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Analytics & Usage Data</div>
                        <div className="text-sm text-gray-600">Help improve our product by sharing usage data</div>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Marketing Communications</div>
                        <div className="text-sm text-gray-600">Receive product updates and marketing emails</div>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Data Export</h3>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Export your data including workflows, logs, and account information.
                    </p>
                    <Button variant="outline" className="gap-2 bg-transparent">
                      <Download className="w-4 h-4" />
                      Export Data
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 text-red-600">Danger Zone</h3>
                  <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                    <div className="space-y-4">
                      <div>
                        <div className="font-medium text-red-900">Delete Account</div>
                        <div className="text-sm text-red-700">
                          Permanently delete your account and all associated data. This action cannot be undone.
                        </div>
                      </div>
                      <Button variant="destructive" className="gap-2">
                        <Trash2 className="w-4 h-4" />
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button className="bg-purple-600 hover:bg-purple-700 gap-2">
                    <Save className="w-4 h-4" />
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
