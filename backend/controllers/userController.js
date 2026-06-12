import User from '../models/User.js';
import Team from '../models/Team.js';

// ==========================================
// User Administration
// ==========================================

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').populate('team');
    return res.json({ success: true, data: users });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user status (active/inactive)
// @route   PATCH /api/users/:id/status
// @access  Private/Admin
export const updateUserStatus = async (req, res) => {
  const { status } = req.body;
  if (!['active', 'inactive'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status value' });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.status = status;
    await user.save();

    return res.json({ success: true, message: `User status updated to ${status}`, data: user });
  } catch (error) {
    console.error('Update status error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user role
// @route   PATCH /api/users/:id/role
// @access  Private/Admin
export const updateUserRole = async (req, res) => {
  const { role } = req.body;
  if (!['admin', 'manager', 'user'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role value' });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.role = role;
    // If the role becomes admin or manager, they shouldn't belong to a team as a member
    if (role !== 'user') {
      user.team = undefined;
    }
    await user.save();

    return res.json({ success: true, message: `User role updated to ${role}`, data: user });
  } catch (error) {
    console.error('Update role error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// Team Administration
// ==========================================

// @desc    Get all teams
// @route   GET /api/users/teams
// @access  Private/Admin
export const getTeams = async (req, res) => {
  try {
    const teams = await Team.find({})
      .populate('manager', 'name username')
      .populate('members', 'name username status');
    return res.json({ success: true, data: teams });
  } catch (error) {
    console.error('Get teams error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new team
// @route   POST /api/users/teams
// @access  Private/Admin
export const createTeam = async (req, res) => {
  const { name, managerId, memberIds } = req.body;

  if (!name || !managerId) {
    return res.status(400).json({ success: false, message: 'Please provide team name and manager ID' });
  }

  try {
    const teamExists = await Team.findOne({ name });
    if (teamExists) {
      return res.status(400).json({ success: false, message: 'Team name already exists' });
    }

    // Verify manager exists and has manager role
    const manager = await User.findById(managerId);
    if (!manager || manager.role !== 'manager') {
      return res.status(400).json({ success: false, message: 'Selected user is not a valid Manager' });
    }

    const team = await Team.create({
      name,
      manager: managerId,
      members: memberIds || [],
    });

    // Update members to reference this team
    if (memberIds && memberIds.length > 0) {
      await User.updateMany(
        { _id: { $in: memberIds } },
        { team: team._id }
      );
    }

    const populatedTeam = await Team.findById(team._id)
      .populate('manager', 'name username')
      .populate('members', 'name username status');

    return res.status(201).json({ success: true, data: populatedTeam });
  } catch (error) {
    console.error('Create team error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a team
// @route   PUT /api/users/teams/:id
// @access  Private/Admin
export const updateTeam = async (req, res) => {
  const { name, managerId, memberIds } = req.body;

  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    if (name) team.name = name;
    if (managerId) {
      const manager = await User.findById(managerId);
      if (!manager || manager.role !== 'manager') {
        return res.status(400).json({ success: false, message: 'Selected user is not a valid Manager' });
      }
      team.manager = managerId;
    }

    if (memberIds) {
      // Find old members to remove the team link
      const oldMembers = team.members.map(m => m.toString());
      const newMembers = memberIds.map(m => m.toString());
      
      const removedMembers = oldMembers.filter(m => !newMembers.includes(m));
      
      // Remove team reference from removed members
      if (removedMembers.length > 0) {
        await User.updateMany(
          { _id: { $in: removedMembers } },
          { $unset: { team: '' } }
        );
      }

      team.members = memberIds;

      // Add team reference to new members
      if (memberIds.length > 0) {
        await User.updateMany(
          { _id: { $in: memberIds } },
          { team: team._id }
        );
      }
    }

    await team.save();

    const populatedTeam = await Team.findById(team._id)
      .populate('manager', 'name username')
      .populate('members', 'name username status');

    return res.json({ success: true, data: populatedTeam });
  } catch (error) {
    console.error('Update team error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a team
// @route   DELETE /api/users/teams/:id
// @access  Private/Admin
export const deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    // Remove team reference from all members
    await User.updateMany(
      { team: team._id },
      { $unset: { team: '' } }
    );

    await Team.findByIdAndDelete(req.params.id);

    return res.json({ success: true, message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Delete team error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent admin from deleting themselves
    if (String(userId) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // If they are a member of a team, pull them from the team's member list
    if (user.team) {
      await Team.updateOne(
        { _id: user.team },
        { $pull: { members: userId } }
      );
    }

    // If they are a manager of any team, unset the team's manager field
    await Team.updateMany(
      { manager: userId },
      { $unset: { manager: '' } }
    );

    await User.findByIdAndDelete(userId);

    return res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

