import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { 
  banUser, 
  unbanUser, 
  moderateSkill, 
  createPlatformMessage,
  checkAdminStatus 
} from '@/lib/admin';
import { 
  Shield, 
  Users, 
  Wrench, 
  MessageSquare, 
  FileText, 
  Ban, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Download,
  Loader2,
  Eye,
  Edit,
  Trash2,
  Plus,
  Send,
  Clock,
  Star
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AdminStats {
  totalUsers: number;
  totalSwaps: number;
  pendingSwaps: number;
  bannedUsers: number;
  pendingSkills: number;
  activeMessages: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  is_banned: boolean;
  ban_reason?: string;
  created_at: string;
  swap_count: number;
}

interface Skill {
  id: string;
  name: string;
  category: string;
  is_approved: boolean;
  rejection_reason?: string;
  created_at: string;
}

interface SwapRequest {
  id: string;
  requester: { name: string };
  recipient: { name: string };
  offered_skill: { name: string };
  wanted_skill: { name: string };
  status: string;
  created_at: string;
}

interface PlatformMessage {
  id: string;
  title: string;
  message: string;
  message_type: string;
  is_active: boolean;
  created_at: string;
}

export default function Admin() {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalSwaps: 0,
    pendingSwaps: 0,
    bannedUsers: 0,
    pendingSkills: 0,
    activeMessages: 0
  });
  const [users, setUsers] = useState<User[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [swaps, setSwaps] = useState<SwapRequest[]>([]);
  const [messages, setMessages] = useState<PlatformMessage[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Form states
  const [newMessage, setNewMessage] = useState({ title: '', message: '', message_type: 'info' });
  const [banReason, setBanReason] = useState('');
  const [skillRejectionReason, setSkillRejectionReason] = useState('');

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    }
  }, [isAdmin]);

  const checkAdminStatus = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single();

    if (!error && data?.is_admin) {
      setIsAdmin(true);
    }
  };

  const fetchAdminData = async () => {
    setLoadingData(true);
    await Promise.all([
      fetchStats(),
      fetchUsers(),
      fetchSkills(),
      fetchSwaps(),
      fetchMessages()
    ]);
    setLoadingData(false);
  };

  const fetchStats = async () => {
    const [
      { count: totalUsers },
      { count: totalSwaps },
      { count: pendingSwaps },
      { count: bannedUsers },
      { count: pendingSkills },
      { count: activeMessages }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('swap_requests').select('*', { count: 'exact', head: true }),
      supabase.from('swap_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_banned', true),
      supabase.from('skills').select('*', { count: 'exact', head: true }).eq('is_approved', false),
      supabase.from('platform_messages').select('*', { count: 'exact', head: true }).eq('is_active', true)
    ]);

    setStats({
      totalUsers: totalUsers || 0,
      totalSwaps: totalSwaps || 0,
      pendingSwaps: pendingSwaps || 0,
      bannedUsers: bannedUsers || 0,
      pendingSkills: pendingSkills || 0,
      activeMessages: activeMessages || 0
    });
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, name, is_banned, ban_reason, created_at')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUsers(data.map(user => ({
        id: user.user_id,
        name: user.name,
        email: '', // Email not available here
        is_banned: user.is_banned || false,
        ban_reason: user.ban_reason,
        created_at: user.created_at,
        swap_count: 0 // Not available in this query
      })));
    }
  };

  const fetchSkills = async () => {
    const { data, error } = await supabase
      .from('skills')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSkills(data);
    }
  };

  const fetchSwaps = async () => {
    // 1. Fetch swap requests
    const { data: swapRequests, error: swapError } = await supabase
      .from('swap_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    // 2. Fetch all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, name');

    // 3. Fetch all skills
    const { data: skills, error: skillsError } = await supabase
      .from('skills')
      .select('id, name');

    // 4. Join profiles and skills to swap requests
    if (!swapError && !profilesError && !skillsError && swapRequests && profiles && skills) {
      const swapsWithDetails = swapRequests.map(req => ({
        ...req,
        requester: { name: profiles.find(p => p.user_id === req.requester_id)?.name || 'Unknown User' },
        recipient: { name: profiles.find(p => p.user_id === req.recipient_id)?.name || 'Unknown User' },
        offered_skill: { name: skills.find(s => s.id === req.offered_skill_id)?.name || 'Unknown Skill' },
        wanted_skill: { name: skills.find(s => s.id === req.wanted_skill_id)?.name || 'Unknown Skill' }
      }));
      setSwaps(swapsWithDetails);
    }
  };

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('platform_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMessages(data);
    }
  };

  const handleBanUser = async (userId: string, ban: boolean) => {
    let success = false;
    
    if (ban) {
      success = await banUser(userId, banReason);
    } else {
      success = await unbanUser(userId);
    }

    if (success) {
      toast({
        title: ban ? "User banned" : "User unbanned",
        description: ban ? "User has been banned from the platform." : "User has been unbanned.",
      });
      setBanReason('');
      fetchUsers();
      fetchStats();
    } else {
      toast({
        title: "Error",
        description: "Failed to update user status.",
        variant: "destructive",
      });
    }
  };

  const handleModerateSkill = async (skillId: string, approved: boolean) => {
    const success = await moderateSkill(skillId, approved, approved ? undefined : skillRejectionReason);

    if (success) {
      toast({
        title: approved ? "Skill approved" : "Skill rejected",
        description: approved ? "Skill has been approved." : "Skill has been rejected.",
      });
      setSkillRejectionReason('');
      fetchSkills();
      fetchStats();
    } else {
      toast({
        title: "Error",
        description: "Failed to moderate skill.",
        variant: "destructive",
      });
    }
  };

  const handleCreateMessage = async () => {
    if (!newMessage.title || !newMessage.message || !user?.id) {
      toast({
        title: "Missing information",
        description: "Please fill in both title and message.",
        variant: "destructive",
      });
      return;
    }

    const success = await createPlatformMessage(
      newMessage.title,
      newMessage.message,
      newMessage.message_type,
      user.id
    );

    if (success) {
      toast({
        title: "Message created",
        description: "Platform message has been created successfully.",
      });
      setNewMessage({ title: '', message: '', message_type: 'info' });
      fetchMessages();
      fetchStats();
    } else {
      toast({
        title: "Error",
        description: "Failed to create message.",
        variant: "destructive",
      });
    }
  };

  const handleToggleMessage = async (messageId: string, isActive: boolean) => {
    const { error } = await supabase
      .from('platform_messages')
      .update({ is_active: !isActive })
      .eq('id', messageId);

    if (!error) {
      toast({
        title: isActive ? "Message deactivated" : "Message activated",
        description: `Message has been ${isActive ? 'deactivated' : 'activated'}.`,
      });
      fetchMessages();
      fetchStats();
    }
  };

  const downloadReport = async (type: 'users' | 'swaps' | 'skills') => {
    let data;
    let filename;

    switch (type) {
      case 'users':
        const { data: usersData } = await supabase
          .from('profiles')
          .select('*');
        data = usersData;
        filename = 'users-report.csv';
        break;
      case 'swaps':
        const { data: swapsData } = await supabase
          .from('swap_requests')
          .select('*');
        data = swapsData;
        filename = 'swaps-report.csv';
        break;
      case 'skills':
        const { data: skillsData } = await supabase
          .from('skills')
          .select('*');
        data = skillsData;
        filename = 'skills-report.csv';
        break;
    }

    if (data) {
      const csvContent = convertToCSV(data);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => headers.map(header => JSON.stringify(row[header])).join(','))
    ];
    return csvRows.join('\n');
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle pb-20">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="swaps">Swaps</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Swaps</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalSwaps}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Swaps</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pendingSwaps}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Banned Users</CardTitle>
                  <Ban className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.bannedUsers}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Skills</CardTitle>
                  <Wrench className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pendingSkills}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Messages</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeMessages}</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{user.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {user.swap_count} swaps • Joined {new Date(user.created_at).toLocaleDateString()}
                          </p>
                          {user.is_banned && (
                            <p className="text-sm text-red-600">Banned: {user.ban_reason}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {user.is_banned ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Unban
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Unban User</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to unban this user? They will be able to use the platform again.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleBanUser(user.id, false)}>
                                  Unban User
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Ban className="h-4 w-4 mr-2" />
                                Ban
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Ban User</DialogTitle>
                                <DialogDescription>
                                  Provide a reason for banning this user.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="ban-reason">Reason</Label>
                                  <Textarea
                                    id="ban-reason"
                                    value={banReason}
                                    onChange={(e) => setBanReason(e.target.value)}
                                    placeholder="Enter ban reason..."
                                  />
                                </div>
                                <Button onClick={() => handleBanUser(user.id, true)}>
                                  Ban User
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="skills" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Skill Moderation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {skills.map((skill) => (
                    <div key={skill.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{skill.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Category: {skill.category} • {new Date(skill.created_at).toLocaleDateString()}
                        </p>
                        {!skill.is_approved && skill.rejection_reason && (
                          <p className="text-sm text-red-600">Rejected: {skill.rejection_reason}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {skill.is_approved ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Reject Skill</DialogTitle>
                                <DialogDescription>
                                  Provide a reason for rejecting this skill.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="rejection-reason">Reason</Label>
                                  <Textarea
                                    id="rejection-reason"
                                    value={skillRejectionReason}
                                    onChange={(e) => setSkillRejectionReason(e.target.value)}
                                    placeholder="Enter rejection reason..."
                                  />
                                </div>
                                <Button onClick={() => handleModerateSkill(skill.id, false)}>
                                  Reject Skill
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Approve Skill</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to approve this skill?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleModerateSkill(skill.id, true)}>
                                  Approve Skill
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="swaps" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Swap Monitoring</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {swaps.map((swap) => (
                    <div key={swap.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={swap.status === 'pending' ? 'secondary' : swap.status === 'accepted' ? 'default' : 'destructive'}>
                            {swap.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(swap.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p>
                          <span className="font-medium">{swap.requester.name}</span> offers{' '}
                          <span className="font-medium">{swap.offered_skill.name}</span> for{' '}
                          <span className="font-medium">{swap.wanted_skill.name}</span> from{' '}
                          <span className="font-medium">{swap.recipient.name}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Platform Messages</CardTitle>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        New Message
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Platform Message</DialogTitle>
                        <DialogDescription>
                          Send a message to all users on the platform.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="message-title">Title</Label>
                          <Input
                            id="message-title"
                            value={newMessage.title}
                            onChange={(e) => setNewMessage({ ...newMessage, title: e.target.value })}
                            placeholder="Enter message title..."
                          />
                        </div>
                        <div>
                          <Label htmlFor="message-type">Type</Label>
                          <Select value={newMessage.message_type} onValueChange={(value) => setNewMessage({ ...newMessage, message_type: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="info">Info</SelectItem>
                              <SelectItem value="warning">Warning</SelectItem>
                              <SelectItem value="alert">Alert</SelectItem>
                              <SelectItem value="update">Update</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="message-content">Message</Label>
                          <Textarea
                            id="message-content"
                            value={newMessage.message}
                            onChange={(e) => setNewMessage({ ...newMessage, message: e.target.value })}
                            placeholder="Enter message content..."
                            rows={4}
                          />
                        </div>
                        <Button onClick={handleCreateMessage}>
                          <Send className="h-4 w-4 mr-2" />
                          Send Message
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={message.message_type === 'alert' ? 'destructive' : message.message_type === 'warning' ? 'secondary' : 'default'}>
                            {message.message_type}
                          </Badge>
                          <span className="font-medium">{message.title}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant={message.is_active ? 'outline' : 'default'}
                            size="sm"
                            onClick={() => handleToggleMessage(message.id, message.is_active)}
                          >
                            {message.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{message.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Created: {new Date(message.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Reports & Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">User Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Download comprehensive user activity report including registration dates, swap counts, and ban status.
                      </p>
                      <Button onClick={() => downloadReport('users')} className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Download Users Report
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Swap Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Get detailed swap request data including success rates, popular skills, and user interactions.
                      </p>
                      <Button onClick={() => downloadReport('swaps')} className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Download Swaps Report
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Skill Analytics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Export skill data including categories, approval rates, and popularity metrics.
                      </p>
                      <Button onClick={() => downloadReport('skills')} className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Download Skills Report
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Navigation />
    </div>
  );
} 