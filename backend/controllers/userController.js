import User from '../models/User.js';
import Team from '../models/Team.js';

// ==========================================
// User Administration
// ==========================================

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req, res) => {
  console.log(`[DEBUG][USER] Fetching all users — requested by "${req.user.username}" (role: ${req.user.role})`);
  try {
    const users = await User.find({}).select('-password').populate('team');
    console.log(`[DEBUG][USER] Found ${users.length} users`);
    users.forEach(u => {
      console.log(`[DEBUG][USER]   → ${u.username} | role: ${u.role} | status: ${u.status} | team: ${u.team?.name || 'none'}`);
    });
    return res.json({ success: true, data: users });
  } catch (error) {
    console.error('[DEBUG][USER] Get users ERROR:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user status (active/inactive)
// @route   PATCH /api/users/:id/status
// @access  Private/Admin
export const updateUserStatus = async (req, res) => {
  const { status } = req.body;
  console.log(`[DEBUG][USER] Status update — targetId: "${req.params.id}", newStatus: "${status}", by: "${req.user.username}"`);

  if (!['active', 'inactive'].includes(status)) {
    console.log(`[DEBUG][USER] Status update REJECTED — invalid status value: "${status}"`);
    return res.status(400).json({ success: false, message: 'Invalid status value' });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      console.log(`[DEBUG][USER] Status update REJECTED — user not found (ID: ${req.params.id})`);
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const oldStatus = user.status;
    user.status = status;
    await user.save();
    console.log(`[DEBUG][USER] Status updated: "${user.username}" — ${oldStatus} → ${status}`);

    return res.json({ success: true, message: `User status updated to ${status}`, data: user });
  } catch (error) {
    console.error('[DEBUG][USER] Update status ERROR:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user role
// @route   PATCH /api/users/:id/role
// @access  Private/Admin
export const updateUserRole = async (req, res) => {
  const { role } = req.body;
  console.log(`[DEBUG][USER] Role update — targetId: "${req.params.id}", newRole: "${role}", by: "${req.user.username}"`);

  if (!['admin', 'manager', 'user'].includes(role)) {
    console.log(`[DEBUG][USER] Role update REJECTED — invalid role value: "${role}"`);
    return res.status(400).json({ success: false, message: 'Invalid role value' });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      console.log(`[DEBUG][USER] Role update REJECTED — user not found (ID: ${req.params.id})`);
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const oldRole = user.role;
    user.role = role;
    // If the role becomes admin or manager, they shouldn't belong to a team as a member
    if (role !== 'user') {
      user.team = undefined;
      console.log(`[DEBUG][USER] Cleared team assignment (new role is "${role}")`);
    }
    await user.save();
    console.log(`[DEBUG][USER] Role updated: "${user.username}" — ${oldRole} → ${role}`);

    return res.json({ success: true, message: `User role updated to ${role}`, data: user });
  } catch (error) {
    console.error('[DEBUG][USER] Update role ERROR:', error);
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
  console.log(`[DEBUG][TEAM] Fetching all teams — requested by "${req.user.username}"`);
  try {
    const teams = await Team.find({})
      .populate('manager', 'name username')
      .populate('members', 'name username status');
    console.log(`[DEBUG][TEAM] Found ${teams.length} teams`);
    teams.forEach(t => {
      console.log(`[DEBUG][TEAM]   → "${t.name}" | manager: ${t.manager?.username || 'unset'} | members: ${t.members.length}`);
    });
    return res.json({ success: true, data: teams });
  } catch (error) {
    console.error('[DEBUG][TEAM] Get teams ERROR:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new team
// @route   POST /api/users/teams
// @access  Private/Admin
export const createTeam = async (req, res) => {
  const { name, managerId, memberIds } = req.body;
  console.log(`[DEBUG][TEAM] Create team — name: "${name}", managerId: "${managerId}", memberIds: [${memberIds?.join(', ') || ''}]`);

  if (!name || !managerId) {
    console.log(`[DEBUG][TEAM] Create team REJECTED — missing name or managerId`);
    return res.status(400).json({ success: false, message: 'Please provide team name and manager ID' });
  }

  try {
    const teamExists = await Team.findOne({ name });
    if (teamExists) {
      console.log(`[DEBUG][TEAM] Create team REJECTED — name "${name}" already exists`);
      return res.status(400).json({ success: false, message: 'Team name already exists' });
    }

    // Verify manager exists and has manager role
    const manager = await User.findById(managerId);
    if (!manager || manager.role !== 'manager') {
      console.log(`[DEBUG][TEAM] Create team REJECTED — user "${managerId}" is not a valid manager (role: ${manager?.role || 'NOT FOUND'})`);
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
      console.log(`[DEBUG][TEAM] Assigned ${memberIds.length} members to team "${name}"`);
    }

    const populatedTeam = await Team.findById(team._id)
      .populate('manager', 'name username')
      .populate('members', 'name username status');

    console.log(`[DEBUG][TEAM] Team created successfully — ID: ${team._id}, name: "${name}"`);
    return res.status(201).json({ success: true, data: populatedTeam });
  } catch (error) {
    console.error('[DEBUG][TEAM] Create team ERROR:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a team
// @route   PUT /api/users/teams/:id
// @access  Private/Admin
export const updateTeam = async (req, res) => {
  const { name, managerId, memberIds } = req.body;
  console.log(`[DEBUG][TEAM] Update team — ID: "${req.params.id}", name: "${name || 'unchanged'}", managerId: "${managerId || 'unchanged'}", memberIds: ${memberIds ? `[${memberIds.join(', ')}]` : 'unchanged'}`);

  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      console.log(`[DEBUG][TEAM] Update team REJECTED — team not found (ID: ${req.params.id})`);
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    if (name) team.name = name;
    if (managerId) {
      const manager = await User.findById(managerId);
      if (!manager || manager.role !== 'manager') {
        console.log(`[DEBUG][TEAM] Update team REJECTED — user "${managerId}" is not a valid manager`);
        return res.status(400).json({ success: false, message: 'Selected user is not a valid Manager' });
      }
      team.manager = managerId;
    }

    if (memberIds) {
      // Find old members to remove the team link
      const oldMembers = team.members.map(m => m.toString());
      const newMembers = memberIds.map(m => m.toString());
      
      const removedMembers = oldMembers.filter(m => !newMembers.includes(m));
      const addedMembers = newMembers.filter(m => !oldMembers.includes(m));
      console.log(`[DEBUG][TEAM] Members diff — removed: [${removedMembers.join(', ')}], added: [${addedMembers.join(', ')}]`);
      
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

    console.log(`[DEBUG][TEAM] Team updated successfully — "${team.name}"`);
    return res.json({ success: true, data: populatedTeam });
  } catch (error) {
    console.error('[DEBUG][TEAM] Update team ERROR:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a team
// @route   DELETE /api/users/teams/:id
// @access  Private/Admin
export const deleteTeam = async (req, res) => {
  console.log(`[DEBUG][TEAM] Delete team — ID: "${req.params.id}", by: "${req.user.username}"`);
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      console.log(`[DEBUG][TEAM] Delete team REJECTED — team not found (ID: ${req.params.id})`);
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    // Remove team reference from all members
    const updateResult = await User.updateMany(
      { team: team._id },
      { $unset: { team: '' } }
    );
    console.log(`[DEBUG][TEAM] Cleared team reference from ${updateResult.modifiedCount} members`);

    await Team.findByIdAndDelete(req.params.id);

    console.log(`[DEBUG][TEAM] Team deleted: "${team.name}" (ID: ${req.params.id})`);
    return res.json({ success: true, message: 'Team deleted successfully' });
  } catch (error) {
    console.error('[DEBUG][TEAM] Delete team ERROR:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  const userId = req.params.id;
  console.log(`[DEBUG][USER] Delete user — targetId: "${userId}", by: "${req.user.username}"`);

  try {
    // Prevent admin from deleting themselves
    if (String(userId) === String(req.user._id)) {
      console.log(`[DEBUG][USER] Delete REJECTED — admin attempted self-deletion`);
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }

    const user = await User.findById(userId);
    if (!user) {
      console.log(`[DEBUG][USER] Delete REJECTED — user not found (ID: ${userId})`);
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    console.log(`[DEBUG][USER] Deleting user: "${user.username}" (role: ${user.role}, team: ${user.team || 'none'})`);

    // If they are a member of a team, pull them from the team's member list
    if (user.team) {
      await Team.updateOne(
        { _id: user.team },
        { $pull: { members: userId } }
      );
      console.log(`[DEBUG][USER] Removed from team member list (teamId: ${user.team})`);
    }

    // If they are a manager of any team, unset the team's manager field
    const managerTeams = await Team.updateMany(
      { manager: userId },
      { $unset: { manager: '' } }
    );
    if (managerTeams.modifiedCount > 0) {
      console.log(`[DEBUG][USER] Unset manager role from ${managerTeams.modifiedCount} teams`);
    }

    await User.findByIdAndDelete(userId);

    console.log(`[DEBUG][USER] User deleted successfully: "${user.username}"`);
    return res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('[DEBUG][USER] Delete user ERROR:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
