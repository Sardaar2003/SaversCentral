import Project from '../models/Project.js';

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
export const getProjects = async (req, res) => {
  console.log(`[DEBUG][PROJECT] Fetching projects — user: "${req.user.username}" (role: ${req.user.role})`);
  try {
    let query = {};
    // Standard users should only see enabled projects
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      query.enabled = true;
      console.log(`[DEBUG][PROJECT] Non-admin user — filtering to enabled projects only`);
    }

    const projects = await Project.find(query).sort({ name: 1 });
    console.log(`[DEBUG][PROJECT] Found ${projects.length} projects`);
    projects.forEach(p => {
      console.log(`[DEBUG][PROJECT]   → "${p.name}" (key: ${p.key}, enabled: ${p.enabled}, ID: ${p._id})`);
    });
    return res.json({ success: true, data: projects });
  } catch (error) {
    console.error('[DEBUG][PROJECT] Get projects ERROR:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new project container
// @route   POST /api/projects
// @access  Private/Admin
export const createProject = async (req, res) => {
  const { name, key } = req.body;
  console.log(`[DEBUG][PROJECT] Create project — name: "${name}", key: "${key || 'auto-generated'}"`);

  if (!name) {
    console.log(`[DEBUG][PROJECT] Create REJECTED — name is missing`);
    return res.status(400).json({ success: false, message: 'Please provide a project name' });
  }

  const generatedKey = key ? key.trim().toLowerCase() : name.replace(/\s+/g, '-').toLowerCase();
  console.log(`[DEBUG][PROJECT] Using key: "${generatedKey}"`);

  try {
    const projectExists = await Project.findOne({ name: name.trim() });
    if (projectExists) {
      console.log(`[DEBUG][PROJECT] Create REJECTED — name "${name}" already exists (ID: ${projectExists._id})`);
      return res.status(400).json({ success: false, message: 'Project name already exists' });
    }

    const keyExists = await Project.findOne({ key: generatedKey });
    if (keyExists) {
      console.log(`[DEBUG][PROJECT] Create REJECTED — key "${generatedKey}" already exists`);
      return res.status(400).json({ success: false, message: 'Project key (slug) must be unique' });
    }

    const project = await Project.create({
      name: name.trim(),
      key: generatedKey,
      enabled: true,
    });

    console.log(`[DEBUG][PROJECT] Project created successfully — ID: ${project._id}, name: "${project.name}", key: "${project.key}"`);
    return res.status(201).json({ success: true, data: project });
  } catch (error) {
    console.error('[DEBUG][PROJECT] Create project ERROR:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle project enabled/disabled status
// @route   PATCH /api/projects/:id/toggle
// @access  Private/Admin
export const toggleProject = async (req, res) => {
  console.log(`[DEBUG][PROJECT] Toggle project — ID: "${req.params.id}", by: "${req.user.username}"`);
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      console.log(`[DEBUG][PROJECT] Toggle REJECTED — project not found (ID: ${req.params.id})`);
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const oldEnabled = project.enabled;
    project.enabled = !project.enabled;
    await project.save();
    console.log(`[DEBUG][PROJECT] Toggled "${project.name}" — ${oldEnabled} → ${project.enabled}`);

    return res.json({ success: true, data: project });
  } catch (error) {
    console.error('[DEBUG][PROJECT] Toggle project ERROR:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
