import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Bell,
  Shield,
  Phone,
  Volume2,
  Mic,
  Save,
} from 'lucide-react';

export const SettingsSection = () => {
  const [notifications, setNotifications] = useState({
    callAlerts: true,
    emailUpdates: false,
    systemMaintenance: true,
    weeklyReports: false,
  });

  const [audioSettings, setAudioSettings] = useState({
    microphoneLevel: 75,
    speakerLevel: 80,
    echoCancellation: true,
    noiseSuppression: true,
  });

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleAudioChange = (key: string, value: number | boolean) => {
    setAudioSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-blue-900">Settings</h2>
          <p className="text-blue-600">
            Manage your account and system preferences
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <Card className="shadow-md border border-blue-100 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-800">
              <User className="h-5 w-5 mr-2 text-blue-600" />
              Profile Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" defaultValue="John" />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" defaultValue="Doe" />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                defaultValue="john.doe@auralis.com"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" defaultValue="+1-555-0123" />
            </div>
            <div>
              <Label htmlFor="department">Department</Label>
              <select
                id="department"
                className="w-full p-2 border border-blue-200 rounded-md"
              >
                <option value="sales">Sales</option>
                <option value="support">Support</option>
                <option value="management">Management</option>
                <option value="technical">Technical</option>
              </select>
            </div>
            <Separator />
            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                placeholder="Enter current password"
              />
            </div>
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="shadow-md border border-blue-100 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-800">
              <Bell className="h-5 w-5 mr-2 text-blue-600" />
              Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                key: 'callAlerts',
                label: 'Call Alerts',
                desc: 'Get notified of incoming calls',
              },
              {
                key: 'emailUpdates',
                label: 'Email Updates',
                desc: 'Receive daily summary emails',
              },
              {
                key: 'systemMaintenance',
                label: 'System Maintenance',
                desc: 'Alerts for scheduled maintenance',
              },
              {
                key: 'weeklyReports',
                label: 'Weekly Reports',
                desc: 'Performance summaries',
              },
            ].map((item, idx) => (
              <div key={item.key}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-blue-600">{item.desc}</p>
                  </div>
                  <Switch
                    checked={notifications[item.key as keyof typeof notifications]}
                    onCheckedChange={(value) =>
                      handleNotificationChange(item.key, value)
                    }
                  />
                </div>
                {idx < 3 && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Audio Settings */}
        <Card className="shadow-md border border-blue-100 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-800">
              <Phone className="h-5 w-5 mr-2 text-blue-600" />
              Audio Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Mic className="h-4 w-4 mr-2 text-blue-600" />
                  <Label>Microphone Level</Label>
                </div>
                <span className="text-sm text-blue-600">
                  {audioSettings.microphoneLevel}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={audioSettings.microphoneLevel}
                onChange={(e) =>
                  handleAudioChange('microphoneLevel', parseInt(e.target.value))
                }
                className="w-full accent-blue-600"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Volume2 className="h-4 w-4 mr-2 text-blue-600" />
                  <Label>Speaker Level</Label>
                </div>
                <span className="text-sm text-blue-600">
                  {audioSettings.speakerLevel}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={audioSettings.speakerLevel}
                onChange={(e) =>
                  handleAudioChange('speakerLevel', parseInt(e.target.value))
                }
                className="w-full accent-blue-600"
              />
            </div>

            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Echo Cancellation</p>
                <p className="text-sm text-blue-600">Reduce audio echo</p>
              </div>
              <Switch
                checked={audioSettings.echoCancellation}
                onCheckedChange={(value) =>
                  handleAudioChange('echoCancellation', value)
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Noise Suppression</p>
                <p className="text-sm text-blue-600">Filter background noise</p>
              </div>
              <Switch
                checked={audioSettings.noiseSuppression}
                onCheckedChange={(value) =>
                  handleAudioChange('noiseSuppression', value)
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="shadow-md border border-blue-100 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-800">
              <Shield className="h-5 w-5 mr-2 text-blue-600" />
              Security Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-blue-600">
                  Add extra security to your account
                </p>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white" size="sm">
                Enable
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Session Timeout</p>
                <p className="text-sm text-blue-600">
                  Auto-logout after inactivity
                </p>
              </div>
              <select className="p-2 border border-blue-200 rounded-md">
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="120">2 hours</option>
                <option value="240">4 hours</option>
              </select>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Login History</p>
                <p className="text-sm text-blue-600">
                  View recent login attempts
                </p>
              </div>
              <Button variant="outline" size="sm" className="border-blue-300 text-blue-700">
                View History
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">API Access</p>
                <p className="text-sm text-blue-600">
                  Manage API keys and permissions
                </p>
              </div>
              <Button variant="outline" size="sm" className="border-blue-300 text-blue-700">
                Manage Keys
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
