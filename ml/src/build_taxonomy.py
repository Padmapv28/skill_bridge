import json

skills = set()

programming_languages = [
    "Python", "Java", "JavaScript", "TypeScript", "C", "C++", "C#", "Go", "Rust",
    "Ruby", "PHP", "Swift", "Kotlin", "R", "MATLAB", "Scala", "Perl", "Objective-C",
    "Dart", "Lua", "Haskell", "Julia", "Shell Scripting", "Bash", "PowerShell",
    "SQL", "VBA", "Assembly", "COBOL", "Fortran", "Groovy", "Elixir", "Clojure",
    "F#", "Erlang", "Solidity", "Prolog", "Racket", "OCaml", "Nim", "Crystal",
    "Zig", "Ada", "Scheme", "ActionScript", "Delphi", "Visual Basic",
]

web_frontend = [
    "HTML", "HTML5", "CSS", "CSS3", "Sass", "LESS", "React", "React Native",
    "Angular", "AngularJS", "Vue.js", "Svelte", "Next.js", "Nuxt.js", "jQuery",
    "Bootstrap", "Tailwind CSS", "Redux", "MobX", "Webpack", "Vite", "Babel",
    "GraphQL", "REST API", "RESTful APIs", "WebSockets", "Three.js", "D3.js",
    "Figma", "Adobe XD", "Sketch", "Material UI", "Chakra UI", "Ant Design",
    "Progressive Web Apps", "Responsive Design", "Web Accessibility", "SEO Optimization",
    "Web Components", "Storybook", "Gatsby", "Remix", "Astro", "Alpine.js",
]

backend_frameworks = [
    "Node.js", "Express.js", "Django", "Django REST Framework", "Flask", "FastAPI",
    "Spring Boot", "Spring Framework", "Spring MVC", "ASP.NET", ".NET Core",
    "Ruby on Rails", "Laravel", "Symfony", "NestJS", "gRPC", "Microservices",
    "Serverless", "Koa.js", "Hapi.js", "CodeIgniter", "CakePHP", "Phoenix Framework",
    "Actix", "Gin", "Echo", "SOAP", "API Gateway", "Service Mesh", "Message Queues",
    "RabbitMQ", "ActiveMQ", "Apache Kafka", "Event-Driven Architecture",
]

databases = [
    "SQL", "MySQL", "PostgreSQL", "SQLite", "MongoDB", "Redis", "Cassandra",
    "Oracle Database", "Microsoft SQL Server", "DynamoDB", "Firebase",
    "Firestore", "Elasticsearch", "Neo4j", "MariaDB", "Snowflake", "BigQuery",
    "Supabase", "CouchDB", "InfluxDB", "TimescaleDB", "CockroachDB",
    "Database Design", "Database Administration", "Query Optimization",
    "Data Modeling", "NoSQL", "OLAP", "OLTP", "Stored Procedures", "Indexing",
]

cloud_devops = [
    "AWS", "Amazon Web Services", "Azure", "Microsoft Azure", "Google Cloud Platform",
    "GCP", "Docker", "Kubernetes", "Terraform", "Jenkins", "CI/CD",
    "GitHub Actions", "GitLab CI", "CircleCI", "Travis CI", "Ansible", "Chef",
    "Puppet", "Nginx", "Apache", "Linux", "Unix", "Windows Server", "VMware",
    "OpenShift", "CloudFormation", "Prometheus", "Grafana", "Datadog", "Splunk",
    "ELK Stack", "Logstash", "Kibana", "Git", "GitHub", "GitLab", "Bitbucket",
    "Jira", "Confluence", "Agile", "Scrum", "Kanban", "DevOps",
    "Site Reliability Engineering", "Infrastructure as Code", "Load Balancing",
    "Auto Scaling", "Container Orchestration", "Helm", "Istio", "Vagrant",
    "AWS Lambda", "AWS EC2", "AWS S3", "AWS RDS", "Azure DevOps", "Cloud Security",
    "Multi-Cloud Architecture", "Disaster Recovery", "System Administration",
]

data_ml = [
    "Machine Learning", "Deep Learning", "Natural Language Processing",
    "Computer Vision", "Reinforcement Learning", "Neural Networks",
    "TensorFlow", "PyTorch", "Keras", "scikit-learn", "XGBoost", "LightGBM",
    "CatBoost", "Pandas", "NumPy", "SciPy", "Matplotlib", "Seaborn", "Plotly",
    "Jupyter", "Apache Spark", "PySpark", "Hadoop", "Airflow", "Kafka", "dbt",
    "Tableau", "Power BI", "Looker", "Data Visualization", "Statistical Analysis",
    "A/B Testing", "Feature Engineering", "Data Cleaning", "ETL", "ELT",
    "Big Data", "Data Warehousing", "Data Modeling", "Time Series Analysis",
    "Recommendation Systems", "Random Forest", "Gradient Boosting",
    "Convolutional Neural Networks", "Recurrent Neural Networks", "Transformers",
    "Large Language Models", "Hugging Face", "OpenCV", "NLTK", "spaCy", "MLOps",
    "Model Deployment", "Model Monitoring", "Feature Stores", "Vector Databases",
    "Prompt Engineering", "Generative AI", "GANs", "Bayesian Statistics",
    "Hypothesis Testing", "Regression Analysis", "Clustering", "Classification",
    "Dimensionality Reduction", "Anomaly Detection", "Predictive Modeling",
    "Data Mining", "Business Intelligence", "Quantitative Analysis", "R Studio",
    "SAS", "SPSS", "Google Colab", "Weights & Biases", "MLflow", "Kubeflow",
]

mobile = [
    "iOS Development", "Android Development", "Flutter", "SwiftUI", "Xamarin",
    "Ionic", "Cordova", "Mobile App Development", "Jetpack Compose", "Kotlin Multiplatform",
    "App Store Optimization", "Firebase Cloud Messaging", "Mobile UI Design",
]

design_tools = [
    "Adobe Photoshop", "Adobe Illustrator", "Adobe InDesign", "Adobe Premiere Pro",
    "Adobe After Effects", "Adobe Lightroom", "Canva", "UI/UX Design", "Wireframing",
    "Prototyping", "User Research", "Usability Testing", "Graphic Design",
    "AutoCAD", "SolidWorks", "CATIA", "SketchUp", "Revit", "ANSYS",
    "MATLAB Simulink", "STAAD.Pro", "Blender", "3ds Max", "Unity", "Unreal Engine",
    "Motion Graphics", "Video Editing", "Photography", "Typography", "Brand Design",
    "Design Systems", "Interaction Design", "Information Architecture",
]

business_tools = [
    "Microsoft Excel", "Microsoft Word", "Microsoft PowerPoint", "Google Sheets",
    "Google Docs", "Google Slides", "Salesforce", "SAP", "HubSpot", "Zendesk",
    "QuickBooks", "Financial Modeling", "Financial Analysis", "Market Research",
    "SEO", "SEM", "Google Analytics", "Google Ads", "Facebook Ads", "Content Strategy",
    "Digital Marketing", "Social Media Marketing", "Email Marketing", "Copywriting",
    "Project Management", "Business Analysis", "Product Management", "Product Strategy",
    "Stakeholder Management", "Grant Writing", "Budgeting", "Forecasting",
    "Supply Chain Management", "Inventory Management", "Procurement",
    "Vendor Management", "Contract Negotiation", "Sales Strategy", "CRM",
    "Customer Success", "Business Development", "Competitive Analysis",
    "Go-to-Market Strategy", "OKRs", "KPI Tracking", "Risk Management",
    "Change Management", "Process Improvement", "Lean Six Sigma", "ERP Systems",
]

soft_skills = [
    "Leadership", "Communication", "Teamwork", "Problem Solving",
    "Critical Thinking", "Time Management", "Public Speaking",
    "Negotiation", "Adaptability", "Creativity", "Collaboration",
    "Conflict Resolution", "Mentoring", "Decision Making", "Attention to Detail",
    "Emotional Intelligence", "Active Listening", "Presentation Skills",
    "Cross-functional Collaboration", "Strategic Thinking", "Analytical Thinking",
    "Interpersonal Skills", "Multitasking", "Self-motivation", "Empathy",
]

testing_qa = [
    "Unit Testing", "Integration Testing", "Test-Driven Development",
    "Behavior-Driven Development", "Selenium", "Cypress", "Jest", "Pytest",
    "JUnit", "Mocha", "Postman", "Quality Assurance", "Manual Testing",
    "Automated Testing", "Performance Testing", "Load Testing", "Regression Testing",
    "API Testing", "Mobile Testing", "Test Case Design", "Bug Tracking",
]

security = [
    "Cybersecurity", "Penetration Testing", "Network Security", "OWASP",
    "Encryption", "Identity and Access Management", "SIEM", "Vulnerability Assessment",
    "Ethical Hacking", "Threat Modeling", "Security Auditing", "Firewall Configuration",
    "Incident Response", "Zero Trust Architecture", "SOC Operations",
]

civil_mechanical = [
    "Structural Analysis", "Thermodynamics", "Fluid Mechanics",
    "Manufacturing Processes", "CAD Modelling", "Tolerance Analysis",
    "Geotechnical Engineering", "Environmental Engineering", "EPA SWMM",
    "Renewable Energy Systems", "Six Sigma", "Quality Control", "CATIA V5",
    "Structural Design", "Water and Sanitation Systems", "Site Supervision",
    "Heat Transfer", "Mechanics of Materials", "Machine Design", "HVAC Systems",
    "Prototyping", "Thermal System Design", "Solar Energy Systems",
    "Construction Management", "Building Information Modeling", "Surveying",
    "Concrete Technology", "Transportation Engineering", "Water Resources Engineering",
]

electrical_electronics = [
    "Circuit Design", "PCB Design", "Embedded Systems", "Microcontrollers",
    "Arduino", "Raspberry Pi", "VLSI Design", "Signal Processing", "Control Systems",
    "Power Systems", "FPGA Programming", "Verilog", "VHDL", "IoT",
    "Robotics", "PLC Programming", "SCADA",
]

certifications_like = [
    "AWS Certified Solutions Architect", "AWS Certified Developer",
    "Certified Kubernetes Administrator", "PMP", "Scrum Master Certified",
    "Google Cloud Professional", "CompTIA Security+", "CISSP",
    "Google Analytics Certified", "TensorFlow Developer Certificate",
    "LEED Green Associate", "Six Sigma Yellow Belt", "Six Sigma Green Belt",
    "ITIL Foundation", "CFA", "CPA", "Chartered Accountant",
]

languages_spoken = [
    "English", "Hindi", "Spanish", "French", "German", "Mandarin", "Japanese",
    "Tamil", "Telugu", "Kannada", "Marathi", "Bengali", "Gujarati", "Punjabi",
]

for group in [programming_languages, web_frontend, backend_frameworks, databases,
              cloud_devops, data_ml, mobile, design_tools, business_tools,
              soft_skills, testing_qa, security, civil_mechanical,
              electrical_electronics, certifications_like, languages_spoken]:
    skills.update(group)

skills_list = sorted(skills)

with open(r"C:\Users\Anushree K V\ml\data\skills_taxonomy.json", "w") as f:
    json.dump(skills_list, f, indent=2)

print(f"Total skills in taxonomy: {len(skills_list)}")
