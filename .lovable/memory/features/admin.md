Admin account, access control, and user approval system

## Admin Account
- Email: admin@kingsncompany.com
- Role: admin (in user_roles table)

## User Approval System
- profiles.status: pending | active | rejected | suspended (default: pending)
- New users land on /pending page until approved
- ProtectedRoute checks status === "active" before granting dashboard access
- Admins approve/reject from Admin Panel > Pending Approvals tab

## Admin Panel Tabs
- Analytics, Pending Approvals, User Management, Moderation
- User Management: search, filter by status, make admin, suspend, delete
- Moderation: delete posts/comments, ban users

## RLS
- Admins can view/update/delete all profiles
- Admins can manage user_roles
- Admins can delete posts and comments
