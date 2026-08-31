/**
 * @fileoverview Salary Revision Proposals Service
 * @description Business logic for employee-level revision proposals within
 *   compensation cycles: creation, submission, approval workflows,
 *   merit matrix validation, compa-ratio calculation, and bulk operations.
 */

const RevisionProposal = require('../models/revisionProposal.model');
const Employee = require('../models/employee.model');
const CompensationCycle = require('../models/compensationCycle.model');
const logger = require('../utils/logger');

// ─── Merit Matrix Defaults ─────────────────────────────────────────────────

const DEFAULT_MERIT_MATRIX = {
  '1-Emerging': { min: 0, max: 6, corridor: 3 },
  '2-Developing': { min: 6, max: 15, corridor: 10 },
  '3-Proficient': { min: 10, max: 25, corridor: 18 },
  '4-Exceeds': { min: 15, max: 35, corridor: 25 },
  '5-Outstanding': { min: 20, max: 50, corridor: 35 },
};

// ─── Validation Helpers ─────────────────────────────────────────────────────

/**
 * Calculate the compa-ratio for an employee.
 * compa-ratio = (current salary / midpoint of salary band) * 100
 *
 * If no salary band is provided, uses the proposed salary against
 * current salary as a proxy.
 */
function calculateCompaRatio(currentSalary, midpointSalary) {
  if (!midpointSalary || midpointSalary <= 0) return 100;
  return Math.round((currentSalary / midpointSalary) * 10000) / 100;
}

/**
 * Determine if a proposed increase falls outside the merit matrix corridor.
 */
function isOutsideMeritMatrix(performanceRating, increasePercent, matrix) {
  const band = matrix[performanceRating];
  if (!band) return true; // Unknown rating is always outside
  return increasePercent < band.min || increasePercent > band.max;
}

/**
 * Validate that the proposal is within acceptable bounds.
 */
function validateProposal(data, matrix = DEFAULT_MERIT_MATRIX) {
  const errors = [];

  if (data.proposedSalary <= 0) {
    errors.push('Proposed salary must be positive');
  }

  if (data.proposedSalary <= data.currentSalary) {
    errors.push('Proposed salary must be greater than current salary');
  }

  if (!data.performanceRating) {
    errors.push('Performance rating is required');
  }

  const increasePercent = data.proposedIncreasePercentage;
  if (increasePercent < 0 || increasePercent > 100) {
    errors.push('Increase percentage must be between 0 and 100');
  }

  const outsideMatrix = isOutsideMeritMatrix(
    data.performanceRating,
    increasePercent,
    matrix,
  );

  if (outsideMatrix && (!data.justification || data.justification.trim().length === 0)) {
    errors.push('Justification is required when increase is outside merit matrix corridor');
  }

  return { valid: errors.length === 0, errors, outsideMatrix };
}

// ─── Core CRUD Operations ──────────────────────────────────────────────────

/**
 * Create a new revision proposal for an employee within a compensation cycle.
 */
async function createProposal(tenantId, data, managerId) {
  const { compensationCycleId, employeeId, proposedSalary, performanceRating, justification } = data;

  if (!compensationCycleId || !employeeId || proposedSalary === undefined || !performanceRating) {
    throw Object.assign(
      new Error('compensationCycleId, employeeId, proposedSalary, and performanceRating are required'),
      { statusCode: 400 },
    );
  }

  // Verify the compensation cycle exists and is active
  const cycle = await CompensationCycle.findById(compensationCycleId);
  if (!cycle) {
    throw Object.assign(new Error('Compensation cycle not found'), { statusCode: 404 });
  }

  // Verify the employee exists
  const employee = await Employee.findById(employeeId);
  if (!employee) {
    throw Object.assign(new Error('Employee not found'), { statusCode: 404 });
  }

  // Check for existing proposal in this cycle
  const existingProposal = await RevisionProposal.findOne({
    compensationCycleId,
    employeeId,
    isDeleted: { $ne: true },
  });
  if (existingProposal) {
    throw Object.assign(
      new Error('A proposal already exists for this employee in this compensation cycle'),
      { statusCode: 409 },
    );
  }

  const currentSalary = employee.monthlySalary || 0;
  const proposedIncreaseAmount = proposedSalary - currentSalary;
  const proposedIncreasePercentage =
    currentSalary > 0 ? Math.round((proposedIncreaseAmount / currentSalary) * 10000) / 100 : 0;

  const midpointSalary = cycle.salaryBandMidpoint || currentSalary * 1.15;
  const compaRatio = calculateCompaRatio(currentSalary, midpointSalary);

  // Validate against merit matrix
  const { valid, errors, outsideMatrix } = validateProposal(
    { currentSalary, proposedSalary, performanceRating, proposedIncreasePercentage, justification },
    cycle.meritMatrix || DEFAULT_MERIT_MATRIX,
  );

  if (!valid) {
    throw Object.assign(new Error(errors.join('; ')), { statusCode: 400 });
  }

  const proposal = await RevisionProposal.create({
    tenantId,
    compensationCycleId,
    employeeId,
    managerId,
    currentSalary,
    proposedSalary,
    proposedIncreaseAmount,
    proposedIncreasePercentage,
    performanceRating,
    compaRatio,
    isOutsideMeritMatrix: outsideMatrix,
    justification: justification || '',
    status: 'Draft',
    approvalHistory: [],
  });

  logger.info('Revision proposal created', {
    proposalId: proposal._id,
    employeeId,
    cycleId: compensationCycleId,
    increasePercent: proposedIncreasePercentage,
  });

  return proposal;
}

/**
 * List proposals with filtering and pagination.
 */
async function listProposals(tenantId, filters = {}, options = {}) {
  const { page = 1, limit = 50, sort = '-createdAt' } = options;
  const query = { tenantId, isDeleted: { $ne: true } };

  if (filters.compensationCycleId) query.compensationCycleId = filters.compensationCycleId;
  if (filters.employeeId) query.employeeId = filters.employeeId;
  if (filters.managerId) query.managerId = filters.managerId;
  if (filters.status) query.status = filters.status;
  if (filters.isOutsideMeritMatrix !== undefined) query.isOutsideMeritMatrix = filters.isOutsideMeritMatrix;

  const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
  const [proposals, total] = await Promise.all([
    RevisionProposal.find(query)
      .populate('employeeId', 'fullName email department jobLevel')
      .populate('managerId', 'fullName email')
      .populate('compensationCycleId', 'name startDate endDate')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit, 10)),
    RevisionProposal.countDocuments(query),
  ]);

  return {
    proposals,
    pagination: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      totalPages: Math.ceil(total / parseInt(limit, 10)),
    },
  };
}

/**
 * Get a single proposal by ID with populated references.
 */
async function getProposal(proposalId, tenantId) {
  const proposal = await RevisionProposal.findOne({
    _id: proposalId,
    tenantId,
    isDeleted: { $ne: true },
  })
    .populate('employeeId', 'fullName email department jobLevel monthlySalary')
    .populate('managerId', 'fullName email')
    .populate('compensationCycleId', 'name startDate endDate meritMatrix')
    .populate('approvalHistory.actionBy', 'fullName email');

  if (!proposal) {
    throw Object.assign(new Error('Proposal not found'), { statusCode: 404 });
  }

  return proposal;
}

/**
 * Update a draft proposal.
 */
async function updateProposal(proposalId, tenantId, data, userId) {
  const proposal = await RevisionProposal.findOne({
    _id: proposalId,
    tenantId,
    isDeleted: { $ne: true },
  });

  if (!proposal) {
    throw Object.assign(new Error('Proposal not found'), { statusCode: 404 });
  }

  if (proposal.status !== 'Draft') {
    throw Object.assign(
      new Error('Only draft proposals can be edited'),
      { statusCode: 400 },
    );
  }

  // Only allow updating certain fields
  const allowedFields = ['proposedSalary', 'performanceRating', 'justification'];
  const updates = {};
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updates[field] = data[field];
    }
  }

  // Recalculate derived fields if salary changed
  if (updates.proposedSalary !== undefined) {
    const currentSalary = proposal.currentSalary;
    updates.proposedIncreaseAmount = updates.proposedSalary - currentSalary;
    updates.proposedIncreasePercentage =
      currentSalary > 0
        ? Math.round((updates.proposedIncreaseAmount / currentSalary) * 10000) / 100
        : 0;

    const cycle = await CompensationCycle.findById(proposal.compensationCycleId);
    const midpoint = (cycle && cycle.salaryBandMidpoint) || currentSalary * 1.15;
    updates.compaRatio = calculateCompaRatio(currentSalary, midpoint);

    const matrix = (cycle && cycle.meritMatrix) || DEFAULT_MERIT_MATRIX;
    const rating = updates.performanceRating || proposal.performanceRating;
    updates.isOutsideMeritMatrix = isOutsideMeritMatrix(
      rating,
      updates.proposedIncreasePercentage,
      matrix,
    );
  }

  Object.assign(proposal, updates);
  await proposal.save();

  logger.info('Revision proposal updated', { proposalId, userId, fields: Object.keys(updates) });
  return proposal;
}

// ─── Workflow Transitions ───────────────────────────────────────────────────

/**
 * Submit a proposal for approval.
 */
async function submitProposal(proposalId, tenantId, userId) {
  const proposal = await RevisionProposal.findOne({
    _id: proposalId,
    tenantId,
    isDeleted: { $ne: true },
  });

  if (!proposal) {
    throw Object.assign(new Error('Proposal not found'), { statusCode: 404 });
  }

  if (proposal.status !== 'Draft') {
    throw Object.assign(
      new Error(`Cannot submit a proposal in '${proposal.status}' status`),
      { statusCode: 400 },
    );
  }

  proposal.status = 'Submitted';
  proposal.approvalHistory.push({
    actionBy: userId,
    actionDate: new Date(),
    action: 'Submitted',
    comment: 'Proposal submitted for review',
  });

  await proposal.save();

  logger.info('Revision proposal submitted', { proposalId, employeeId: proposal.employeeId });
  return proposal;
}

/**
 * Approve a proposal at the manager level.
 */
async function managerApprove(proposalId, tenantId, userId, comment) {
  const proposal = await RevisionProposal.findOne({
    _id: proposalId,
    tenantId,
    isDeleted: { $ne: true },
  });

  if (!proposal) {
    throw Object.assign(new Error('Proposal not found'), { statusCode: 404 });
  }

  if (proposal.status !== 'Submitted') {
    throw Object.assign(
      new Error(`Cannot approve a proposal in '${proposal.status}' status`),
      { statusCode: 400 },
    );
  }

  proposal.status = 'Manager_Approved';
  proposal.approvalHistory.push({
    actionBy: userId,
    actionDate: new Date(),
    action: 'Approved',
    comment: comment || 'Manager approved',
  });

  await proposal.save();

  logger.info('Revision proposal manager-approved', {
    proposalId,
    employeeId: proposal.employeeId,
  });
  return proposal;
}

/**
 * Approve a proposal at the finance level (final approval).
 */
async function financeApprove(proposalId, tenantId, userId, comment) {
  const proposal = await RevisionProposal.findOne({
    _id: proposalId,
    tenantId,
    isDeleted: { $ne: true },
  });

  if (!proposal) {
    throw Object.assign(new Error('Proposal not found'), { statusCode: 404 });
  }

  if (proposal.status !== 'Manager_Approved') {
    throw Object.assign(
      new Error(`Cannot finance-approve a proposal in '${proposal.status}' status`),
      { statusCode: 400 },
    );
  }

  proposal.status = 'Finance_Approved';
  proposal.approvalHistory.push({
    actionBy: userId,
    actionDate: new Date(),
    action: 'Approved',
    comment: comment || 'Finance approved',
  });

  await proposal.save();

  logger.info('Revision proposal finance-approved', {
    proposalId,
    employeeId: proposal.employeeId,
  });
  return proposal;
}

/**
 * Reject a proposal at any stage.
 */
async function rejectProposal(proposalId, tenantId, userId, reason) {
  if (!reason || reason.trim().length === 0) {
    throw Object.assign(new Error('Rejection reason is required'), { statusCode: 400 });
  }

  const proposal = await RevisionProposal.findOne({
    _id: proposalId,
    tenantId,
    isDeleted: { $ne: true },
  });

  if (!proposal) {
    throw Object.assign(new Error('Proposal not found'), { statusCode: 404 });
  }

  if (!['Submitted', 'Manager_Approved'].includes(proposal.status)) {
    throw Object.assign(
      new Error(`Cannot reject a proposal in '${proposal.status}' status`),
      { statusCode: 400 },
    );
  }

  proposal.status = 'Rejected';
  proposal.approvalHistory.push({
    actionBy: userId,
    actionDate: new Date(),
    action: 'Rejected',
    comment: reason,
  });

  await proposal.save();

  logger.info('Revision proposal rejected', {
    proposalId,
    employeeId: proposal.employeeId,
    reason,
  });
  return proposal;
}

/**
 * Resubmit a rejected proposal (creates a new version).
 */
async function resubmitProposal(proposalId, tenantId, data, userId) {
  const proposal = await RevisionProposal.findOne({
    _id: proposalId,
    tenantId,
    isDeleted: { $ne: true },
  });

  if (!proposal) {
    throw Object.assign(new Error('Proposal not found'), { statusCode: 404 });
  }

  if (proposal.status !== 'Rejected') {
    throw Object.assign(
      new Error('Only rejected proposals can be resubmitted'),
      { statusCode: 400 },
    );
  }

  // Update fields if provided
  if (data.proposedSalary !== undefined) {
    const currentSalary = proposal.currentSalary;
    proposal.proposedSalary = data.proposedSalary;
    proposal.proposedIncreaseAmount = data.proposedSalary - currentSalary;
    proposal.proposedIncreasePercentage =
      currentSalary > 0
        ? Math.round((proposal.proposedIncreaseAmount / currentSalary) * 10000) / 100
        : 0;
  }
  if (data.performanceRating) proposal.performanceRating = data.performanceRating;
  if (data.justification !== undefined) proposal.justification = data.justification;

  proposal.status = 'Draft';
  proposal.version = (proposal.version || 1) + 1;
  proposal.approvalHistory.push({
    actionBy: userId,
    actionDate: new Date(),
    action: 'Submitted',
    comment: 'Resubmitted after rejection',
  });

  await proposal.save();

  logger.info('Revision proposal resubmitted', {
    proposalId,
    version: proposal.version,
  });
  return proposal;
}

// ─── Bulk Operations ────────────────────────────────────────────────────────

/**
 * Bulk create proposals for multiple employees in a compensation cycle.
 */
async function bulkCreateProposals(tenantId, proposals, managerId) {
  if (!Array.isArray(proposals) || proposals.length === 0) {
    throw Object.assign(new Error('At least one proposal is required'), { statusCode: 400 });
  }

  const results = { created: 0, skipped: 0, errors: [] };

  for (const item of proposals) {
    try {
      await createProposal(tenantId, { ...item, managerId }, managerId);
      results.created++;
    } catch (err) {
      results.errors.push({
        employeeId: item.employeeId,
        error: err.message,
      });
      results.skipped++;
    }
  }

  logger.info('Bulk proposal creation complete', {
    tenantId,
    created: results.created,
    skipped: results.skipped,
  });

  return results;
}

/**
 * Bulk submit all draft proposals for a compensation cycle.
 */
async function bulkSubmitProposals(tenantId, compensationCycleId, userId) {
  const drafts = await RevisionProposal.find({
    tenantId,
    compensationCycleId,
    status: 'Draft',
    isDeleted: { $ne: true },
  });

  if (drafts.length === 0) {
    throw Object.assign(
      new Error('No draft proposals found for this compensation cycle'),
      { statusCode: 404 },
    );
  }

  let submitted = 0;
  for (const draft of drafts) {
    draft.status = 'Submitted';
    draft.approvalHistory.push({
      actionBy: userId,
      actionDate: new Date(),
      action: 'Submitted',
      comment: 'Bulk submitted',
    });
    await draft.save();
    submitted++;
  }

  logger.info('Bulk proposal submission complete', {
    tenantId,
    compensationCycleId,
    submitted,
  });

  return { submitted };
}

// ─── Analytics & Reporting ──────────────────────────────────────────────────

/**
 * Get proposal summary statistics for a compensation cycle.
 */
async function getCycleSummary(tenantId, compensationCycleId) {
  const proposals = await RevisionProposal.find({
    tenantId,
    compensationCycleId,
    isDeleted: { $ne: true },
  }).populate('employeeId', 'fullName department jobLevel');

  if (proposals.length === 0) {
    return {
      totalProposals: 0,
      byStatus: {},
      totalIncreaseCost: 0,
      averageIncreasePercent: 0,
      outsideMatrixCount: 0,
    };
  }

  const byStatus = {};
  let totalIncreaseCost = 0;
  let totalIncreasePercent = 0;
  let outsideMatrixCount = 0;
  const byDepartment = {};

  for (const p of proposals) {
    byStatus[p.status] = (byStatus[p.status] || 0) + 1;
    totalIncreaseCost += p.proposedIncreaseAmount || 0;
    totalIncreasePercent += p.proposedIncreasePercentage || 0;
    if (p.isOutsideMeritMatrix) outsideMatrixCount++;

    const dept = (p.employeeId && p.employeeId.department) || 'Unassigned';
    if (!byDepartment[dept]) {
      byDepartment[dept] = { count: 0, totalIncrease: 0, avgIncreasePercent: 0 };
    }
    byDepartment[dept].count++;
    byDepartment[dept].totalIncrease += p.proposedIncreaseAmount || 0;
  }

  // Calculate averages for departments
  for (const dept of Object.keys(byDepartment)) {
    byDepartment[dept].avgIncreasePercent =
      byDepartment[dept].count > 0
        ? Math.round(
            (proposals
              .filter((p) => (p.employeeId && p.employeeId.department) === dept)
              .reduce((s, p) => s + (p.proposedIncreasePercentage || 0), 0) /
              byDepartment[dept].count) *
              100,
          ) / 100
        : 0;
    byDepartment[dept].totalIncrease = Math.round(byDepartment[dept].totalIncrease * 100) / 100;
  }

  return {
    totalProposals: proposals.length,
    byStatus,
    totalIncreaseCost: Math.round(totalIncreaseCost * 100) / 100,
    averageIncreasePercent: Math.round((totalIncreasePercent / proposals.length) * 100) / 100,
    outsideMatrixCount,
    byDepartment,
  };
}

/**
 * Get manager-level view: proposals pending their approval.
 */
async function getManagerPendingApprovals(tenantId, managerId) {
  const proposals = await RevisionProposal.find({
    tenantId,
    managerId,
    status: { $in: ['Submitted', 'Manager_Approved'] },
    isDeleted: { $ne: true },
  })
    .populate('employeeId', 'fullName email department jobLevel')
    .populate('compensationCycleId', 'name startDate endDate')
    .sort('-createdAt');

  return proposals;
}

module.exports = {
  createProposal,
  listProposals,
  getProposal,
  updateProposal,
  submitProposal,
  managerApprove,
  financeApprove,
  rejectProposal,
  resubmitProposal,
  bulkCreateProposals,
  bulkSubmitProposals,
  getCycleSummary,
  getManagerPendingApprovals,
  calculateCompaRatio,
  isOutsideMeritMatrix,
  validateProposal,
  DEFAULT_MERIT_MATRIX,
};
