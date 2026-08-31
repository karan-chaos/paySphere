/**
 * @fileoverview Salary Revision Proposals Controller
 * @description Request handlers for revision proposals: CRUD, workflow
 *   transitions, bulk operations, and reporting endpoints.
 */

const proposalService = require('../services/salaryRevisionProposal.service');

// ─── CRUD Endpoints ─────────────────────────────────────────────────────────

/**
 * POST /api/salary-revision-proposals
 * Create a new revision proposal for an employee.
 */
exports.createProposal = async (req, res, next) => {
  try {
    const proposal = await proposalService.createProposal(
      req.tenantId,
      req.body,
      req.userId,
    );
    res.status(201).json({ message: 'Proposal created', proposal });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/salary-revision-proposals
 * List all revision proposals with filtering and pagination.
 */
exports.listProposals = async (req, res, next) => {
  try {
    const filters = {};
    if (req.query.compensationCycleId) filters.compensationCycleId = req.query.compensationCycleId;
    if (req.query.employeeId) filters.employeeId = req.query.employeeId;
    if (req.query.managerId) filters.managerId = req.query.managerId;
    if (req.query.status) filters.status = req.query.status;
    if (req.query.isOutsideMeritMatrix !== undefined) {
      filters.isOutsideMeritMatrix = req.query.isOutsideMeritMatrix === 'true';
    }

    const options = {};
    if (req.query.page) options.page = req.query.page;
    if (req.query.limit) options.limit = req.query.limit;
    if (req.query.sort) options.sort = req.query.sort;

    const result = await proposalService.listProposals(req.tenantId, filters, options);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/salary-revision-proposals/:proposalId
 * Get a single proposal with full details.
 */
exports.getProposal = async (req, res, next) => {
  try {
    const proposal = await proposalService.getProposal(
      req.params.proposalId,
      req.tenantId,
    );
    res.status(200).json({ proposal });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/salary-revision-proposals/:proposalId
 * Update a draft proposal.
 */
exports.updateProposal = async (req, res, next) => {
  try {
    const proposal = await proposalService.updateProposal(
      req.params.proposalId,
      req.tenantId,
      req.body,
      req.userId,
    );
    res.status(200).json({ message: 'Proposal updated', proposal });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/salary-revision-proposals/:proposalId
 * Soft-delete a proposal (only if in Draft status).
 */
exports.deleteProposal = async (req, res, next) => {
  try {
    const RevisionProposal = require('../models/revisionProposal.model');
    const proposal = await RevisionProposal.findOne({
      _id: req.params.proposalId,
      tenantId: req.tenantId,
      isDeleted: { $ne: true },
    });

    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    if (proposal.status !== 'Draft') {
      return res.status(400).json({
        message: 'Only draft proposals can be deleted',
      });
    }

    await proposal.softDelete();

    res.status(200).json({ message: 'Proposal deleted' });
  } catch (error) {
    next(error);
  }
};

// ─── Workflow Endpoints ─────────────────────────────────────────────────────

/**
 * PUT /api/salary-revision-proposals/:proposalId/submit
 * Submit a draft proposal for manager review.
 */
exports.submitProposal = async (req, res, next) => {
  try {
    const proposal = await proposalService.submitProposal(
      req.params.proposalId,
      req.tenantId,
      req.userId,
    );
    res.status(200).json({ message: 'Proposal submitted', proposal });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/salary-revision-proposals/:proposalId/manager-approve
 * Manager-level approval of a submitted proposal.
 */
exports.managerApprove = async (req, res, next) => {
  try {
    const proposal = await proposalService.managerApprove(
      req.params.proposalId,
      req.tenantId,
      req.userId,
      req.body.comment,
    );
    res.status(200).json({ message: 'Proposal approved by manager', proposal });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/salary-revision-proposals/:proposalId/finance-approve
 * Finance-level final approval of a manager-approved proposal.
 */
exports.financeApprove = async (req, res, next) => {
  try {
    const proposal = await proposalService.financeApprove(
      req.params.proposalId,
      req.tenantId,
      req.userId,
      req.body.comment,
    );
    res.status(200).json({ message: 'Proposal approved by finance', proposal });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/salary-revision-proposals/:proposalId/reject
 * Reject a proposal (requires a reason).
 */
exports.rejectProposal = async (req, res, next) => {
  try {
    const { reason } = req.body || {};
    if (!reason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }
    const proposal = await proposalService.rejectProposal(
      req.params.proposalId,
      req.tenantId,
      req.userId,
      reason,
    );
    res.status(200).json({ message: 'Proposal rejected', proposal });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/salary-revision-proposals/:proposalId/resubmit
 * Resubmit a rejected proposal with optional updates.
 */
exports.resubmitProposal = async (req, res, next) => {
  try {
    const proposal = await proposalService.resubmitProposal(
      req.params.proposalId,
      req.tenantId,
      req.body,
      req.userId,
    );
    res.status(200).json({ message: 'Proposal resubmitted', proposal });
  } catch (error) {
    next(error);
  }
};

// ─── Bulk Operations ────────────────────────────────────────────────────────

/**
 * POST /api/salary-revision-proposals/bulk
 * Bulk create proposals for multiple employees.
 */
exports.bulkCreate = async (req, res, next) => {
  try {
    const { proposals } = req.body;
    if (!Array.isArray(proposals)) {
      return res.status(400).json({ message: 'proposals array is required' });
    }
    const result = await proposalService.bulkCreateProposals(
      req.tenantId,
      proposals,
      req.userId,
    );
    res.status(201).json({ message: 'Bulk creation complete', result });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/salary-revision-proposals/bulk-submit
 * Bulk submit all draft proposals for a compensation cycle.
 */
exports.bulkSubmit = async (req, res, next) => {
  try {
    const { compensationCycleId } = req.body;
    if (!compensationCycleId) {
      return res.status(400).json({ message: 'compensationCycleId is required' });
    }
    const result = await proposalService.bulkSubmitProposals(
      req.tenantId,
      compensationCycleId,
      req.userId,
    );
    res.status(200).json({ message: 'Bulk submission complete', result });
  } catch (error) {
    next(error);
  }
};

// ─── Analytics & Reporting ──────────────────────────────────────────────────

/**
 * GET /api/salary-revision-proposals/summary/:cycleId
 * Get proposal summary statistics for a compensation cycle.
 */
exports.getCycleSummary = async (req, res, next) => {
  try {
    const summary = await proposalService.getCycleSummary(
      req.tenantId,
      req.params.cycleId,
    );
    res.status(200).json({ summary });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/salary-revision-proposals/pending-approvals
 * Get proposals pending the current manager's approval.
 */
exports.getManagerPendingApprovals = async (req, res, next) => {
  try {
    const proposals = await proposalService.getManagerPendingApprovals(
      req.tenantId,
      req.userId,
    );
    res.status(200).json({ proposals, count: proposals.length });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/salary-revision-proposals/merit-matrix
 * Get the default merit matrix for reference.
 */
exports.getMeritMatrix = async (req, res, next) => {
  try {
    res.status(200).json({
      meritMatrix: proposalService.DEFAULT_MERIT_MATRIX,
      description: 'Default merit matrix bands with min, max, and corridor percentages by performance rating',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/salary-revision-proposals/validate
 * Validate a proposed salary against the merit matrix without creating.
 */
exports.validateProposal = async (req, res, next) => {
  try {
    const { currentSalary, proposedSalary, performanceRating } = req.body;
    if (currentSalary === undefined || proposedSalary === undefined || !performanceRating) {
      return res.status(400).json({
        message: 'currentSalary, proposedSalary, and performanceRating are required',
      });
    }

    const increasePercent =
      currentSalary > 0
        ? Math.round(((proposedSalary - currentSalary) / currentSalary) * 10000) / 100
        : 0;

    const result = proposalService.validateProposal({
      currentSalary,
      proposedSalary,
      performanceRating,
      proposedIncreasePercentage: increasePercent,
      justification: req.body.justification,
    });

    res.status(200).json({
      valid: result.valid,
      errors: result.errors,
      outsideMeritMatrix: result.outsideMatrix,
      increasePercent,
    });
  } catch (error) {
    next(error);
  }
};
