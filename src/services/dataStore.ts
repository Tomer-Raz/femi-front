
import type { ClaimRow, User, Team, Rule, ReferenceTable, Hospital, PeriodData } from '../types';
import { RunStatus } from '../types';
import { MOCK_CLAIMS, MOCK_USERS, MOCK_TEAMS, MOCK_RULES, MOCK_REF_TABLES, MOCK_HOSPITALS, MOCK_MONTHS } from '../mockData';

// This file acts as a pseudo-database/state management service.
// It persists the data in memory as long as the application (browser tab) is open.

// Deep copy to ensure we don't mutate the original readonly mock export directly initially
let globalClaimsStore: ClaimRow[] = JSON.parse(JSON.stringify(MOCK_CLAIMS));
let globalUsersStore: User[] = JSON.parse(JSON.stringify(MOCK_USERS));
let globalTeamsStore: Team[] = JSON.parse(JSON.stringify(MOCK_TEAMS));
let globalRulesStore: Rule[] = JSON.parse(JSON.stringify(MOCK_RULES));
let globalTablesStore: ReferenceTable[] = JSON.parse(JSON.stringify(MOCK_REF_TABLES));
let globalHospitalsStore: Hospital[] = JSON.parse(JSON.stringify(MOCK_HOSPITALS));
let globalMonthsStore: PeriodData[] = JSON.parse(JSON.stringify(MOCK_MONTHS));

// --- CLAIMS ---
export const getClaims = (): ClaimRow[] => {
  return [...globalClaimsStore];
};

export const updateClaimInStore = (updatedClaim: ClaimRow): void => {
  globalClaimsStore = globalClaimsStore.map(c => 
    (c.visitNumber === updatedClaim.visitNumber && c.treatmentCode === updatedClaim.treatmentCode)
      ? updatedClaim
      : c
  );
};

// --- USERS ---
export const getUsers = (): User[] => [...globalUsersStore];

export const addUser = (user: Omit<User, 'id'>): User => {
  const newUser = { ...user, id: Math.random().toString(36).substr(2, 9) };
  globalUsersStore = [...globalUsersStore, newUser];
  return newUser;
};

// --- TEAMS ---
export const getTeams = (): Team[] => [...globalTeamsStore];

export const addTeam = (team: Omit<Team, 'id'>): Team => {
  const newTeam = { ...team, id: Math.random().toString(36).substr(2, 9) };
  globalTeamsStore = [...globalTeamsStore, newTeam];
  return newTeam;
};

/**
 * Delete a team and remove all its members from the team
 * @param teamId - Team ID to delete
 * @returns void
 */
export const deleteTeam = (teamId: string): void => {
  const team = globalTeamsStore.find(t => t.id === teamId);
  if (!team) throw new Error('Team not found');

  // Remove all users from this team
  globalUsersStore = globalUsersStore.map(user =>
    user.teamId === teamId ? { ...user, teamId: undefined } : user
  );

  // Remove the team
  globalTeamsStore = globalTeamsStore.filter(t => t.id !== teamId);
};

// --- USER-TEAM MANAGEMENT ---

/**
 * Assign or remove a user from a team
 * @param userId - User ID to update
 * @param teamId - Team ID to assign to, or undefined to remove from team
 * @returns Updated user object
 * @throws Error if user not found or validation fails
 */
export const updateUserTeam = (userId: string, teamId: string | undefined): User => {
  const user = globalUsersStore.find(u => u.id === userId);
  if (!user) throw new Error('User not found');

  // If assigning to team, check user is not already in another team
  if (teamId && user.teamId && user.teamId !== teamId) {
    throw new Error('User is already assigned to another team');
  }

  // Update user's team
  const updatedUser = { ...user, teamId };
  globalUsersStore = globalUsersStore.map(u => u.id === userId ? updatedUser : u);

  // If removing from team and user was team lead, remove leader status
  if (!teamId && user.teamId) {
    const team = globalTeamsStore.find(t => t.id === user.teamId);
    if (team && team.leaderId === userId) {
      globalTeamsStore = globalTeamsStore.map(t =>
        t.id === team.id ? { ...t, leaderId: null } : t
      );
    }
  }

  // Update team memberIds
  if (teamId) {
    globalTeamsStore = globalTeamsStore.map(t =>
      t.id === teamId && !t.memberIds.includes(userId)
        ? { ...t, memberIds: [...t.memberIds, userId] }
        : t
    );
  } else if (user.teamId) {
    globalTeamsStore = globalTeamsStore.map(t =>
      t.id === user.teamId
        ? { ...t, memberIds: t.memberIds.filter(id => id !== userId) }
        : t
    );
  }

  return updatedUser;
};

/**
 * Update team leader (demotes current leader to regular member)
 * @param teamId - Team ID
 * @param newLeaderId - User ID to promote to team lead
 * @returns Updated team object
 * @throws Error if team/user not found or validation fails
 */
export const updateTeamLeader = (teamId: string, newLeaderId: string): Team => {
  const team = globalTeamsStore.find(t => t.id === teamId);
  if (!team) throw new Error('Team not found');

  const newLeader = globalUsersStore.find(u => u.id === newLeaderId);
  if (!newLeader) throw new Error('User not found');

  // Validate new leader has TeamLead role
  if (newLeader.role !== 'TeamLead') {
    throw new Error('User must have TeamLead role');
  }

  // Validate new leader is in the team
  if (newLeader.teamId !== teamId) {
    throw new Error('User must be a member of the team');
  }

  // Update team leader
  const updatedTeam = { ...team, leaderId: newLeaderId };
  globalTeamsStore = globalTeamsStore.map(t => t.id === teamId ? updatedTeam : t);

  return updatedTeam;
};

/**
 * Remove team leader (optionally keep as regular member)
 * @param teamId - Team ID
 * @param keepAsMember - If true, keep user as regular member; if false, remove from team
 * @returns Updated team object
 */
export const removeTeamLeader = (teamId: string, keepAsMember: boolean = true): Team => {
  const team = globalTeamsStore.find(t => t.id === teamId);
  if (!team || !team.leaderId) throw new Error('Team or leader not found');

  const leaderId = team.leaderId;

  // Update team to remove leader
  const updatedTeam = { ...team, leaderId: null };
  globalTeamsStore = globalTeamsStore.map(t => t.id === teamId ? updatedTeam : t);

  // If not keeping as member, remove from team
  if (!keepAsMember) {
    updateUserTeam(leaderId, undefined);
  }

  return updatedTeam;
};

// --- RULES ---
export const getRules = (): Rule[] => [...globalRulesStore];

export const addRule = (rule: Omit<Rule, 'id'>): Rule => {
  const newRule = { ...rule, id: `R-${Math.floor(Math.random() * 1000)}` };
  globalRulesStore = [...globalRulesStore, newRule];
  return newRule;
};

export const updateRuleStatus = (id: string, status: Rule['status']) => {
    globalRulesStore = globalRulesStore.map(r => r.id === id ? { ...r, status } : r);
};

// --- TABLES ---
export const getReferenceTables = (): ReferenceTable[] => [...globalTablesStore];

// --- HOSPITALS ---
export const getHospitals = (): Hospital[] => [...globalHospitalsStore];

export const addHospital = (hospital: Omit<Hospital, 'latestPeriod' | 'latestStatus'>): Hospital => {
    const newHospital: Hospital = {
        ...hospital,
        latestPeriod: '-',
        latestStatus: RunStatus.NotRun,
        hasPendingUploads: false
    };
    globalHospitalsStore = [...globalHospitalsStore, newHospital];
    return newHospital;
};

// --- MONTHS ---
// In a real app, this would filter by hospital ID
export const getMonths = (): PeriodData[] => [...globalMonthsStore];

export const addMonth = (monthStr: string): PeriodData => {
    const newMonth: PeriodData = {
        period: monthStr,
        status: RunStatus.NotRun,
        hasPendingUploads: true // Default to needing uploads
    };
    globalMonthsStore = [newMonth, ...globalMonthsStore]; // Prepend
    return newMonth;
};

export const resetStore = () => {
    globalClaimsStore = JSON.parse(JSON.stringify(MOCK_CLAIMS));
    globalUsersStore = JSON.parse(JSON.stringify(MOCK_USERS));
    globalTeamsStore = JSON.parse(JSON.stringify(MOCK_TEAMS));
    globalRulesStore = JSON.parse(JSON.stringify(MOCK_RULES));
    globalTablesStore = JSON.parse(JSON.stringify(MOCK_REF_TABLES));
    globalHospitalsStore = JSON.parse(JSON.stringify(MOCK_HOSPITALS));
    globalMonthsStore = JSON.parse(JSON.stringify(MOCK_MONTHS));
};
