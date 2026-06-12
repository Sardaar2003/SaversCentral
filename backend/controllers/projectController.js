import Project from '../models/Project.js';

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
export const getProjects = async (req, res) => {
  try {
    let query = {};
    // Standard users should only see enabled projects
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      query.enabled = true;
    }

    const projects = await Project.find(query).sort({ name: 1 });
    return res.json({ success: true, data: projects });
  } catch (error) {
    console.error('Get projects error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new project container
// @route   POST /api/projects
// @access  Private/Admin
export const createProject = async (req, res) => {
  const { name, key } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, message: 'Please provide a project name' });
  }

  const generatedKey = key ? key.trim().toLowerCase() : name.replace(/\s+/g, '-').toLowerCase();

  try {
    const projectExists = await Project.findOne({ name: name.trim() });
    if (projectExists) {
      return res.status(400).json({ success: false, message: 'Project name already exists' });
    }

    const keyExists = await Project.findOne({ key: generatedKey });
    if (keyExists) {
      return res.status(400).json({ success: false, message: 'Project key (slug) must be unique' });
    }

    const project = await Project.create({
      name: name.trim(),
      key: generatedKey,
      enabled: true,
    });

    return res.status(201).json({ success: true, data: project });
  } catch (error) {
    console.error('Create project error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle project enabled/disabled status
// @route   PATCH /api/projects/:id/toggle
// @access  Private/Admin
export const toggleProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    project.enabled = !project.enabled;
    await project.save();

    return res.json({ success: true, data: project });
  } catch (error) {
    console.error('Toggle project error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
