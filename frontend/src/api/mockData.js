/**
 * Mock data for development, testing, and offline fallback.
 */

export const mockUser = {
  id: 'usr_98412',
  name: 'Alex Chen',
  email: 'alex.chen@example.com',
  title: 'Full Stack Engineer',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  token: 'mock_jwt_token_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.resume_ai_demo_payload'
};

export const sampleParsedResume = {
  candidateName: 'Alex Chen',
  headline: 'Senior Software Engineer | React, Node.js & Cloud Architectures',
  summary: 'Full-stack developer with 5+ years of experience engineering high-throughput web applications, microservices, and distributed cloud systems. Passionate about AI integration, clean architecture, and developer productivity.',
  email: 'alex.chen@example.com',
  phone: '+1 (555) 234-5678',
  location: 'San Francisco, CA (Open to Remote)',
  skills: [
    'JavaScript', 'TypeScript', 'React.js', 'Node.js', 'Next.js', 
    'Tailwind CSS', 'Redux', 'REST APIs', 'GraphQL', 'PostgreSQL', 
    'MongoDB', 'Docker', 'AWS (S3, EC2)', 'Git', 'CI/CD Pipelines',
    'Jest', 'System Design', 'Agile/Scrum'
  ],
  categorizedSkills: {
    frontend: ['React.js', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Redux', 'HTML5/CSS3'],
    backend: ['Node.js', 'Express', 'REST APIs', 'GraphQL', 'PostgreSQL', 'MongoDB'],
    devops_cloud: ['Docker', 'AWS (S3, EC2)', 'Git', 'CI/CD Pipelines', 'Linux'],
    methodology: ['System Design', 'Agile/Scrum', 'Test-Driven Development', 'Jest']
  },
  experience: [
    {
      role: 'Senior Frontend / Full Stack Engineer',
      company: 'TechFlow Systems',
      period: '2022 - Present (2+ yrs)',
      location: 'San Francisco, CA',
      highlights: [
        'Architected real-time dashboard serving 120k+ daily active users using React, WebSockets, and Node.js.',
        'Reduced initial page load latency by 42% through code-splitting, tree-shaking, and Edge caching strategies.',
        'Mentored 4 junior engineers and spearheaded TypeScript migration across 18 micro-frontends.'
      ]
    },
    {
      role: 'Software Engineer',
      company: 'Nexus Digital Labs',
      period: '2019 - 2022 (3 yrs)',
      location: 'Seattle, WA',
      highlights: [
        'Built scalable RESTful microservices in Node.js & PostgreSQL, handling 2,000+ RPS.',
        'Integrated Stripe payments and automated billing infrastructure with zero downtime.',
        'Implemented comprehensive end-to-end testing suite improving CI deployment confidence.'
      ]
    }
  ],
  education: [
    {
      degree: 'B.S. in Computer Science',
      institution: 'University of Washington',
      year: '2015 - 2019',
      details: 'Magna Cum Laude, Focus on Distributed Systems & Algorithms'
    }
  ],
  metrics: {
    yearsOfExperience: 5,
    skillsDetectedCount: 18,
    atsCompatibilityScore: 92
  }
};

export const mockPredictedRoles = [
  {
    id: 'role_ai_app_eng',
    title: 'AI Application Engineer',
    fitScore: 94,
    matchLevel: 'Exceptional Fit',
    salaryRange: '$165,000 - $210,000',
    demandTrend: '+48% YoY',
    justification: 'Your strong proficiency in React, TypeScript, and full-stack API architecture creates a high-leverage foundation for building LLM-powered interfaces, streaming agents, and generative AI user workflows.',
    topMatchingSkills: ['TypeScript', 'React.js', 'Node.js', 'REST APIs', 'System Design'],
    primarySkillGaps: ['LangChain / LlamaIndex', 'Vector Databases (Pinecone/pgvector)', 'Prompt Engineering & Evals']
  },
  {
    id: 'role_senior_fullstack',
    title: 'Senior Full-Stack Cloud Architect',
    fitScore: 89,
    matchLevel: 'High Fit',
    salaryRange: '$170,000 - $225,000',
    demandTrend: '+28% YoY',
    justification: 'Extensive hands-on experience with Node.js, PostgreSQL, Docker, and frontend frameworks maps directly to cloud application delivery and enterprise microservice architectures.',
    topMatchingSkills: ['Node.js', 'PostgreSQL', 'Docker', 'AWS', 'System Design'],
    primarySkillGaps: ['Kubernetes (K8s)', 'Terraform (IaC)', 'Event-Driven Kafka']
  },
  {
    id: 'role_frontend_platform',
    title: 'Frontend Platform & Core UI Lead',
    fitScore: 84,
    matchLevel: 'Strong Fit',
    salaryRange: '$160,000 - $200,000',
    demandTrend: '+22% YoY',
    justification: 'Deep mastery of React, Next.js, and performance optimization positions you exceptionally well for design system scaling, build pipeline acceleration, and web vitals tuning.',
    topMatchingSkills: ['React.js', 'TypeScript', 'Next.js', 'Tailwind CSS', 'CI/CD Pipelines'],
    primarySkillGaps: ['WebAssembly (WASM)', 'Micro-Frontend Federation', 'Browser Engine Internals']
  },
  {
    id: 'role_devops_sre',
    title: 'DevOps & Reliability Engineer',
    fitScore: 76,
    matchLevel: 'Moderate Fit',
    salaryRange: '$150,000 - $190,000',
    demandTrend: '+31% YoY',
    justification: 'Solid understanding of Docker, Linux, and CI/CD provides a great stepping stone towards comprehensive infrastructure orchestration and site reliability engineering.',
    topMatchingSkills: ['Docker', 'AWS (S3, EC2)', 'Git', 'CI/CD Pipelines'],
    primarySkillGaps: ['Kubernetes Orchestration', 'Terraform / Ansible', 'Prometheus & Grafana Observability', 'Helm Charts']
  },
  {
    id: 'role_solutions_architect',
    title: 'Technical Solutions Architect',
    fitScore: 71,
    matchLevel: 'Moderate Fit',
    salaryRange: '$155,000 - $195,000',
    demandTrend: '+19% YoY',
    justification: 'Combination of full-stack engineering, client-facing presentation ability, and system design makes you competitive for pre-sales architecture and customer technical advisory.',
    topMatchingSkills: ['System Design', 'REST APIs', 'Agile/Scrum', 'GraphQL'],
    primarySkillGaps: ['Enterprise Security / SOC2', 'Cloud Well-Architected Frameworks', 'Executive Stakeholder Pitching']
  }
];

export const mockSkillGapDatabase = {
  role_ai_app_eng: {
    roleId: 'role_ai_app_eng',
    roleTitle: 'AI Application Engineer',
    matchPercentage: 78,
    benchmarkScore: 85,
    summary: 'You have a stellar frontend and API foundation. Bridging 3 key AI engineering specializations will make you top 5% candidate for AI unicorn and enterprise GenAI roles.',
    matchedSkills: [
      { name: 'TypeScript', category: 'Language', proficiency: 'Advanced' },
      { name: 'React.js', category: 'Frontend', proficiency: 'Advanced' },
      { name: 'Node.js / Express', category: 'Backend', proficiency: 'Advanced' },
      { name: 'REST APIs & Streaming', category: 'Architecture', proficiency: 'Advanced' },
      { name: 'PostgreSQL', category: 'Database', proficiency: 'Intermediate' },
      { name: 'Git & CI/CD', category: 'DevOps', proficiency: 'Intermediate' },
      { name: 'System Design', category: 'Architecture', proficiency: 'Intermediate' }
    ],
    partialSkills: [
      { name: 'Python for AI Scripting', category: 'Language', notes: 'Know JS/TS thoroughly; syntax & AI ecosystem libraries need focused ramp-up.' },
      { name: 'Docker Containerization', category: 'DevOps', notes: 'Comfortable with local Docker; need experience containerizing GPU/inference runtimes.' },
      { name: 'AWS Cloud Deployment', category: 'Cloud', notes: 'Experience with S3/EC2; need exposure to Bedrock, SageMaker, or modal GPU clouds.' }
    ],
    missingSkills: [
      { name: 'LangChain & LlamaIndex', category: 'AI Frameworks', priority: 'High', demand: 'Critical' },
      { name: 'Vector Databases (Pinecone / Qdrant / pgvector)', category: 'Data', priority: 'High', demand: 'Critical' },
      { name: 'RAG (Retrieval-Augmented Generation) Architecture', category: 'AI Architecture', priority: 'High', demand: 'Critical' },
      { name: 'Prompt Engineering & LLM Evaluations (DeepEval / Ragas)', category: 'Evaluation', priority: 'Medium', demand: 'High' },
      { name: 'Function Calling & Autonomous Tool-Using Agents', category: 'AI Agents', priority: 'High', demand: 'High' }
    ]
  },
  role_senior_fullstack: {
    roleId: 'role_senior_fullstack',
    roleTitle: 'Senior Full-Stack Cloud Architect',
    matchPercentage: 82,
    benchmarkScore: 88,
    summary: 'Your core development skills are virtually complete. Adding cloud infrastructure automation and distributed event streaming will complete your architect portfolio.',
    matchedSkills: [
      { name: 'React.js & Next.js', category: 'Frontend', proficiency: 'Advanced' },
      { name: 'Node.js & TypeScript', category: 'Backend', proficiency: 'Advanced' },
      { name: 'PostgreSQL & Database Modeling', category: 'Database', proficiency: 'Advanced' },
      { name: 'REST & GraphQL APIs', category: 'Architecture', proficiency: 'Advanced' },
      { name: 'Docker', category: 'DevOps', proficiency: 'Intermediate' }
    ],
    partialSkills: [
      { name: 'AWS Solutions Architecture', category: 'Cloud', notes: 'Familiar with core services; need IAM deep dive and VPC networking.' },
      { name: 'Redis Caching & PubSub', category: 'Backend', notes: 'Basic key-value caching knowledge; need distributed lock patterns.' }
    ],
    missingSkills: [
      { name: 'Kubernetes (EKS / GKE)', category: 'Cloud', priority: 'High', demand: 'Critical' },
      { name: 'Terraform Infrastructure as Code', category: 'DevOps', priority: 'High', demand: 'High' },
      { name: 'Apache Kafka / RabbitMQ Event Streams', category: 'Distributed Systems', priority: 'High', demand: 'High' },
      { name: 'Observability (OpenTelemetry & Datadog)', category: 'Monitoring', priority: 'Medium', demand: 'Medium' }
    ]
  },
  default: {
    roleId: 'role_custom',
    roleTitle: 'Target Career Role',
    matchPercentage: 75,
    benchmarkScore: 80,
    summary: 'Strong foundational baseline with actionable growth opportunities to achieve role mastery.',
    matchedSkills: [
      { name: 'JavaScript & TypeScript', category: 'Language', proficiency: 'Advanced' },
      { name: 'React.js UI Engineering', category: 'Frontend', proficiency: 'Advanced' },
      { name: 'API Design & Integration', category: 'Backend', proficiency: 'Advanced' },
      { name: 'Version Control & Git', category: 'Workflow', proficiency: 'Advanced' }
    ],
    partialSkills: [
      { name: 'Cloud Services (AWS / GCP)', category: 'Cloud', notes: 'Core familiarity present; advanced provisioning needed.' },
      { name: 'Automated Testing & QA', category: 'Testing', notes: 'Unit testing practiced; integration/e2e tests need expansion.' }
    ],
    missingSkills: [
      { name: 'Enterprise Architecture Patterns', category: 'Architecture', priority: 'High', demand: 'High' },
      { name: 'Scalable Microservices Orchestration', category: 'Infrastructure', priority: 'High', demand: 'Critical' },
      { name: 'Performance Optimization & Web Vitals', category: 'Optimization', priority: 'Medium', demand: 'High' }
    ]
  }
};

export const mockRoadmapData = {
  role_ai_app_eng: {
    roleTitle: 'AI Application Engineer',
    targetTimeline: '12-16 Weeks (Paced)',
    totalCourses: 7,
    phases: [
      {
        id: 'phase_1',
        phaseNumber: 1,
        title: 'Phase 1: Foundation',
        name: 'AI Engineering Core & Vector Foundations',
        duration: 'Weeks 1 - 4 (4 Weeks)',
        theme: 'foundation', // maps to phase-foundation tokens (Blue)
        description: 'Establish foundational Python competence, master OpenAI/Anthropic APIs, and understand embeddings and vector similarity indexing.',
        skills: [
          { id: 's1', name: 'Master Python syntax, async/await, and Pydantic data modeling', completed: false },
          { id: 's2', name: 'Connect to LLM APIs (OpenAI, Anthropic Claude) with streaming responses', completed: false },
          { id: 's3', name: 'Understand embeddings, cosine distance, and chunking strategies', completed: false },
          { id: 's4', name: 'Deploy a Pinecone / pgvector vector store for semantic search', completed: false }
        ],
        courses: [
          {
            id: 'c1',
            title: 'ChatGPT & OpenAI API: Building Full-Stack AI Apps',
            platform: 'Coursera',
            provider: 'DeepLearning.AI',
            level: 'Beginner to Intermediate',
            duration: '12 hours',
            rating: 4.9,
            url: 'https://www.deeplearning.ai/short-courses/'
          },
          {
            id: 'c2',
            title: 'Vector Databases & Semantic Search in Practice',
            platform: 'Udemy',
            provider: 'Pinecone Academy',
            level: 'Intermediate',
            duration: '8 hours',
            rating: 4.8,
            url: 'https://www.pinecone.io/learn/'
          }
        ]
      },
      {
        id: 'phase_2',
        phaseNumber: 2,
        title: 'Phase 2: Intermediate',
        name: 'RAG Architectures, LangChain & Agent Workflows',
        duration: 'Weeks 5 - 10 (6 Weeks)',
        theme: 'intermediate', // maps to phase-intermediate tokens (Purple)
        description: 'Build enterprise-grade Retrieval-Augmented Generation (RAG) pipelines, implement tool-calling autonomous agents, and orchestrate memory.',
        skills: [
          { id: 's5', name: 'Build Hybrid Search RAG pipelines with LangChain and LlamaIndex', completed: false },
          { id: 's6', name: 'Implement Function Calling & Multi-Agent orchestration with LangGraph', completed: false },
          { id: 's7', name: 'Design conversation memory stores using Redis and vector lookups', completed: false },
          { id: 's8', name: 'Implement streaming UI components in React with AI SDK (Vercel)', completed: false }
        ],
        courses: [
          {
            id: 'c3',
            title: 'Building Agentic RAG with LlamaIndex & LangChain',
            platform: 'DeepLearning.AI',
            provider: 'Harrison Chase & Jerry Liu',
            level: 'Intermediate',
            duration: '15 hours',
            rating: 4.95,
            url: 'https://www.deeplearning.ai/short-courses/building-agentic-rag-with-llamaindex/'
          },
          {
            id: 'c4',
            title: 'Full-Stack GenAI Applications with React & Next.js AI SDK',
            platform: 'Frontend Masters',
            provider: 'Vercel Engineering Team',
            level: 'Advanced',
            duration: '10 hours',
            rating: 4.9,
            url: 'https://frontendmasters.com/courses/next-ai/'
          }
        ]
      },
      {
        id: 'phase_3',
        phaseNumber: 3,
        title: 'Phase 3: Advanced',
        name: 'LLM Evaluation, Production Guardrails & Scale',
        duration: 'Weeks 11 - 16 (6 Weeks)',
        theme: 'advanced', // maps to phase-advanced tokens (Green)
        description: 'Implement rigorous evaluation metrics (Ragas, DeepEval), latency caching, safety guardrails (NeMo), and cost-efficient production deployments.',
        skills: [
          { id: 's9', name: 'Setup automated CI evaluation benchmarks with DeepEval & Ragas', completed: false },
          { id: 's10', name: 'Implement semantic prompt caching (GPTCache) to cut API bills by 60%', completed: false },
          { id: 's11', name: 'Add hallucination detection, PII masking, and guardrail filters', completed: false },
          { id: 's12', name: 'Deploy self-hosted vLLM or Ollama inference endpoints on cloud GPUs', completed: false }
        ],
        courses: [
          {
            id: 'c5',
            title: 'Evaluating and Debugging Generative AI Models in Production',
            platform: 'edX / Harvard',
            provider: 'Harvard Online',
            level: 'Advanced',
            duration: '18 hours',
            rating: 4.85,
            url: 'https://www.edx.org/'
          },
          {
            id: 'c6',
            title: 'LLMOps: Deploying and Monitoring AI Applications at Scale',
            platform: 'Coursera',
            provider: 'Duke University',
            level: 'Advanced',
            duration: '22 hours',
            rating: 4.9,
            url: 'https://www.coursera.org/learn/llmops'
          }
        ]
      }
    ]
  },
  default: {
    roleTitle: 'Tailored Career Mastery Roadmap',
    targetTimeline: '12 Weeks',
    totalCourses: 6,
    phases: [
      {
        id: 'phase_1',
        phaseNumber: 1,
        title: 'Phase 1: Foundation',
        name: 'Core Architecture & Skill Reinforcement',
        duration: 'Weeks 1 - 4 (4 Weeks)',
        theme: 'foundation',
        description: 'Fill critical syntax, patterns, and fundamental tooling gaps required for high-velocity development.',
        skills: [
          { id: 's1', name: 'Master deep architecture patterns and design paradigms', completed: false },
          { id: 's2', name: 'Refactor legacy codebases to type-safe and modular standards', completed: false },
          { id: 's3', name: 'Implement strict linting, test harnesses, and automated validation', completed: false }
        ],
        courses: [
          {
            id: 'c1',
            title: 'Modern Software Architecture: Patterns and Practices',
            platform: 'Coursera',
            provider: 'University of Alberta',
            level: 'Intermediate',
            duration: '14 hours',
            rating: 4.8,
            url: 'https://www.coursera.org/'
          }
        ]
      },
      {
        id: 'phase_2',
        phaseNumber: 2,
        title: 'Phase 2: Intermediate',
        name: 'System Scale & Distributed Services',
        duration: 'Weeks 5 - 8 (4 Weeks)',
        theme: 'intermediate',
        description: 'Design distributed architectures, asynchronous message queues, and high-performance microservices.',
        skills: [
          { id: 's4', name: 'Design distributed microservices with event streaming', completed: false },
          { id: 's5', name: 'Implement high-concurrency database queries and indexing', completed: false },
          { id: 's6', name: 'Configure automated CI/CD deployment pipelines with zero downtime', completed: false }
        ],
        courses: [
          {
            id: 'c2',
            title: 'Distributed Systems & Microservices Masterclass',
            platform: 'Udemy',
            provider: 'Cloud Native Academy',
            level: 'Advanced',
            duration: '20 hours',
            rating: 4.9,
            url: 'https://www.udemy.com/'
          }
        ]
      },
      {
        id: 'phase_3',
        phaseNumber: 3,
        title: 'Phase 3: Advanced',
        name: 'Production Observability & Leadership Engineering',
        duration: 'Weeks 9 - 12 (4 Weeks)',
        theme: 'advanced',
        description: 'Lead technical architectures, enforce telemetry/observability, and optimize cost & latency.',
        skills: [
          { id: 's7', name: 'Deploy OpenTelemetry tracing and distributed logging', completed: false },
          { id: 's8', name: 'Conduct high-impact system design reviews and security audits', completed: false },
          { id: 's9', name: 'Prepare capstone portfolio project aligned to target role requirements', completed: false }
        ],
        courses: [
          {
            id: 'c3',
            title: 'Enterprise Cloud Architecture & Observability',
            platform: 'Pluralsight',
            provider: 'Enterprise Cloud Institute',
            level: 'Advanced',
            duration: '16 hours',
            rating: 4.85,
            url: 'https://www.pluralsight.com/'
          }
        ]
      }
    ]
  }
};
