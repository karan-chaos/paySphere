/**
 * @fileoverview Salary Revision Proposals Routes
 * @description REST endpoints for employee-level revision proposals within
 *   compensation cycles: CRUD, workflow transitions, bulk operations,
 *   and reporting.
 */

const express = require('express');
const auth = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/rbac.middleware');
const { writeRateLimiter } = require('../middlewares/rateLimiter.middleware');
const ctrl = require('../controllers/salaryRevisionProposal.controller');

const router = express.Router();

// ─── CRUD ───────────────────────────────────────────────────────────────────

router.post(
  '/',
  auth,
  requirePermission('WRITE_PAYROLL'),
  writeRateLimiter,
  ctrl.createProposal,
);

router.get(
  '/',
  auth,
  requirePermission('READ_PAYROLL'),
  ctrl.listProposals,
);

router.get(
  '/merit-matrix',
  auth,
  requirePermission('READ_PAYROLL'),
  ctrl.getMeritMatrix,
);

router.get(
  '/pending-approvals',
  auth,
  requirePermission('READ_PAYROLL'),
  ctrl.getManagerPendingApprovals,
);

router.get(
  '/summary/:cycleId',
  auth,
  requirePermission('READ_PAYROLL'),
  ctrl.getCycleSummary,
);

router.get(
  '/:proposalId',
  auth,
  requirePermission('READ_PAYROLL'),
  ctrl.getProposal,
);

router.put(
  '/:proposalId',
  auth,
  requirePermission('WRITE_PAYROLL'),
  writeRateLimiter,
  ctrl.updateProposal,
);

router.delete(
  '/:proposalId',
  auth,
  requirePermission('WRITE_PAYROLL'),
  writeRateLimiter,
  ctrl.deleteProposal,
);

// ─── Workflow Transitions ───────────────────────────────────────────────────

router.put(
  '/:proposalId/submit',
  auth,
  requirePermission('WRITE_PAYROLL'),
  writeRateLimiter,
  ctrl.submitProposal,
);

router.put(
  '/:proposalId/manager-approve',
  auth,
  requirePermission('WRITE_PAYROLL'),
  writeRateLimiter,
  ctrl.managerApprove,
);

router.put(
  '/:proposalId/finance-approve',
  auth,
  requirePermission('WRITE_PAYROLL'),
  writeRateLimiter,
  ctrl.financeApprove,
);

router.put(
  '/:proposalId/reject',
  auth,
  requirePermission('WRITE_PAYROLL'),
  writeRateLimiter,
  ctrl.rejectProposal,
);

router.put(
  '/:proposalId/resubmit',
  auth,
  requirePermission('WRITE_PAYROLL'),
  writeRateLimiter,
  ctrl.resubmitProposal,
);

// ─── Bulk Operations ────────────────────────────────────────────────────────

router.post(
  '/bulk',
  auth,
  requirePermission('WRITE_PAYROLL'),
  writeRateLimiter,
  ctrl.bulkCreate,
);

router.post(
  '/bulk-submit',
  auth,
  requirePermission('WRITE_PAYROLL'),
  writeRateLimiter,
  ctrl.bulkSubmit,
);

// ─── Validation ─────────────────────────────────────────────────────────────

router.post(
  '/validate',
  auth,
  requirePermission('READ_PAYROLL'),
  ctrl.validateProposal,
);

module.exports = router;
