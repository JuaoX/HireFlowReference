// Local in-memory demo database (no backend).
// All data lives in the browser session only.

export type Row = Record<string, any>;

const uid = (prefix: string, n: number) =>
  `${prefix.padEnd(8, "0").slice(0, 8)}-0000-4000-8000-${String(n).padStart(12, "0")}`;

const now = Date.now();
const days = (n: number) => new Date(now + n * 86400000).toISOString();

export const CURRENT_USER_ID = uid("user0001", 1);
export const CURRENT_ORG_ID = uid("org00001", 1);

const stageDefs: Array<{ name: string; type: string }> = [
  { name: "Applied", type: "applied" },
  { name: "Phone Screen", type: "phone" },
  { name: "Technical Interview", type: "onsite" },
  { name: "Final Interview", type: "onsite" },
  { name: "Offer", type: "offer" },
  { name: "Hired", type: "hired" },
  { name: "Rejected", type: "rejected" },
];

const organizations: Row[] = [
  {
    id: CURRENT_ORG_ID,
    name: "Acme Talent",
    slug: "acme-talent",
    branding_json: { primary_color: "#6d28d9", logo_url: null },
    settings_json: {},
    created_at: days(-400),
  },
];

const profileSeed = [
  { name: "Joao Almeida", email: "joao@acme.com", dept: "People Ops" },
  { name: "Marina Costa", email: "marina@acme.com", dept: "Engineering" },
  { name: "Rafael Souza", email: "rafael@acme.com", dept: "Engineering" },
  { name: "Bianca Lima", email: "bianca@acme.com", dept: "Design" },
  { name: "Daniel Rocha", email: "daniel@acme.com", dept: "Sales" },
];

const profiles: Row[] = profileSeed.map((p, i) => ({
  id: i === 0 ? CURRENT_USER_ID : uid("user0001", i + 1),
  org_id: CURRENT_ORG_ID,
  full_name: p.name,
  email: p.email,
  status: "active",
  timezone: "America/Sao_Paulo",
  avatar_url: null,
  department: p.dept,
  created_at: days(-300 + i),
  updated_at: days(-10),
}));

const user_roles: Row[] = profiles.map((p, i) => ({
  id: uid("role0001", i + 1),
  user_id: p.id,
  role: i === 0 ? "site_admin" : i < 3 ? "job_admin" : "basic",
  created_at: days(-300),
}));

const jobSeed = [
  { title: "Senior Frontend Engineer", dept: "Engineering", loc: "Remote - Brazil", status: "open", type: "full_time" },
  { title: "Product Designer", dept: "Design", loc: "São Paulo, SP", status: "open", type: "full_time" },
  { title: "Backend Engineer (Node)", dept: "Engineering", loc: "Remote - LATAM", status: "open", type: "full_time" },
  { title: "Account Executive", dept: "Sales", loc: "São Paulo, SP", status: "paused", type: "full_time" },
  { title: "Data Analyst", dept: "Data", loc: "Remote", status: "draft", type: "contract" },
  { title: "People Ops Intern", dept: "People Ops", loc: "São Paulo, SP", status: "closed", type: "internship" },
];

const jobs: Row[] = jobSeed.map((j, i) => ({
  id: uid("job00001", i + 1),
  org_id: CURRENT_ORG_ID,
  title: j.title,
  department: j.dept,
  location: j.loc,
  employment_type: j.type,
  description_md: `We are hiring a ${j.title} to join our ${j.dept} team.`,
  requirements_md: "- 3+ years of relevant experience\n- Strong communication skills",
  status: j.status,
  openings: 1 + (i % 3),
  hiring_manager_id: profiles[(i % 4) + 1].id,
  created_by: CURRENT_USER_ID,
  created_at: days(-90 + i * 5),
  updated_at: days(-5),
  salary_range: "R$ 12.000 - R$ 18.000",
  about_us: "Acme Talent builds hiring software people actually enjoy using.",
  role_overview: `As a ${j.title}, you will drive impact across the ${j.dept} organization.`,
  what_you_will_do: "- Ship high quality work\n- Collaborate across teams\n- Mentor peers",
  nice_to_have: "- Experience in a fast-growing startup",
  benefits: "- Health insurance\n- Flexible hours\n- Learning budget",
  required_skills: ["Communication", "Teamwork", j.dept],
}));

const job_stages: Row[] = [];
jobs.forEach((job, ji) => {
  stageDefs.forEach((s, si) => {
    job_stages.push({
      id: uid("stage001", ji * 10 + si + 1),
      job_id: job.id,
      name: s.name,
      order_idx: si,
      type: s.type,
      created_at: job.created_at,
    });
  });
});

const job_acl: Row[] = [];
jobs.forEach((job, ji) => {
  profiles.forEach((p, pi) => {
    job_acl.push({
      id: uid("acl00001", ji * 10 + pi + 1),
      job_id: job.id,
      user_id: p.id,
      can_view: true,
      can_move_pipeline: pi < 3,
      can_message: pi < 3,
      can_view_offer: pi < 2,
      created_at: job.created_at,
      updated_at: job.created_at,
    });
  });
});

const candidateSeed = [
  ["Ana Beatriz Ferreira", "ana.ferreira@mail.com", "São Paulo, SP"],
  ["Carlos Mendes", "carlos.mendes@mail.com", "Rio de Janeiro, RJ"],
  ["Fernanda Oliveira", "fernanda.o@mail.com", "Curitiba, PR"],
  ["Gustavo Pereira", "gustavo.p@mail.com", "Belo Horizonte, MG"],
  ["Helena Martins", "helena.m@mail.com", "Remote"],
  ["Igor Nascimento", "igor.n@mail.com", "Porto Alegre, RS"],
  ["Juliana Ribeiro", "juliana.r@mail.com", "São Paulo, SP"],
  ["Lucas Barbosa", "lucas.b@mail.com", "Recife, PE"],
  ["Mariana Duarte", "mariana.d@mail.com", "Florianópolis, SC"],
  ["Nathan Gomes", "nathan.g@mail.com", "Remote"],
  ["Patrícia Azevedo", "patricia.a@mail.com", "Campinas, SP"],
  ["Rodrigo Teixeira", "rodrigo.t@mail.com", "Brasília, DF"],
];

const sources = ["careers_site", "referral", "linkedin", "agency", "manual"];

const candidates: Row[] = candidateSeed.map((c, i) => ({
  id: uid("cand0001", i + 1),
  org_id: CURRENT_ORG_ID,
  full_name: c[0],
  email: c[1],
  phone: `+55 11 9${String(10000000 + i * 137).slice(0, 8)}`,
  location: c[2],
  linkedin_url: `https://linkedin.com/in/${c[0].toLowerCase().replace(/[^a-z]+/g, "-")}`,
  source: sources[i % sources.length],
  consent: true,
  consent_at: days(-60 + i),
  parsed_resume_json: {
    skills: ["React", "TypeScript", "Communication"],
    experience_years: 3 + (i % 8),
  },
  avatar_url: null,
  created_at: days(-60 + i),
  updated_at: days(-3),
}));

const applications: Row[] = candidates.map((c, i) => {
  const job = jobs[i % 4];
  const stages = job_stages.filter((s) => s.job_id === job.id);
  const stageIdx = i % 5;
  return {
    id: uid("app00001", i + 1),
    candidate_id: c.id,
    job_id: job.id,
    current_stage_id: stages[stageIdx].id,
    state: i === 11 ? "rejected" : "active",
    owner_user_id: profiles[(i % 3) + 1].id,
    applied_at: days(-40 + i),
    rejection_reason: i === 11 ? "Not enough experience" : null,
    rejection_note: null,
    cover_letter: `Hi, I'm very excited about the ${job.title} role.`,
    created_at: days(-40 + i),
    updated_at: days(-2),
  };
});

const interviews: Row[] = applications.slice(0, 6).map((a, i) => ({
  id: uid("intv0001", i + 1),
  application_id: a.id,
  stage_id: a.current_stage_id,
  title: `Interview round ${i + 1}`,
  start_at: days(i - 2),
  end_at: days(i - 2),
  timezone: "America/Sao_Paulo",
  location: "Google Meet",
  meeting_link: "https://meet.google.com/demo-link",
  panel_user_ids: [profiles[1].id, profiles[2].id],
  status: i < 2 ? "completed" : "scheduled",
  ics_file_url: null,
  created_by: CURRENT_USER_ID,
  created_at: days(-10 + i),
}));

const offers: Row[] = applications.slice(0, 3).map((a, i) => ({
  id: uid("offer001", i + 1),
  application_id: a.id,
  currency: "BRL",
  base_amount: 14000 + i * 2000,
  variable_amount: 2000,
  equity: "0.05%",
  benefits_md: "- Health insurance\n- Meal allowance",
  notes: "Standard package",
  state: ["draft", "pending_approval", "approved"][i],
  expires_at: days(14),
  pdf_url: null,
  created_by: CURRENT_USER_ID,
  created_at: days(-7 + i),
  updated_at: days(-1),
}));

const approvals: Row[] = offers.slice(1).map((o, i) => ({
  id: uid("aprv0001", i + 1),
  offer_id: o.id,
  approver_user_id: profiles[1].id,
  state: i === 0 ? "pending" : "approved",
  comment: null,
  acted_at: i === 0 ? null : days(-1),
  created_at: days(-5),
}));

const job_approvals: Row[] = [];

const tasks: Row[] = candidates.slice(0, 5).map((c, i) => ({
  id: uid("task0001", i + 1),
  candidate_id: c.id,
  org_id: CURRENT_ORG_ID,
  title: ["Send take-home test", "Schedule interview", "Collect references", "Review resume", "Follow up email"][i],
  label: ["Screening", "Interview", "References", "Review", "Follow-up"][i],
  due_date: days(i + 1),
  status: i < 2 ? "completed" : "pending",
  created_by: CURRENT_USER_ID,
  created_at: days(-5 + i),
  updated_at: days(-1),
}));

const notifications: Row[] = [
  "New application received",
  "Interview scheduled for tomorrow",
  "Offer awaiting your approval",
].map((title, i) => ({
  id: uid("notif001", i + 1),
  user_id: CURRENT_USER_ID,
  org_id: CURRENT_ORG_ID,
  title,
  message: title,
  type: "info",
  entity_type: "application",
  entity_id: applications[i].id,
  is_read: i > 1,
  created_at: days(-i),
  read_at: null,
}));

const activities: Row[] = applications.slice(0, 8).map((a, i) => ({
  id: uid("act00001", i + 1),
  org_id: CURRENT_ORG_ID,
  actor_id: profiles[i % profiles.length].id,
  entity: "application",
  entity_id: a.id,
  action: i % 2 === 0 ? "created" : "stage_moved",
  before_json: null,
  after_json: null,
  created_at: days(-i),
}));

const message_templates: Row[] = [
  { name: "Interview Invite", subject: "Interview with Acme Talent" },
  { name: "Rejection", subject: "Update on your application" },
  { name: "Offer Letter", subject: "Your offer from Acme Talent" },
].map((t, i) => ({
  id: uid("tmpl0001", i + 1),
  org_id: CURRENT_ORG_ID,
  name: t.name,
  subject: t.subject,
  body_html: `<p>Hi {{candidate_name}},</p><p>${t.name} message body.</p>`,
  variables: ["candidate_name", "job_title"],
  created_at: days(-100),
  updated_at: days(-10),
}));

const messages: Row[] = applications.slice(0, 4).map((a, i) => ({
  id: uid("msg00001", i + 1),
  org_id: CURRENT_ORG_ID,
  application_id: a.id,
  candidate_id: a.candidate_id,
  sender_user_id: CURRENT_USER_ID,
  subject: "Next steps",
  body_html: "<p>Thanks for your time — here are the next steps.</p>",
  to_addresses: [candidates[i].email],
  cc_addresses: [],
  status: "sent",
  external_id: null,
  sent_at: days(-i),
  failed_reason: null,
  created_at: days(-i),
}));

const candidate_comments: Row[] = candidates.slice(0, 4).map((c, i) => ({
  id: uid("cmnt0001", i + 1),
  candidate_id: c.id,
  application_id: applications[i].id,
  user_id: profiles[i % profiles.length].id,
  org_id: CURRENT_ORG_ID,
  content: "Strong communication skills, good culture fit.",
  created_at: days(-i),
}));

const candidate_ratings: Row[] = candidates.slice(0, 4).map((c, i) => ({
  id: uid("rate0001", i + 1),
  candidate_id: c.id,
  user_id: CURRENT_USER_ID,
  org_id: CURRENT_ORG_ID,
  soft_skills: 4,
  hard_skills: 5,
  salary_match: 3,
  culture_fit: 4,
  experience: 4,
  notes: "Solid candidate.",
  created_at: days(-i),
  updated_at: days(-i),
}));

const application_questions: Row[] = jobs.slice(0, 2).flatMap((j, ji) =>
  ["Why do you want this role?", "Are you legally able to work in Brazil?"].map((q, qi) => ({
    id: uid("aq000001", ji * 5 + qi + 1),
    job_id: j.id,
    question_text: q,
    question_type: qi === 0 ? "text" : "boolean",
    options: null,
    is_required: true,
    order_idx: qi,
    created_at: days(-80),
    updated_at: days(-80),
  })),
);

export const initialData: Record<string, Row[]> = {
  organizations,
  profiles,
  user_roles,
  jobs,
  job_stages,
  job_acl,
  job_approvals,
  candidates,
  applications,
  application_questions,
  application_responses: [],
  interviews,
  scorecards: [],
  offers,
  approvals,
  tasks,
  notifications,
  activities,
  message_templates,
  messages,
  candidate_comments,
  candidate_ratings,
  attachments: [],
  user_invitations: [],
};

export const DEMO_USER = {
  id: CURRENT_USER_ID,
  email: profiles[0].email,
  user_metadata: { full_name: profiles[0].full_name },
  app_metadata: {},
  aud: "authenticated",
  created_at: profiles[0].created_at,
};
