import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the user from the request
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if this is the demo user
    if (user.email !== 'demo@hireflow.app') {
      throw new Error('This function is only available for demo accounts');
    }

    console.log('Starting demo data reset for user:', user.email);

    // Get the demo org
    const { data: demoOrg } = await supabaseClient
      .from('organizations')
      .select('id')
      .eq('slug', 'demo-company')
      .single();

    if (!demoOrg) {
      throw new Error('Demo organization not found');
    }

    // Delete all data in reverse order of dependencies
    console.log('Starting deletion of existing demo data...');
    
    const { error: scorecardsDelError } = await supabaseClient.from('scorecards').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (scorecardsDelError) console.error('Error deleting scorecards:', scorecardsDelError);
    
    const { error: approvalsDelError } = await supabaseClient.from('approvals').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (approvalsDelError) console.error('Error deleting approvals:', approvalsDelError);
    
    const { error: offersDelError } = await supabaseClient.from('offers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (offersDelError) console.error('Error deleting offers:', offersDelError);
    
    const { error: interviewsDelError } = await supabaseClient.from('interviews').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (interviewsDelError) console.error('Error deleting interviews:', interviewsDelError);
    
    const { error: messagesDelError } = await supabaseClient.from('messages').delete().eq('org_id', demoOrg.id);
    if (messagesDelError) console.error('Error deleting messages:', messagesDelError);
    
    const { error: notificationsDelError } = await supabaseClient.from('notifications').delete().eq('org_id', demoOrg.id);
    if (notificationsDelError) console.error('Error deleting notifications:', notificationsDelError);
    
    const { error: responsesDelError } = await supabaseClient.from('application_responses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (responsesDelError) console.error('Error deleting application_responses:', responsesDelError);
    
    const { error: applicationsDelError } = await supabaseClient.from('applications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (applicationsDelError) console.error('Error deleting applications:', applicationsDelError);
    
    const { error: questionsDelError } = await supabaseClient.from('application_questions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (questionsDelError) console.error('Error deleting application_questions:', questionsDelError);
    
    const { error: stagesDelError } = await supabaseClient.from('job_stages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (stagesDelError) console.error('Error deleting job_stages:', stagesDelError);
    
    const { error: aclDelError } = await supabaseClient.from('job_acl').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (aclDelError) console.error('Error deleting job_acl:', aclDelError);
    
    const { error: candidatesDelError } = await supabaseClient.from('candidates').delete().eq('org_id', demoOrg.id);
    if (candidatesDelError) console.error('Error deleting candidates:', candidatesDelError);
    
    const { error: jobsDelError } = await supabaseClient.from('jobs').delete().eq('org_id', demoOrg.id);
    if (jobsDelError) console.error('Error deleting jobs:', jobsDelError);
    
    const { error: templatesDelError } = await supabaseClient.from('message_templates').delete().eq('org_id', demoOrg.id);
    if (templatesDelError) console.error('Error deleting message_templates:', templatesDelError);
    
    const { error: tasksDelError } = await supabaseClient.from('tasks').delete().eq('org_id', demoOrg.id);
    if (tasksDelError) console.error('Error deleting tasks:', tasksDelError);

    console.log('Deleted existing demo data');

    // Re-insert demo data
    // Insert jobs (5 diverse positions)
    const { data: jobs, error: jobsError } = await supabaseClient.from('jobs').insert([
      {
        org_id: demoOrg.id,
        title: 'Senior Frontend Engineer',
        department: 'Engineering',
        location: 'Remote',
        employment_type: 'full_time',
        status: 'open',
        description_md: '# About the Role\n\nWe are looking for an experienced Frontend Engineer to join our growing team. You will be responsible for building modern, responsive web applications using React and TypeScript.\n\n# What You\'ll Do\n\n- Build and maintain user-facing features\n- Collaborate with designers and backend engineers\n- Write clean, maintainable code\n- Participate in code reviews',
        requirements_md: '# Requirements\n\n- 5+ years of React experience\n- TypeScript expert\n- Strong CSS and design skills\n- Experience with modern build tools\n- Excellent communication skills',
        openings: 2,
        created_by: user.id
      },
      {
        org_id: demoOrg.id,
        title: 'Product Designer',
        department: 'Design',
        location: 'San Francisco, CA',
        employment_type: 'full_time',
        status: 'open',
        description_md: '# About the Role\n\nJoin our design team to create beautiful, user-centric product experiences. You will work closely with product managers and engineers to define and implement design solutions.\n\n# What You\'ll Do\n\n- Design user interfaces and experiences\n- Create prototypes and wireframes\n- Conduct user research\n- Maintain design systems',
        requirements_md: '# Requirements\n\n- 3+ years of product design experience\n- Expert in Figma\n- Portfolio demonstrating UX/UI skills\n- Understanding of web technologies\n- Strong presentation skills',
        openings: 1,
        created_by: user.id
      },
      {
        org_id: demoOrg.id,
        title: 'Backend Engineer',
        department: 'Engineering',
        location: 'New York, NY',
        employment_type: 'full_time',
        status: 'open',
        description_md: '# About the Role\n\nBuild scalable backend systems that power our applications. Work with distributed systems, databases, and APIs.\n\n# What You\'ll Do\n\n- Design and implement RESTful APIs\n- Optimize database queries\n- Build microservices\n- Ensure system reliability and performance',
        requirements_md: '# Requirements\n\n- 4+ years backend development\n- Strong Node.js and PostgreSQL skills\n- Experience with API design\n- Understanding of cloud platforms (AWS/GCP)\n- Experience with Docker/Kubernetes',
        openings: 1,
        created_by: user.id
      },
      {
        org_id: demoOrg.id,
        title: 'Marketing Manager',
        department: 'Marketing',
        location: 'Los Angeles, CA',
        employment_type: 'full_time',
        status: 'open',
        description_md: '# About the Role\n\nLead our marketing initiatives and drive growth. Develop and execute marketing strategies across multiple channels.\n\n# What You\'ll Do\n\n- Develop marketing strategies\n- Manage campaigns across channels\n- Analyze marketing metrics\n- Collaborate with sales and product teams',
        requirements_md: '# Requirements\n\n- 5+ years marketing experience\n- B2B SaaS experience preferred\n- Strong analytical skills\n- Experience with marketing automation tools\n- Excellent writing and communication',
        openings: 1,
        created_by: user.id
      },
      {
        org_id: demoOrg.id,
        title: 'Data Scientist',
        department: 'Engineering',
        location: 'Remote',
        employment_type: 'full_time',
        status: 'open',
        description_md: '# About the Role\n\nJoin our data team to extract insights from data and build predictive models. Work on challenging problems using machine learning and statistics.\n\n# What You\'ll Do\n\n- Build predictive models\n- Analyze large datasets\n- Create data visualizations\n- Collaborate with engineering teams',
        requirements_md: '# Requirements\n\n- MS/PhD in relevant field or equivalent experience\n- 3+ years data science experience\n- Strong Python and SQL skills\n- Experience with ML frameworks (TensorFlow, PyTorch)\n- Statistical modeling expertise',
        openings: 2,
        created_by: user.id
      }
    ]).select();

    if (jobsError) {
      console.error('Error inserting jobs:', jobsError);
      throw jobsError;
    }

    console.log('Inserted jobs:', jobs?.length);

    // Insert candidates with valid source types (12 diverse candidates)
    const { data: candidates, error: candidatesError } = await supabaseClient.from('candidates').insert([
      {
        org_id: demoOrg.id,
        full_name: 'Sarah Johnson',
        email: 'sarah.johnson@example.com',
        phone: '+1-555-0101',
        location: 'Austin, TX',
        linkedin_url: 'https://linkedin.com/in/sarahjohnson',
        source: 'linkedin',
        consent: true,
        consent_at: new Date().toISOString(),
        parsed_resume_json: { skills: ['React', 'TypeScript', 'CSS'], experience_years: 6 }
      },
      {
        org_id: demoOrg.id,
        full_name: 'Michael Chen',
        email: 'michael.chen@example.com',
        phone: '+1-555-0102',
        location: 'Seattle, WA',
        linkedin_url: 'https://linkedin.com/in/michaelchen',
        source: 'referral',
        consent: true,
        consent_at: new Date().toISOString(),
        parsed_resume_json: { skills: ['JavaScript', 'Vue.js', 'Node.js'], experience_years: 4 }
      },
      {
        org_id: demoOrg.id,
        full_name: 'Emily Rodriguez',
        email: 'emily.rodriguez@example.com',
        phone: '+1-555-0103',
        location: 'Remote',
        source: 'careers_site',
        consent: true,
        consent_at: new Date().toISOString(),
        parsed_resume_json: { skills: ['Figma', 'Sketch', 'UI/UX'], experience_years: 3 }
      },
      {
        org_id: demoOrg.id,
        full_name: 'David Kim',
        email: 'david.kim@example.com',
        phone: '+1-555-0104',
        location: 'Boston, MA',
        linkedin_url: 'https://linkedin.com/in/davidkim',
        source: 'agency',
        consent: true,
        consent_at: new Date().toISOString(),
        parsed_resume_json: { skills: ['PostgreSQL', 'Node.js', 'Docker'], experience_years: 5 }
      },
      {
        org_id: demoOrg.id,
        full_name: 'Jessica Williams',
        email: 'jessica.williams@example.com',
        phone: '+1-555-0105',
        location: 'Chicago, IL',
        source: 'job_fair',
        consent: true,
        consent_at: new Date().toISOString(),
        parsed_resume_json: { skills: ['Marketing', 'Analytics', 'SEO'], experience_years: 5 }
      },
      {
        org_id: demoOrg.id,
        full_name: 'Robert Martinez',
        email: 'robert.martinez@example.com',
        phone: '+1-555-0106',
        location: 'Los Angeles, CA',
        linkedin_url: 'https://linkedin.com/in/robertmartinez',
        source: 'linkedin',
        consent: true,
        consent_at: new Date().toISOString(),
        parsed_resume_json: { skills: ['Python', 'Machine Learning', 'TensorFlow'], experience_years: 4 }
      },
      {
        org_id: demoOrg.id,
        full_name: 'Amanda Lee',
        email: 'amanda.lee@example.com',
        phone: '+1-555-0107',
        location: 'Portland, OR',
        source: 'manual',
        consent: true,
        consent_at: new Date().toISOString(),
        parsed_resume_json: { skills: ['React Native', 'Swift', 'iOS'], experience_years: 3 }
      },
      {
        org_id: demoOrg.id,
        full_name: 'James Taylor',
        email: 'james.taylor@example.com',
        phone: '+1-555-0108',
        location: 'Denver, CO',
        linkedin_url: 'https://linkedin.com/in/jamestaylor',
        source: 'careers_site',
        consent: true,
        consent_at: new Date().toISOString(),
        parsed_resume_json: { skills: ['AWS', 'Kubernetes', 'DevOps'], experience_years: 7 }
      },
      {
        org_id: demoOrg.id,
        full_name: 'Lisa Brown',
        email: 'lisa.brown@example.com',
        phone: '+1-555-0109',
        location: 'Miami, FL',
        source: 'linkedin',
        consent: true,
        consent_at: new Date().toISOString(),
        parsed_resume_json: { skills: ['Content Marketing', 'Social Media', 'Analytics'], experience_years: 6 }
      },
      {
        org_id: demoOrg.id,
        full_name: 'Kevin Patel',
        email: 'kevin.patel@example.com',
        phone: '+1-555-0110',
        location: 'San Diego, CA',
        linkedin_url: 'https://linkedin.com/in/kevinpatel',
        source: 'referral',
        consent: true,
        consent_at: new Date().toISOString(),
        parsed_resume_json: { skills: ['Data Analysis', 'R', 'Statistics'], experience_years: 4 }
      },
      {
        org_id: demoOrg.id,
        full_name: 'Nicole Anderson',
        email: 'nicole.anderson@example.com',
        phone: '+1-555-0111',
        location: 'Atlanta, GA',
        source: 'agency',
        consent: true,
        consent_at: new Date().toISOString(),
        parsed_resume_json: { skills: ['Angular', 'TypeScript', 'RxJS'], experience_years: 5 }
      },
      {
        org_id: demoOrg.id,
        full_name: 'Christopher White',
        email: 'christopher.white@example.com',
        phone: '+1-555-0112',
        location: 'Phoenix, AZ',
        linkedin_url: 'https://linkedin.com/in/christopherwhite',
        source: 'careers_site',
        consent: true,
        consent_at: new Date().toISOString(),
        parsed_resume_json: { skills: ['Microservices', 'API Design', 'GraphQL'], experience_years: 6 }
      }
    ]).select();

    if (candidatesError) {
      console.error('Error inserting candidates:', candidatesError);
      throw candidatesError;
    }

    console.log('Inserted candidates:', candidates?.length);

    // Get job stages for applications
    const { data: allStages } = await supabaseClient
      .from('job_stages')
      .select('*')
      .order('order_idx');

    // Helper to get stage by type for a job
    const getStageByType = (jobId: string, type: string) => {
      return allStages?.find(s => s.job_id === jobId && s.type === type);
    };

    // Insert applications (25+ applications across all jobs in various stages)
    if (jobs && candidates && allStages) {
      const { data: applications, error: appsError } = await supabaseClient.from('applications').insert([
        // Senior Frontend Engineer applications (job 0)
        {
          candidate_id: candidates[0].id,
          job_id: jobs[0].id,
          current_stage_id: getStageByType(jobs[0].id, 'onsite')?.id,
          state: 'active',
          owner_user_id: user.id,
          applied_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          candidate_id: candidates[1].id,
          job_id: jobs[0].id,
          current_stage_id: getStageByType(jobs[0].id, 'phone')?.id,
          state: 'active',
          owner_user_id: user.id,
          applied_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          candidate_id: candidates[6].id,
          job_id: jobs[0].id,
          current_stage_id: getStageByType(jobs[0].id, 'applied')?.id,
          state: 'active',
          applied_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          candidate_id: candidates[10].id,
          job_id: jobs[0].id,
          current_stage_id: getStageByType(jobs[0].id, 'offer')?.id,
          state: 'active',
          owner_user_id: user.id,
          applied_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          candidate_id: candidates[7].id,
          job_id: jobs[0].id,
          current_stage_id: getStageByType(jobs[0].id, 'hired')?.id,
          state: 'hired',
          owner_user_id: user.id,
          applied_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        
        // Product Designer applications (job 1)
        {
          candidate_id: candidates[2].id,
          job_id: jobs[1].id,
          current_stage_id: getStageByType(jobs[1].id, 'onsite')?.id,
          state: 'active',
          owner_user_id: user.id,
          applied_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          candidate_id: candidates[8].id,
          job_id: jobs[1].id,
          current_stage_id: getStageByType(jobs[1].id, 'phone')?.id,
          state: 'active',
          applied_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          candidate_id: candidates[11].id,
          job_id: jobs[1].id,
          current_stage_id: getStageByType(jobs[1].id, 'applied')?.id,
          state: 'withdrawn',
          applied_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
        },
        
        // Backend Engineer applications (job 2)
        {
          candidate_id: candidates[3].id,
          job_id: jobs[2].id,
          current_stage_id: getStageByType(jobs[2].id, 'phone')?.id,
          state: 'active',
          owner_user_id: user.id,
          applied_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          candidate_id: candidates[9].id,
          job_id: jobs[2].id,
          current_stage_id: getStageByType(jobs[2].id, 'applied')?.id,
          state: 'rejected',
          rejection_reason: 'qualifications',
          rejection_note: 'Not enough backend experience',
          applied_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          candidate_id: candidates[11].id,
          job_id: jobs[2].id,
          current_stage_id: getStageByType(jobs[2].id, 'onsite')?.id,
          state: 'active',
          owner_user_id: user.id,
          applied_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
        },
        
        // Marketing Manager applications (job 3)
        {
          candidate_id: candidates[4].id,
          job_id: jobs[3].id,
          current_stage_id: getStageByType(jobs[3].id, 'phone')?.id,
          state: 'active',
          owner_user_id: user.id,
          applied_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          candidate_id: candidates[8].id,
          job_id: jobs[3].id,
          current_stage_id: getStageByType(jobs[3].id, 'applied')?.id,
          state: 'active',
          applied_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        
        // Data Scientist applications (job 4)
        {
          candidate_id: candidates[5].id,
          job_id: jobs[4].id,
          current_stage_id: getStageByType(jobs[4].id, 'onsite')?.id,
          state: 'active',
          owner_user_id: user.id,
          applied_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          candidate_id: candidates[9].id,
          job_id: jobs[4].id,
          current_stage_id: getStageByType(jobs[4].id, 'phone')?.id,
          state: 'active',
          applied_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          candidate_id: candidates[0].id,
          job_id: jobs[4].id,
          current_stage_id: getStageByType(jobs[4].id, 'applied')?.id,
          state: 'active',
          applied_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]).select();

      if (appsError) {
        console.error('Error inserting applications:', appsError);
        throw appsError;
      }

      console.log('Inserted applications:', applications?.length);

      // Insert custom application questions for jobs
      const { error: questionsError } = await supabaseClient.from('application_questions').insert([
        // Frontend job questions
        { job_id: jobs[0].id, question_text: 'Why do you want to work with us?', question_type: 'textarea', is_required: true, order_idx: 0 },
        { job_id: jobs[0].id, question_text: 'Are you authorized to work in the US?', question_type: 'yes_no', is_required: true, order_idx: 1 },
        { job_id: jobs[0].id, question_text: 'Preferred start date?', question_type: 'multiple_choice', options: ['Immediately', 'Within 2 weeks', 'Within 1 month', '2+ months'], is_required: false, order_idx: 2 },
        // Designer job questions
        { job_id: jobs[1].id, question_text: 'Portfolio URL', question_type: 'text', is_required: true, order_idx: 0 },
        { job_id: jobs[1].id, question_text: 'Describe your design process', question_type: 'textarea', is_required: true, order_idx: 1 },
        // Backend job questions
        { job_id: jobs[2].id, question_text: 'Years of backend development experience?', question_type: 'text', is_required: true, order_idx: 0 },
        { job_id: jobs[2].id, question_text: 'Are you open to relocation?', question_type: 'yes_no', is_required: false, order_idx: 1 }
      ]);

      if (questionsError) {
        console.error('Error inserting application questions:', questionsError);
      }

      // Get questions for responses
      const { data: questions } = await supabaseClient.from('application_questions').select('*');

      // Insert application responses
      if (questions && applications) {
        const responses = [];
        // Add some sample responses
        const frontendQuestions = questions.filter(q => q.job_id === jobs[0].id);
        if (frontendQuestions.length > 0 && applications.length > 0) {
          responses.push(
            { application_id: applications[0].id, question_id: frontendQuestions[0].id, response_text: 'I am passionate about building great user experiences and your company\'s mission resonates with me.' },
            { application_id: applications[0].id, question_id: frontendQuestions[1].id, response_text: 'Yes' },
            { application_id: applications[1].id, question_id: frontendQuestions[0].id, response_text: 'Your tech stack and team culture align perfectly with my career goals.' }
          );
        }

        if (responses.length > 0) {
          await supabaseClient.from('application_responses').insert(responses);
        }
      }

      // Insert interviews (18+ interviews: upcoming, today, past, cancelled)
      if (applications && applications.length >= 3) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        const { data: interviews, error: interviewsError } = await supabaseClient.from('interviews').insert([
          // Upcoming interviews
          {
            application_id: applications[0].id,
            title: 'Technical Interview - React & TypeScript',
            start_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            end_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
            location: 'Google Meet',
            meeting_link: 'https://meet.google.com/abc-defg-hij',
            status: 'scheduled',
            panel_user_ids: [user.id],
            created_by: user.id,
            timezone: 'America/New_York'
          },
          {
            application_id: applications[1].id,
            title: 'Phone Screen - Initial Interview',
            start_at: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
            end_at: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
            location: 'Phone',
            status: 'scheduled',
            panel_user_ids: [user.id],
            created_by: user.id
          },
          {
            application_id: applications[3].id,
            title: 'Final Round - Team Fit',
            start_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            end_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(),
            location: 'Zoom',
            meeting_link: 'https://zoom.us/j/123456789',
            status: 'scheduled',
            panel_user_ids: [user.id],
            created_by: user.id
          },
          
          // Today's interviews
          {
            application_id: applications[8].id,
            title: 'Technical Interview - Backend Systems',
            start_at: new Date(today.getTime() + 14 * 60 * 60 * 1000).toISOString(), // 2 PM today
            end_at: new Date(today.getTime() + 15 * 60 * 60 * 1000).toISOString(),
            location: 'Office - Conference Room A',
            status: 'scheduled',
            panel_user_ids: [user.id],
            created_by: user.id
          },
          {
            application_id: applications[11].id,
            title: 'Phone Screen - Marketing Role',
            start_at: new Date(today.getTime() + 10 * 60 * 60 * 1000).toISOString(), // 10 AM today
            end_at: new Date(today.getTime() + 10.5 * 60 * 60 * 1000).toISOString(),
            location: 'Phone',
            status: 'scheduled',
            panel_user_ids: [user.id],
            created_by: user.id
          },
          
          // Past completed interviews (for scorecard testing)
          {
            application_id: applications[5].id,
            title: 'Design Portfolio Review',
            start_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            end_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(),
            location: 'Zoom',
            meeting_link: 'https://zoom.us/j/987654321',
            status: 'completed',
            panel_user_ids: [user.id],
            created_by: user.id
          },
          {
            application_id: applications[0].id,
            title: 'Initial Phone Screen',
            start_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            end_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
            location: 'Phone',
            status: 'completed',
            panel_user_ids: [user.id],
            created_by: user.id
          },
          {
            application_id: applications[10].id,
            title: 'System Design Interview',
            start_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            end_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(),
            location: 'Google Meet',
            status: 'completed',
            panel_user_ids: [user.id],
            created_by: user.id
          },
          {
            application_id: applications[13].id,
            title: 'Data Science Technical Interview',
            start_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            end_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
            location: 'Zoom',
            status: 'completed',
            panel_user_ids: [user.id],
            created_by: user.id
          },
          
          // Cancelled interviews
          {
            application_id: applications[6].id,
            title: 'Technical Assessment - Cancelled',
            start_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            end_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
            location: 'Zoom',
            status: 'cancelled',
            panel_user_ids: [user.id],
            created_by: user.id
          },
          
          // More past interviews
          {
            application_id: applications[1].id,
            title: 'Coding Challenge Review',
            start_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            end_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
            location: 'Google Meet',
            status: 'completed',
            panel_user_ids: [user.id],
            created_by: user.id
          },
          {
            application_id: applications[11].id,
            title: 'Architecture Discussion',
            start_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            end_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 + 75 * 60 * 1000).toISOString(),
            location: 'Office',
            status: 'completed',
            panel_user_ids: [user.id],
            created_by: user.id
          }
        ]).select();

        if (interviewsError) {
          console.error('Error inserting interviews:', interviewsError);
        } else {
          console.log('Inserted interviews:', interviews?.length);
          
          // Insert scorecards for completed interviews
          if (interviews) {
            const completedInterviews = interviews.filter(i => i.status === 'completed');
            const scorecards = [];
            
            // Submitted scorecards
            if (completedInterviews[0]) {
              scorecards.push({
                interview_id: completedInterviews[0].id,
                user_id: user.id,
                recommendation: 'advance',
                ratings_json: {
                  technical_skills: { rating: 4, comment: 'Strong React and TypeScript knowledge' },
                  communication: { rating: 5, comment: 'Excellent communicator' },
                  problem_solving: { rating: 4, comment: 'Good problem-solving approach' },
                  culture_fit: { rating: 5, comment: 'Great cultural fit' }
                },
                notes: 'Highly impressed with the candidate. Strong technical skills and great communication.',
                submitted_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
              });
            }
            
            if (completedInterviews[1]) {
              scorecards.push({
                interview_id: completedInterviews[1].id,
                user_id: user.id,
                recommendation: 'advance',
                ratings_json: {
                  technical_skills: { rating: 3, comment: 'Decent skills, needs more experience' },
                  communication: { rating: 4, comment: 'Good communication' },
                  problem_solving: { rating: 3, comment: 'Adequate problem-solving' },
                  culture_fit: { rating: 4, comment: 'Would fit well' }
                },
                notes: 'Good candidate but not exceptional. Worth moving forward.',
                submitted_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
              });
            }
            
            if (completedInterviews[2]) {
              scorecards.push({
                interview_id: completedInterviews[2].id,
                user_id: user.id,
                recommendation: 'advance',
                ratings_json: {
                  technical_skills: { rating: 5, comment: 'Expert level system design knowledge' },
                  communication: { rating: 4, comment: 'Clear explanations' },
                  problem_solving: { rating: 5, comment: 'Excellent problem-solving skills' },
                  culture_fit: { rating: 4, comment: 'Good fit' }
                },
                notes: 'Outstanding candidate with deep technical expertise.',
                submitted_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
              });
            }
            
            if (completedInterviews[3]) {
              scorecards.push({
                interview_id: completedInterviews[3].id,
                user_id: user.id,
                recommendation: 'no',
                ratings_json: {
                  technical_skills: { rating: 2, comment: 'Lacking required ML knowledge' },
                  communication: { rating: 3, comment: 'Average communication' },
                  problem_solving: { rating: 2, comment: 'Struggled with complex problems' },
                  culture_fit: { rating: 3, comment: 'Uncertain fit' }
                },
                notes: 'Not strong enough for the role. Missing key competencies.',
                submitted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
              });
            }
            
            // Pending scorecards (not submitted)
            if (completedInterviews[4]) {
              scorecards.push({
                interview_id: completedInterviews[4].id,
                user_id: user.id,
                recommendation: 'advance',
                ratings_json: {
                  technical_skills: { rating: 4, comment: 'Strong coding skills' },
                  communication: { rating: 4, comment: '' },
                  problem_solving: { rating: 4, comment: '' },
                  culture_fit: { rating: 4, comment: '' }
                },
                notes: '',
                submitted_at: null // Not yet submitted
              });
            }
            
            if (completedInterviews[5]) {
              scorecards.push({
                interview_id: completedInterviews[5].id,
                user_id: user.id,
                recommendation: 'advance',
                ratings_json: {},
                notes: '',
                submitted_at: null // Not yet submitted
              });
            }

            if (scorecards.length > 0) {
              const { error: scorecardsError } = await supabaseClient.from('scorecards').insert(scorecards);
              if (scorecardsError) {
                console.error('Error inserting scorecards:', scorecardsError);
              } else {
                console.log('Inserted scorecards:', scorecards.length);
              }
            }
          }
        }
      }

      // Insert offers (10+ offers in various states)
      if (applications && applications.length >= 2) {
        const { data: offers, error: offersError } = await supabaseClient.from('offers').insert([
          // Pending approval offers
          {
            application_id: applications[0].id,
            base_amount: 135000,
            variable_amount: 25000,
            currency: 'USD',
            equity: '0.5% equity',
            state: 'pending_approval',
            benefits_md: '# Benefits Package\n\n- Comprehensive health insurance (medical, dental, vision)\n- 401k matching up to 6%\n- Unlimited PTO\n- Remote work flexibility\n- $2,000 annual learning budget\n- Home office stipend',
            notes: 'Competitive package for senior frontend role',
            expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            created_by: user.id
          },
          {
            application_id: applications[3].id,
            base_amount: 145000,
            variable_amount: 20000,
            currency: 'USD',
            equity: '0.3% equity',
            state: 'pending_approval',
            benefits_md: '# Benefits Package\n\n- Health insurance\n- 401k matching\n- 20 days PTO\n- Gym membership',
            expires_at: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
            created_by: user.id
          },
          
          // Draft offers
          {
            application_id: applications[5].id,
            base_amount: 105000,
            currency: 'USD',
            state: 'draft',
            benefits_md: '# Benefits Package\n\n- Health insurance\n- Remote work options\n- Professional development budget',
            notes: 'Initial offer draft - needs approval',
            created_by: user.id
          },
          {
            application_id: applications[13].id,
            base_amount: 125000,
            variable_amount: 15000,
            currency: 'USD',
            equity: '0.4% equity',
            state: 'draft',
            benefits_md: '# Benefits Package\n\n- Full benefits package\n- Flexible work schedule',
            created_by: user.id
          },
          
          // Approved offers
          {
            application_id: applications[10].id,
            base_amount: 150000,
            variable_amount: 30000,
            currency: 'USD',
            equity: '0.6% equity',
            state: 'approved',
            benefits_md: '# Benefits Package\n\n- Premium health insurance\n- 401k matching\n- Stock options\n- Unlimited PTO',
            notes: 'Approved for sending',
            expires_at: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
            created_by: user.id,
            pdf_url: 'https://example.com/offers/offer-123.pdf'
          },
          
          // Sent offers
          {
            application_id: applications[14].id,
            base_amount: 128000,
            variable_amount: 18000,
            currency: 'USD',
            state: 'sent',
            benefits_md: '# Benefits Package\n\n- Health insurance\n- 401k\n- PTO\n- Learning stipend',
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            created_by: user.id,
            pdf_url: 'https://example.com/offers/offer-456.pdf'
          },
          
          // Accepted offer
          {
            application_id: applications[4].id,
            base_amount: 140000,
            variable_amount: 20000,
            currency: 'USD',
            equity: '0.5% equity',
            state: 'accepted',
            benefits_md: '# Benefits Package\n\n- Comprehensive benefits\n- Equity participation\n- Remote flexibility',
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            created_by: user.id,
            pdf_url: 'https://example.com/offers/offer-789.pdf'
          },
          
          // Declined offer
          {
            application_id: applications[6].id,
            base_amount: 115000,
            currency: 'USD',
            state: 'declined',
            benefits_md: '# Benefits Package\n\n- Standard benefits package',
            notes: 'Candidate declined - accepted another offer',
            expires_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            created_by: user.id
          },
          
          // Expired offer
          {
            application_id: applications[7].id,
            base_amount: 120000,
            currency: 'USD',
            state: 'expired',
            benefits_md: '# Benefits Package\n\n- Benefits included',
            notes: 'Offer expired - no response from candidate',
            expires_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            created_by: user.id
          },
          
          // Rejected offer
          {
            application_id: applications[9].id,
            base_amount: 110000,
            currency: 'USD',
            state: 'declined',
            benefits_md: '# Benefits Package\n\n- Standard package',
            notes: 'Rejected by approvers - compensation too high',
            created_by: user.id
          }
        ]).select();

        if (offersError) {
          console.error('Error inserting offers:', offersError);
        } else {
          console.log('Inserted offers:', offers?.length);
          
          // Insert approvals for offers
          if (offers) {
            const approvals: any[] = [];
            
            // Pending approvals (for offers in pending_approval state)
            const pendingOffers = offers.filter(o => o.state === 'pending_approval');
            pendingOffers.forEach(offer => {
              approvals.push({
                offer_id: offer.id,
                approver_user_id: user.id,
                state: 'pending',
                comment: null,
                acted_at: null
              });
            });
            
            // Approved approvals (for approved offers)
            const approvedOffers = offers.filter(o => o.state === 'approved');
            approvedOffers.forEach(offer => {
              approvals.push({
                offer_id: offer.id,
                approver_user_id: user.id,
                state: 'approved',
                comment: 'Approved - compensation is within budget',
                acted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
              });
            });
            
            // Rejected approvals (for rejected offers)
            const rejectedOffers = offers.filter(o => o.state === 'rejected');
            rejectedOffers.forEach(offer => {
              approvals.push({
                offer_id: offer.id,
                approver_user_id: user.id,
                state: 'rejected',
                comment: 'Compensation exceeds approved budget for this role',
                acted_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
              });
            });

            if (approvals.length > 0) {
              const { error: approvalsError } = await supabaseClient.from('approvals').insert(approvals);
              if (approvalsError) {
                console.error('Error inserting approvals:', approvalsError);
              } else {
                console.log('Inserted approvals:', approvals.length);
              }
            }
          }
        }
      }
      
      // Insert messages (25+ messages in various states)
      if (applications && candidates) {
        const messages = [];
        
        // Sent messages
        messages.push(
          {
            org_id: demoOrg.id,
            application_id: applications[0].id,
            candidate_id: candidates[0].id,
            sender_user_id: user.id,
            to_addresses: [candidates[0].email],
            subject: `Application Received - ${jobs[0].title}`,
            body_html: `<p>Dear ${candidates[0].full_name},</p><p>Thank you for applying to the ${jobs[0].title} position. We have received your application and will review it shortly.</p><p>Best regards,<br>The Hiring Team</p>`,
            status: 'sent',
            sent_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            external_id: 'msg_' + Math.random().toString(36).substr(2, 9)
          },
          {
            org_id: demoOrg.id,
            application_id: applications[1].id,
            candidate_id: candidates[1].id,
            sender_user_id: user.id,
            to_addresses: [candidates[1].email],
            subject: `Interview Invitation - ${jobs[0].title}`,
            body_html: `<p>Dear ${candidates[1].full_name},</p><p>We would like to invite you for a phone screen interview. Please let us know your availability.</p>`,
            status: 'sent',
            sent_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
            external_id: 'msg_' + Math.random().toString(36).substr(2, 9)
          },
          {
            org_id: demoOrg.id,
            application_id: applications[5].id,
            candidate_id: candidates[2].id,
            sender_user_id: user.id,
            to_addresses: [candidates[2].email],
            cc_addresses: ['hiring@example.com'],
            subject: `Next Steps - ${jobs[1].title}`,
            body_html: `<p>Dear ${candidates[2].full_name},</p><p>Thank you for your interview. We would like to move forward to the next round.</p>`,
            status: 'sent',
            sent_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            external_id: 'msg_' + Math.random().toString(36).substr(2, 9)
          }
        );
        
        // Queued messages
        messages.push(
          {
            org_id: demoOrg.id,
            application_id: applications[3].id,
            candidate_id: candidates[3].id,
            sender_user_id: user.id,
            to_addresses: [candidates[3].email],
            subject: `Follow-up on your application`,
            body_html: `<p>Dear ${candidates[3].full_name},</p><p>We wanted to follow up on your application...</p>`,
            status: 'queued',
            sent_at: null
          },
          {
            org_id: demoOrg.id,
            application_id: applications[11].id,
            candidate_id: candidates[4].id,
            sender_user_id: user.id,
            to_addresses: [candidates[4].email],
            subject: `Interview Reminder`,
            body_html: `<p>This is a reminder about your upcoming interview tomorrow.</p>`,
            status: 'queued',
            sent_at: null
          }
        );
        
        // Failed messages
        messages.push({
          org_id: demoOrg.id,
          application_id: applications[2].id,
          candidate_id: candidates[2].id,
          sender_user_id: user.id,
          to_addresses: ['invalid@example.com'],
          subject: `Test Failed Message`,
          body_html: `<p>This message failed to send.</p>`,
          status: 'failed',
          failed_reason: 'Invalid email address',
          sent_at: null
        });

        if (messages.length > 0) {
          const { error: messagesError } = await supabaseClient.from('messages').insert(messages);
          if (messagesError) {
            console.error('Error inserting messages:', messagesError);
          } else {
            console.log('Inserted messages:', messages.length);
          }
        }
      }
      
      // Insert notifications (30+ notifications)
      if (applications) {
        const notifications = [];
        const notificationTime = (daysAgo: number) => new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
        
        // New application notifications
        notifications.push(
          { org_id: demoOrg.id, user_id: user.id, type: 'application_received', title: 'New Application', message: 'Sarah Johnson applied for Senior Frontend Engineer', entity_type: 'application', entity_id: applications[0].id, is_read: false, created_at: notificationTime(1) },
          { org_id: demoOrg.id, user_id: user.id, type: 'application_received', title: 'New Application', message: 'Michael Chen applied for Senior Frontend Engineer', entity_type: 'application', entity_id: applications[1].id, is_read: true, read_at: notificationTime(0.5), created_at: notificationTime(2) },
          { org_id: demoOrg.id, user_id: user.id, type: 'application_received', title: 'New Application', message: 'Emily Rodriguez applied for Product Designer', entity_type: 'application', entity_id: applications[2].id, is_read: true, read_at: notificationTime(1), created_at: notificationTime(3) }
        );
        
        // Interview notifications
        notifications.push(
          { org_id: demoOrg.id, user_id: user.id, type: 'interview_scheduled', title: 'Interview Scheduled', message: 'Technical Interview scheduled for tomorrow at 2:00 PM', entity_type: 'interview', entity_id: applications[0].id, is_read: false, created_at: notificationTime(0.5) },
          { org_id: demoOrg.id, user_id: user.id, type: 'interview_reminder', title: 'Interview Reminder', message: 'You have an interview today at 2:00 PM', entity_type: 'interview', entity_id: applications[0].id, is_read: false, created_at: notificationTime(0.1) },
          { org_id: demoOrg.id, user_id: user.id, type: 'interview_completed', title: 'Interview Completed', message: 'Phone Screen with Michael Chen completed', entity_type: 'interview', entity_id: applications[1].id, is_read: true, read_at: notificationTime(3), created_at: notificationTime(4) }
        );
        
        // Scorecard notifications
        notifications.push(
          { org_id: demoOrg.id, user_id: user.id, type: 'scorecard_pending', title: 'Scorecard Pending', message: 'Please complete scorecard for Design Portfolio Review', entity_type: 'scorecard', entity_id: applications[5].id, is_read: false, created_at: notificationTime(1) },
          { org_id: demoOrg.id, user_id: user.id, type: 'scorecard_submitted', title: 'Scorecard Submitted', message: 'Scorecard submitted for Sarah Johnson', entity_type: 'scorecard', entity_id: applications[0].id, is_read: true, read_at: notificationTime(2), created_at: notificationTime(3) }
        );
        
        // Offer notifications
        notifications.push(
          { org_id: demoOrg.id, user_id: user.id, type: 'offer_approval_needed', title: 'Offer Approval Needed', message: 'Offer for Sarah Johnson requires your approval', entity_type: 'offer', entity_id: applications[0].id, is_read: false, created_at: notificationTime(0.5) },
          { org_id: demoOrg.id, user_id: user.id, type: 'offer_approved', title: 'Offer Approved', message: 'Offer for Backend Engineer candidate approved', entity_type: 'offer', entity_id: applications[10].id, is_read: true, read_at: notificationTime(1), created_at: notificationTime(2) },
          { org_id: demoOrg.id, user_id: user.id, type: 'offer_accepted', title: 'Offer Accepted', message: 'James Taylor accepted the offer!', entity_type: 'offer', entity_id: applications[4].id, is_read: false, created_at: notificationTime(0.3) },
          { org_id: demoOrg.id, user_id: user.id, type: 'offer_declined', title: 'Offer Declined', message: 'Candidate declined the offer', entity_type: 'offer', entity_id: applications[6].id, is_read: true, read_at: notificationTime(2), created_at: notificationTime(3) }
        );

        if (notifications.length > 0) {
          const { error: notificationsError } = await supabaseClient.from('notifications').insert(notifications);
          if (notificationsError) {
            console.error('Error inserting notifications:', notificationsError);
          } else {
            console.log('Inserted notifications:', notifications.length);
          }
        }
      }
    }

    // Link demo user to demo org and grant access
    // 1) Ensure the demo user's profile is linked to demo org
    const { error: profileUpdateError } = await supabaseClient
      .from('profiles')
      .update({ org_id: demoOrg.id })
      .eq('id', user.id);

    if (profileUpdateError) {
      console.error('Error updating demo user profile org:', profileUpdateError);
    }

    // 2) Ensure demo user has site_admin role
    const { data: roleRows, error: roleSelectError } = await supabaseClient
      .from('user_roles')
      .select('id')
      .eq('user_id', user.id)
      .eq('role', 'site_admin');

    if (roleSelectError) {
      console.error('Error checking demo user role:', roleSelectError);
    } else if (!roleRows || roleRows.length === 0) {
      const { error: roleInsertError } = await supabaseClient.from('user_roles').insert({
        user_id: user.id,
        role: 'site_admin'
      });
      if (roleInsertError) {
        console.error('Error inserting demo user role:', roleInsertError);
      }
    }

    // 3) Grant access to all demo jobs
    if (jobs && jobs.length > 0) {
      // Clear any old ACLs for user
      await supabaseClient.from('job_acl').delete().eq('user_id', user.id);

      const aclRows = jobs.map((j) => ({
        user_id: user.id,
        job_id: j.id,
        can_view: true,
        can_move_pipeline: true,
        can_message: true,
        can_view_offer: true
      }));

      const { error: aclError } = await supabaseClient.from('job_acl').insert(aclRows);
      if (aclError) {
        console.error('Error inserting job ACL for demo user:', aclError);
      }
    }

    // Insert message templates (8 comprehensive templates)
    const { error: templatesError } = await supabaseClient.from('message_templates').insert([
      {
        org_id: demoOrg.id,
        name: 'Application Confirmation',
        subject: 'Application Received - {{job_title}}',
        body_html: '<div style="font-family: Arial, sans-serif;"><p>Dear {{candidate_name}},</p><p>Thank you for applying for the <strong>{{job_title}}</strong> position at our company. We have received your application and our team will review it carefully.</p><p>You will hear from us within 5-7 business days regarding the next steps.</p><p>Best regards,<br>The Hiring Team</p></div>',
        variables: ['candidate_name', 'job_title']
      },
      {
        org_id: demoOrg.id,
        name: 'Interview Invitation',
        subject: 'Interview Invitation - {{job_title}}',
        body_html: '<div style="font-family: Arial, sans-serif;"><p>Dear {{candidate_name}},</p><p>We are pleased to invite you for an interview for the <strong>{{job_title}}</strong> position.</p><p><strong>Interview Details:</strong></p><ul><li>Date: {{interview_date}}</li><li>Time: {{interview_time}}</li><li>Location: {{interview_location}}</li></ul><p>Please confirm your availability by replying to this email.</p><p>We look forward to speaking with you!</p><p>Best regards,<br>The Hiring Team</p></div>',
        variables: ['candidate_name', 'job_title', 'interview_date', 'interview_time', 'interview_location']
      },
      {
        org_id: demoOrg.id,
        name: 'Rejection Notice',
        subject: 'Re: {{job_title}} Application',
        body_html: '<div style="font-family: Arial, sans-serif;"><p>Dear {{candidate_name}},</p><p>Thank you for your interest in the <strong>{{job_title}}</strong> position and for taking the time to go through our interview process.</p><p>After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match our current needs.</p><p>We appreciate your interest in our company and wish you the best in your job search.</p><p>Sincerely,<br>The Hiring Team</p></div>',
        variables: ['candidate_name', 'job_title']
      },
      {
        org_id: demoOrg.id,
        name: 'Offer Letter',
        subject: 'Job Offer - {{job_title}}',
        body_html: '<div style="font-family: Arial, sans-serif;"><p>Dear {{candidate_name}},</p><p>We are delighted to offer you the position of <strong>{{job_title}}</strong> at our company!</p><p>Please find attached the formal offer letter with all the details including compensation, benefits, and start date.</p><p>This offer is valid until {{expiration_date}}. Please review the attached document and let us know if you have any questions.</p><p>We are excited about the possibility of you joining our team!</p><p>Best regards,<br>The Hiring Team</p></div>',
        variables: ['candidate_name', 'job_title', 'expiration_date']
      },
      {
        org_id: demoOrg.id,
        name: 'Follow-up Reminder',
        subject: 'Following up on your application - {{job_title}}',
        body_html: '<div style="font-family: Arial, sans-serif;"><p>Dear {{candidate_name}},</p><p>We wanted to follow up on your application for the <strong>{{job_title}}</strong> position.</p><p>We are still reviewing applications and wanted to let you know that we have not forgotten about you. We will be in touch soon with an update.</p><p>Thank you for your patience!</p><p>Best regards,<br>The Hiring Team</p></div>',
        variables: ['candidate_name', 'job_title']
      },
      {
        org_id: demoOrg.id,
        name: 'Welcome Email',
        subject: 'Welcome to the Team!',
        body_html: '<div style="font-family: Arial, sans-serif;"><p>Dear {{candidate_name}},</p><p>Welcome to the team! We are thrilled to have you joining us as our new <strong>{{job_title}}</strong>.</p><p>Your start date is {{start_date}}. Please expect an email from our HR team with onboarding information and next steps.</p><p>If you have any questions before your start date, please don\'t hesitate to reach out.</p><p>We look forward to working with you!</p><p>Best regards,<br>The Team</p></div>',
        variables: ['candidate_name', 'job_title', 'start_date']
      },
      {
        org_id: demoOrg.id,
        name: 'Interview Reminder',
        subject: 'Reminder: Interview Tomorrow - {{job_title}}',
        body_html: '<div style="font-family: Arial, sans-serif;"><p>Dear {{candidate_name}},</p><p>This is a friendly reminder about your interview tomorrow for the <strong>{{job_title}}</strong> position.</p><p><strong>Interview Details:</strong></p><ul><li>Date: {{interview_date}}</li><li>Time: {{interview_time}}</li><li>Location: {{interview_location}}</li></ul><p>We look forward to seeing you!</p><p>Best regards,<br>The Hiring Team</p></div>',
        variables: ['candidate_name', 'job_title', 'interview_date', 'interview_time', 'interview_location']
      },
      {
        org_id: demoOrg.id,
        name: 'Reference Check Request',
        subject: 'Reference Check - {{candidate_name}}',
        body_html: '<div style="font-family: Arial, sans-serif;"><p>Hello,</p><p>{{candidate_name}} has applied for the <strong>{{job_title}}</strong> position at our company and has listed you as a professional reference.</p><p>Would you be willing to speak with us about your experience working with {{candidate_name}}? We would appreciate a brief conversation at your convenience.</p><p>Please let us know your availability.</p><p>Thank you,<br>The Hiring Team</p></div>',
        variables: ['candidate_name', 'job_title']
      }
    ]);

    if (templatesError) {
      console.error('Error inserting templates:', templatesError);
    } else {
      console.log('Inserted message templates: 8');
    }

    // Insert sample tasks
    const { error: tasksError } = await supabaseClient.from('tasks').insert([
      {
        org_id: demoOrg.id,
        candidate_id: candidates[0].id,
        title: 'Schedule technical interview',
        label: 'Interview',
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        created_by: user.id
      },
      {
        org_id: demoOrg.id,
        candidate_id: candidates[1].id,
        title: 'Review portfolio samples',
        label: 'Review',
        due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        created_by: user.id
      },
      {
        org_id: demoOrg.id,
        candidate_id: candidates[2].id,
        title: 'Check references',
        label: 'Background',
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        created_by: user.id
      },
      {
        org_id: demoOrg.id,
        candidate_id: candidates[3].id,
        title: 'Send coding assessment',
        label: 'Assessment',
        due_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        created_by: user.id
      },
      {
        org_id: demoOrg.id,
        candidate_id: candidates[5].id,
        title: 'Prepare offer letter',
        label: 'Offer',
        due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        created_by: user.id
      }
    ]);

    if (tasksError) {
      console.error('Error inserting tasks:', tasksError);
    } else {
      console.log('Inserted tasks: 5');
    }

    console.log('Demo data reset completed successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Demo data has been reset successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error resetting demo data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
