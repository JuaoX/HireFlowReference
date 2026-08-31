# HireFlow ATS - Completion Plan

## Current Status: ~70% Spec Compliant

---

## 🎯 PRIORITY 1: Critical Missing Features (Core Workflow Gaps)

### 1. Drag-and-Drop Pipeline + Bulk Actions
**Estimated Time:** 30 minutes  
**Impact:** High - Major UX improvement  
**Components:**
- Integrate @dnd-kit/core for drag-drop functionality
- Update PipelineBoard.tsx to support card dragging between stages
- Add bulk selection checkboxes on application cards
- Implement bulk move/reject actions
- Add confirmation dialogs for bulk operations

**Files to Modify:**
- `src/components/pipeline/PipelineBoard.tsx`
- New: `src/components/pipeline/BulkActionsBar.tsx`

---

### 2. Application State Workflows (Reject/Withdraw/Hire)
**Estimated Time:** 20 minutes  
**Impact:** High - Completes application state machine  
**Features:**
- Add "Reject" button with reason dropdown + notes
- Add "Withdraw" button with reason notes
- Add "Hire" button that moves to hired stage
- Auto-send email templates on rejection
- Update application state and track in activities

**Files to Modify:**
- `src/pages/applications/ApplicationDetail.tsx`
- New: `src/components/applications/ApplicationActions.tsx`
- New: `src/components/applications/RejectionDialog.tsx`

---

### 3. Interview Scorecards UI
**Estimated Time:** 25 minutes  
**Impact:** High - Enables interview feedback loop  
**Features:**
- Scorecard form with rating criteria (1-5 stars)
- Recommendation dropdown (Advance/Hold/No Hire)
- Notes textarea
- "Hide other feedback until submit" logic
- Consolidated scorecard view after submission
- Link from interview detail page

**Files to Create:**
- `src/pages/scorecards/ScorecardForm.tsx`
- `src/pages/scorecards/ScorecardsList.tsx`
- `src/components/interviews/ScorecardSection.tsx`

**Files to Modify:**
- `src/pages/interviews/InterviewDetail.tsx`

---

### 4. ICS Calendar File Generation
**Estimated Time:** 20 minutes  
**Impact:** Medium - Spec requirement for scheduling  
**Implementation:**
- Create edge function to generate .ics files
- Generate ICS on interview creation
- Attach to invitation emails
- Include meeting details, location, video link

**Files to Create:**
- `supabase/functions/generate-ics/index.ts`
- `src/utils/icsGenerator.ts` (client-side utility)

**Files to Modify:**
- `src/pages/interviews/InterviewForm.tsx`
- Integration with messaging system

---

### 5. Settings Page + User Management
**Estimated Time:** 30 minutes  
**Impact:** High - Required for admin operations  
**Features:**

**Settings Tabs:**
- Profile (name, email, avatar, timezone)
- Organization (name, slug, branding)
- Team Members (list, invite, roles)
- Security (password change)

**User Management:**
- List all users in org
- Invite new users (send email)
- Assign roles (basic/job_admin/site_admin)
- Activate/deactivate users
- View user activity

**Files to Create:**
- `src/pages/Settings.tsx`
- `src/components/settings/ProfileSettings.tsx`
- `src/components/settings/OrganizationSettings.tsx`
- `src/components/settings/TeamManagement.tsx`
- `src/components/settings/UserInviteDialog.tsx`

---

### 6. Activity Timeline Display
**Estimated Time:** 15 minutes  
**Impact:** Medium - Show audit logs  
**Features:**
- Timeline component showing all activities
- Filter by entity type (application/job/offer/candidate)
- Show actor, action, timestamp
- Display before/after changes (diff view)
- Add to application detail, candidate detail pages

**Files to Create:**
- `src/components/shared/ActivityTimeline.tsx`

**Files to Modify:**
- `src/pages/applications/ApplicationDetail.tsx`
- `src/pages/candidates/CandidateDetail.tsx`

---

## 🔧 PRIORITY 2: Important Enhancements

### 7. Job ACL Management UI
**Estimated Time:** 25 minutes  
**Impact:** Medium - Per-job permission assignment  
**Features:**
- On Job Detail page, "Team" tab
- List current job team members
- Add user to job with permission checkboxes:
  - Can view
  - Can move pipeline
  - Can message candidates
  - Can view offers
- Remove users from job
- Bulk assign multiple users

**Files to Create:**
- `src/components/jobs/JobTeamManager.tsx`

**Files to Modify:**
- `src/pages/jobs/JobDetail.tsx`

---

### 8. Resume/File Upload
**Estimated Time:** 20 minutes  
**Impact:** High - Missing from candidate/application forms  
**Features:**
- File upload field on CandidateForm
- File upload on careers application form
- Store in Supabase storage (resumes bucket)
- Link to attachments table
- Display resume download link on candidate detail
- Support PDF, DOC, DOCX (max 10MB)

**Files to Modify:**
- `src/pages/candidates/CandidateForm.tsx`
- `src/pages/careers/CareersApplicationForm.tsx`
- `src/pages/candidates/CandidateDetail.tsx`

**Migration Required:**
- Add resumes bucket policies (already done)

---

### 9. Advanced Search & Filtering
**Estimated Time:** 20 minutes  
**Impact:** Medium - Improve usability at scale  
**Features:**
- Search bar for candidates (name, email)
- Filter applications by stage, status, date range
- Filter jobs by department, status, location
- Sort options (date, name, status)
- Clear filters button

**Files to Modify:**
- `src/pages/candidates/CandidatesList.tsx`
- `src/pages/applications/ApplicationsList.tsx`
- `src/pages/jobs/JobsList.tsx`

**Files to Create:**
- `src/components/shared/SearchBar.tsx`
- `src/components/shared/FilterPanel.tsx`

---

### 10. Confirmation Dialogs
**Estimated Time:** 15 minutes  
**Impact:** Medium - Prevent accidental deletions  
**Features:**
- Confirm before deleting job
- Confirm before deleting candidate
- Confirm before closing job
- Confirm before rejecting application
- Confirm before bulk actions

**Files to Create:**
- `src/components/shared/ConfirmDialog.tsx`

**Files to Modify:**
- All delete/destructive action handlers

---

## 🎨 PRIORITY 3: Polish & Nice-to-Have

### 11. Custom Application Questions
**Estimated Time:** 30 minutes  
**Impact:** Low - Enhancement  
**Features:**
- On Job Form, add "Application Questions" section
- Add custom questions (text/textarea/select)
- Store in job settings_json or new table
- Render dynamically on careers application form
- Display answers on application detail

**Migration Required:**
- Possibly new table: `job_questions` or use `jobs.settings_json`

---

### 12. Email Notifications System
**Estimated Time:** 35 minutes  
**Impact:** Medium - Automated workflows  
**Features:**
- Auto-send emails on:
  - Interview scheduled → candidate + panel
  - Application rejected → candidate
  - Offer sent → candidate
  - Interview reminder (1 day before)
- Background job/cron for scheduled emails
- Email preferences per user

**Files to Create:**
- `supabase/functions/send-scheduled-emails/index.ts`
- Cron setup in supabase config

---

### 13. Resume Parsing (AI)
**Estimated Time:** 40 minutes  
**Impact:** Low - Convenience feature  
**Features:**
- Use Lovable AI to parse resume text
- Extract: name, email, phone, skills, experience
- Auto-populate candidate form fields
- Edge function for parsing

**Files to Create:**
- `supabase/functions/parse-resume/index.ts`

**Dependencies:**
- Enable Lovable AI gateway
- Document parsing for PDF/DOC

---

### 14. Permission Policies (Auto-apply Presets)
**Estimated Time:** 35 minutes  
**Impact:** Low - Admin convenience  
**Features:**
- Create "policy templates" (e.g., Coordinator, Agency, Interviewer)
- Define default role + job ACL settings
- Auto-apply to new users based on selection
- Settings page to manage policies

**Migration Required:**
- New table: `permission_policies`

**Files to Create:**
- `src/components/settings/PermissionPolicies.tsx`

---

### 15. Notifications In-App
**Estimated Time:** 30 minutes  
**Impact:** Low - User engagement  
**Features:**
- Bell icon in header with badge
- Dropdown showing recent notifications
- Types: interview reminder, new application, approval request
- Mark as read/unread

**Files to Create:**
- `src/components/layouts/NotificationCenter.tsx`
- New table: `notifications`

---

## 📊 Estimated Total Time

**Priority 1 (Critical):** ~2.5 hours  
**Priority 2 (Important):** ~2 hours  
**Priority 3 (Polish):** ~3 hours  

**Total:** ~7.5 hours to reach 95%+ spec compliance

---

## 🚀 Recommended Execution Order

### Sprint 1: Core Workflows (Day 1)
1. Drag-drop pipeline
2. Reject/Withdraw/Hire workflows
3. Scorecards UI
4. Settings + User Management

### Sprint 2: Communication (Day 2)
5. ICS generation
6. Resume upload
7. Activity timeline
8. Email notifications

### Sprint 3: Polish (Day 3)
9. Job ACL UI
10. Search & filtering
11. Confirmation dialogs
12. Custom questions

### Sprint 4: Advanced (Optional)
13. Resume parsing
14. Permission policies
15. In-app notifications

---

## ✅ Success Criteria

**Ready for Production When:**
- ✅ All Priority 1 features complete
- ✅ User can manage full hiring lifecycle without manual database edits
- ✅ Site admin can manage team and permissions
- ✅ Interview feedback loop closed with scorecards
- ✅ Calendar integration via ICS files
- ✅ No broken links (Settings page exists)
- ✅ Core workflows have confirmation dialogs

**Spec Compliance:** 95%+  
**Production Ready:** Yes  
**Enterprise Ready:** Add Priority 2 + 3

---

## 📝 Notes

- All database tables already exist (100% coverage)
- RLS policies are complete and secure
- Lovable Cloud integration ready for messaging
- No external API keys required for core features
- Can deploy immediately after Priority 1 completion

**Current Progress:** 70% → **Target:** 95%+

---

*Last Updated: 2025-10-06*
*Ready to execute starting with drag-drop pipeline implementation.*
