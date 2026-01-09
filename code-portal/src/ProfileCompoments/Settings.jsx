import { useState, useEffect, useRef } from "react"

import {
  Save, Shield, Lock, Eye, EyeOff, Upload,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { UAParser } from "ua-parser-js";
import toast from "react-hot-toast"


export default function SettingsPage() {
  const [showPassword, setShowPassword] = useState(false)
  const parser = new UAParser();

  const result = parser.getResult();

  const browserMeta = {
    browser: `${result.browser.name} ${result.browser.version}`,
    os: `${result.os.name} ${result.os.version}`,
    device: result.device.type || "desktop",
  };
  console.log("browser data:", browserMeta)

  const currentPasswordRef = useRef(null);
  const newPasswordRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  const fetchUserBasics = async () => {
    const response = await axios.get(`http://localhost:8000/profile/usrProfile`, {
      withCredentials: true
    })
    return response.data.data
  }

  const handlePasswordChange = async () => {
    const current = currentPasswordRef.current.value;
    const newPass = newPasswordRef.current.value;
    const confirm = confirmPasswordRef.current.value;

    if (!current || !newPass || !confirm) {
      console.log("All fields are required!");
      toast.error("All fields are required!")
      return;
    }

    if (newPass.length < 6) {
      console.log("New password must be at least 6 characters");
      toast.error("New password must be at least 6 characters")
      return;
    }

    if (newPass !== confirm) {
      console.log("Passwords do not match!");
      toast.error("Passwords do not match!")
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:8000/profile/changePassword",
        { currentPassword: current, newPassword: newPass },
        { withCredentials: true }
      );
      console.log("Password change response:", response.data);
      toast.success("password changed successfully")
    } catch (error) {
      console.error("Error changing password:", error.response?.data || error.message);
      toast.error("invalid credentials")
    }
  };

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

  const queryClient = useQueryClient()


  const { data: profileData, isLoading: ProfileLoading, isError } = useQuery({
    queryKey: ["fetchUserBasics"],
    queryFn: fetchUserBasics
  })

  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    dob: '',
    bio: '',
    timezone: 'pst'
  })

  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)

  const [changedFields, setChangedFields] = useState(new Set())

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

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))

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
    <div className="space-y-8 ">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-slate-400 mt-1">Manage your account preferences and configuration</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 gap-2 md:grid-cols-5 h-auto p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <TabsTrigger value="profile" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 dark:text-slate-300 dark:data-[state=active]:text-white">Profile</TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 dark:text-slate-300 dark:data-[state=active]:text-white">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-slate-700 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Profile Information</CardTitle>
              <CardDescription className="text-gray-500 dark:text-slate-400">Update your personal information and profile settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {ProfileLoading ? (
                <div className="text-gray-500 dark:text-slate-400">Loading profile...</div>
              ) : isError ? (
                <div className="text-red-500 dark:text-red-400">Failed to load profile</div>
              ) : profileData ? (
                <>
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <Avatar className="w-20 h-20 border-2 border-gray-100 dark:border-gray-700">
                      <AvatarImage src={avatarPreview || "/placeholder.svg?height=80&width=80"} />
                      <AvatarFallback className="text-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white">
                        {formData.fullname?.slice(0, 2).toUpperCase() || 'AE'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2 text-center md:text-left">
                      <input
                        type="file"
                        id="avatar-upload"
                        accept="image/jpeg,image/png,image/gif"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                      <Button
                        variant="outline"
                        className="gap-2 bg-transparent border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                        onClick={() => document.getElementById('avatar-upload')?.click()}
                      >
                        <Upload className="w-4 h-4" />
                        Upload Photo
                      </Button>
                      <p className="text-sm text-gray-600 dark:text-slate-400">JPG, PNG or GIF. Max size 2MB.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-gray-700 dark:text-slate-300">Full Name</Label>
                      <Input
                        id="firstName"
                        value={formData.fullname}
                        onChange={(e) => handleInputChange('fullname', e.target.value)}
                        className="h-11 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:border-blue-500 focus:ring-0 rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dob" className="text-gray-700 dark:text-slate-300">Date of Birth</Label>
                      <Input
                        id="dob"
                        type="date"
                        value={formData.dob}
                        onChange={(e) => handleInputChange('dob', e.target.value)}
                        className="h-11 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:border-blue-500 focus:ring-0 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700 dark:text-slate-300">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="h-11 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:border-blue-500 focus:ring-0 rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-gray-700 dark:text-slate-300">Bio</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us about yourself..."
                      value={formData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      rows={3}
                      className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:border-blue-500 focus:ring-0 rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone" className="text-gray-700 dark:text-slate-300">Timezone</Label>
                    <Select
                      value={formData.timezone}
                      onValueChange={(value) => handleInputChange('timezone', value)}
                    >
                      <SelectTrigger className="h-11 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:border-blue-500 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <SelectItem value="pst" className="dark:text-white dark:focus:bg-gray-700">Pacific Standard Time (PST)</SelectItem>
                        <SelectItem value="est" className="dark:text-white dark:focus:bg-gray-700">Eastern Standard Time (EST)</SelectItem>
                        <SelectItem value="cst" className="dark:text-white dark:focus:bg-gray-700">Central Standard Time (CST)</SelectItem>
                        <SelectItem value="mst" className="dark:text-white dark:focus:bg-gray-700">Mountain Standard Time (MST)</SelectItem>
                        <SelectItem value="utc" className="dark:text-white dark:focus:bg-gray-700">Coordinated Universal Time (UTC)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col-reverse md:flex-row justify-end gap-3 mt-6">
                    {hasChanges && (
                      <Button
                        variant="outline"
                        className="border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-800"
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
                      className="bg-blue-500 hover:bg-blue-600 text-white gap-2"
                      onClick={handleSave}
                      disabled={!hasChanges || isSaving}
                    >
                      <Save className="w-4 h-4" />
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </>
              ) : (
                <h1 className="text-gray-900 dark:text-white">There is no profile data</h1>
              )}
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="security" className="space-y-6">
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-slate-700 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Security Settings</CardTitle>
              <CardDescription className="text-gray-500 dark:text-slate-400">Manage your account security and authentication</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 dark:text-white">Password</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="text-gray-700 dark:text-slate-300">Current Password</Label>
                    <div className="relative">
                      <Input
                        ref={currentPasswordRef}
                        id="currentPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter current password"
                        className="h-11 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:border-blue-500 focus:ring-0 rounded-lg pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-white"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-gray-700 dark:text-slate-300">New Password</Label>
                    <Input
                      id="newPassword"
                      ref={newPasswordRef}
                      type="password"
                      placeholder="Enter new password"
                      className="h-11 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:border-blue-500 focus:ring-0 rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-gray-700 dark:text-slate-300">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      ref={confirmPasswordRef}
                      type="password"
                      placeholder="Confirm new password"
                      className="h-11 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:border-blue-500 focus:ring-0 rounded-lg"
                    />
                  </div>

                  <Button
                    variant="outline"
                    className="gap-2 bg-transparent border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => handlePasswordChange()}
                  >
                    <Lock className="w-4 h-4" />
                    Update Password
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</h3>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div className="mb-2 sm:mb-0">
                    <div className="font-medium text-gray-900 dark:text-white">Authenticator App</div>
                    <div className="text-sm text-gray-600 dark:text-slate-400">Use an authenticator app for additional security</div>
                  </div>
                  <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-900/50">
                    Disabled
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  className="gap-2 bg-transparent border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => toast.error("Currently not available")}
                >
                  <Shield className="w-4 h-4" />
                  Enable 2FA
                </Button>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 dark:text-white">Active Sessions</h3>
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <div className="mb-2 sm:mb-0">
                      <div className="font-medium text-gray-900 dark:text-white">Current Session</div>
                      <div className="text-sm text-gray-600 dark:text-slate-400">{browserMeta?.browser}</div>
                      <div className="text-xs text-gray-500 dark:text-slate-500">Last active: Now</div>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-900/50">
                      Current
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  )
}
