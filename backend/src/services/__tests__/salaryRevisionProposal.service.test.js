/**
 * @fileoverview Tests for Salary Revision Proposals Service
 * @description Unit tests for the proposal creation, workflow transitions,
 *   validation, bulk operations, and analytics functions.
 */

const proposalService = require('../services/salaryRevisionProposal.service');
const RevisionProposal = require('../models/revisionProposal.model');
const Employee = require('../models/employee.model');
const CompensationCycle = require('../models/compensationCycle.model');

// ─── Mock Dependencies ──────────────────────────────────────────────────────

jest.mock('../models/revisionProposal.model');
jest.mock('../models/employee.model');
jest.mock('../models/compensationCycle.model');
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

// ─── Test Helpers ───────────────────────────────────────────────────────────

const mockTenantId = 'tenant123';
const mockUserId = 'user123';
const mockEmployeeId = 'emp123';
const mockCycleId = 'cycle123';
const mockProposalId = 'prop123';

const mockEmployee = {
  _id: mockEmployeeId,
  fullName: 'Ravi Kumar',
  email: 'ravi@example.com',
  department: 'Engineering',
  jobLevel: 'L3',
  monthlySalary: 50000,
};

const mockCycle = {
  _id: mockCycleId,
  name: 'Annual Review 2026',
  startDate: new Date('2026-01-01'),
  endDate: new Date('2026-03-31'),
  salaryBandMidpoint: 57500,
  meritMatrix: {
    '1-Emerging': { min: 0, max: 6, corridor: 3 },
    '2-Developing': { min: 6, max: 15, corridor: 10 },
    '3-Proficient': { min: 10, max: 25, corridor: 18 },
    '4-Exceeds': { min: 15, max: 35, corridor: 25 },
    '5-Outstanding': { min: 20, max: 50, corridor: 35 },
  },
};

const mockProposal = {
  _id: mockProposalId,
  tenantId: mockTenantId,
  compensationCycleId: mockCycleId,
  employeeId: mockEmployeeId,
  managerId: mockUserId,
  currentSalary: 50000,
  proposedSalary: 59000,
  proposedIncreaseAmount: 9000,
  proposedIncreasePercentage: 18,
  performanceRating: '3-Proficient',
  compaRatio: 86.96,
  isOutsideMeritMatrix: false,
  justification: '',
  status: 'Draft',
  version: 1,
  approvalHistory: [],
  save: jest.fn(),
  softDelete: jest.fn(),
};

// ─── Helper to create mock chainable query ──────────────────────────────────

function createMockQuery(result) {
  const chain = {
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    then: (resolve) => resolve(result),
  };
  chain[Symbol.for('jest.fn')] = true;
  return chain;
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('salaryRevisionProposal.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── Helper Utilities ──────────────────────────────────────────────────

  describe('calculateCompaRatio', () => {
    it('should return 100 when midpoint is zero', () => {
      expect(proposalService.calculateCompaRatio(50000, 0)).toBe(100);
    });

    it('should return 100 when midpoint is null', () => {
      expect(proposalService.calculateCompaRatio(50000, null)).toBe(100);
    });

    it('should calculate correct compa-ratio', () => {
      const result = proposalService.calculateCompaRatio(50000, 57500);
      expect(result).toBeCloseTo(86.96, 1);
    });

    it('should return 100 for equal salary and midpoint', () => {
      expect(proposalService.calculateCompaRatio(50000, 50000)).toBe(100);
    });
  });

  describe('isOutsideMeritMatrix', () => {
    const matrix = proposalService.DEFAULT_MERIT_MATRIX;

    it('should return false when within corridor', () => {
      expect(proposalService.isOutsideMeritMatrix('3-Proficient', 18, matrix)).toBe(false);
    });

    it('should return true when below minimum', () => {
      expect(proposalService.isOutsideMeritMatrix('3-Proficient', 5, matrix)).toBe(true);
    });

    it('should return true when above maximum', () => {
      expect(proposalService.isOutsideMeritMatrix('3-Proficient', 30, matrix)).toBe(true);
    });

    it('should return true for unknown rating', () => {
      expect(proposalService.isOutsideMeritMatrix('Unknown', 10, matrix)).toBe(true);
    });
  });

  describe('validateProposal', () => {
    it('should validate a valid proposal', () => {
      const result = proposalService.validateProposal({
        currentSalary: 50000,
        proposedSalary: 59000,
        performanceRating: '3-Proficient',
        proposedIncreasePercentage: 18,
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.outsideMatrix).toBe(false);
    });

    it('should reject negative proposed salary', () => {
      const result = proposalService.validateProposal({
        currentSalary: 50000,
        proposedSalary: -1000,
        performanceRating: '3-Proficient',
        proposedIncreasePercentage: -2,
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Proposed salary must be positive');
    });

    it('should reject proposed salary less than current', () => {
      const result = proposalService.validateProposal({
        currentSalary: 50000,
        proposedSalary: 40000,
        performanceRating: '3-Proficient',
        proposedIncreasePercentage: -20,
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Proposed salary must be greater than current salary');
    });

    it('should require justification when outside merit matrix', () => {
      const result = proposalService.validateProposal({
        currentSalary: 50000,
        proposedSalary: 80000,
        performanceRating: '1-Emerging',
        proposedIncreasePercentage: 60,
      });
      expect(result.valid).toBe(false);
      expect(result.outsideMatrix).toBe(true);
      expect(result.errors[0]).toContain('Justification is required');
    });

    it('should accept outside-matrix proposal with justification', () => {
      const result = proposalService.validateProposal({
        currentSalary: 50000,
        proposedSalary: 80000,
        performanceRating: '1-Emerging',
        proposedIncreasePercentage: 60,
        justification: 'Critical retention risk',
      });
      expect(result.valid).toBe(true);
      expect(result.outsideMatrix).toBe(true);
    });
  });

  // ─── createProposal ────────────────────────────────────────────────────

  describe('createProposal', () => {
    beforeEach(() => {
      CompensationCycle.findById.mockResolvedValue(mockCycle);
      Employee.findById.mockResolvedValue(mockEmployee);
      RevisionProposal.findOne.mockResolvedValue(null);
    });

    it('should create a proposal successfully', async () => {
      const createdProposal = { ...mockProposal, save: jest.fn() };
      RevisionProposal.create.mockResolvedValue(createdProposal);

      const result = await proposalService.createProposal(
        mockTenantId,
        {
          compensationCycleId: mockCycleId,
          employeeId: mockEmployeeId,
          proposedSalary: 59000,
          performanceRating: '3-Proficient',
        },
        mockUserId,
      );

      expect(result).toEqual(createdProposal);
      expect(RevisionProposal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: mockTenantId,
          employeeId: mockEmployeeId,
          currentSalary: 50000,
          proposedSalary: 59000,
          proposedIncreasePercentage: 18,
        }),
      );
    });

    it('should throw when required fields are missing', async () => {
      await expect(
        proposalService.createProposal(mockTenantId, {}, mockUserId),
      ).rejects.toThrow('required');
    });

    it('should throw when compensation cycle not found', async () => {
      CompensationCycle.findById.mockResolvedValue(null);

      await expect(
        proposalService.createProposal(
          mockTenantId,
          {
            compensationCycleId: mockCycleId,
            employeeId: mockEmployeeId,
            proposedSalary: 59000,
            performanceRating: '3-Proficient',
          },
          mockUserId,
        ),
      ).rejects.toThrow('Compensation cycle not found');
    });

    it('should throw when employee not found', async () => {
      Employee.findById.mockResolvedValue(null);

      await expect(
        proposalService.createProposal(
          mockTenantId,
          {
            compensationCycleId: mockCycleId,
            employeeId: mockEmployeeId,
            proposedSalary: 59000,
            performanceRating: '3-Proficient',
          },
          mockUserId,
        ),
      ).rejects.toThrow('Employee not found');
    });

    it('should throw when proposal already exists for employee in cycle', async () => {
      RevisionProposal.findOne.mockResolvedValue(mockProposal);

      await expect(
        proposalService.createProposal(
          mockTenantId,
          {
            compensationCycleId: mockCycleId,
            employeeId: mockEmployeeId,
            proposedSalary: 59000,
            performanceRating: '3-Proficient',
          },
          mockUserId,
        ),
      ).rejects.toThrow('already exists');
    });
  });

  // ─── listProposals ─────────────────────────────────────────────────────

  describe('listProposals', () => {
    it('should return proposals with pagination', async () => {
      const mockProposals = [mockProposal];
      const mockChain = createMockQuery(mockProposals);
      RevisionProposal.find.mockReturnValue(mockChain);
      RevisionProposal.countDocuments.mockResolvedValue(1);

      const result = await proposalService.listProposals(mockTenantId, {}, { page: 1, limit: 10 });

      expect(result.proposals).toEqual(mockProposals);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('should filter by status', async () => {
      RevisionProposal.find.mockReturnValue(createMockQuery([]));
      RevisionProposal.countDocuments.mockResolvedValue(0);

      await proposalService.listProposals(mockTenantId, { status: 'Submitted' }, {});

      expect(RevisionProposal.find).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'Submitted' }),
      );
    });

    it('should filter by outside merit matrix', async () => {
      RevisionProposal.find.mockReturnValue(createMockQuery([]));
      RevisionProposal.countDocuments.mockResolvedValue(0);

      await proposalService.listProposals(mockTenantId, { isOutsideMeritMatrix: true }, {});

      expect(RevisionProposal.find).toHaveBeenCalledWith(
        expect.objectContaining({ isOutsideMeritMatrix: true }),
      );
    });
  });

  // ─── getProposal ───────────────────────────────────────────────────────

  describe('getProposal', () => {
    it('should return a found proposal', async () => {
      RevisionProposal.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        then: (resolve) => resolve(mockProposal),
      });

      const result = await proposalService.getProposal(mockProposalId, mockTenantId);
      expect(result).toEqual(mockProposal);
    });

    it('should throw when proposal not found', async () => {
      RevisionProposal.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        then: (resolve) => resolve(null),
      });

      await expect(
        proposalService.getProposal(mockProposalId, mockTenantId),
      ).rejects.toThrow('Proposal not found');
    });
  });

  // ─── Workflow Transitions ──────────────────────────────────────────────

  describe('submitProposal', () => {
    it('should submit a draft proposal', async () => {
      const draftProposal = {
        ...mockProposal,
        status: 'Draft',
        save: jest.fn(),
        approvalHistory: [],
      };
      RevisionProposal.findOne.mockResolvedValue(draftProposal);

      const result = await proposalService.submitProposal(mockProposalId, mockTenantId, mockUserId);

      expect(result.status).toBe('Submitted');
      expect(result.save).toHaveBeenCalled();
      expect(result.approvalHistory).toHaveLength(1);
      expect(result.approvalHistory[0].action).toBe('Submitted');
    });

    it('should throw when proposal is not in Draft status', async () => {
      RevisionProposal.findOne.mockResolvedValue({
        ...mockProposal,
        status: 'Submitted',
      });

      await expect(
        proposalService.submitProposal(mockProposalId, mockTenantId, mockUserId),
      ).rejects.toThrow('Cannot submit');
    });

    it('should throw when proposal not found', async () => {
      RevisionProposal.findOne.mockResolvedValue(null);

      await expect(
        proposalService.submitProposal(mockProposalId, mockTenantId, mockUserId),
      ).rejects.toThrow('Proposal not found');
    });
  });

  describe('managerApprove', () => {
    it('should approve a submitted proposal', async () => {
      const submittedProposal = {
        ...mockProposal,
        status: 'Submitted',
        save: jest.fn(),
        approvalHistory: [],
      };
      RevisionProposal.findOne.mockResolvedValue(submittedProposal);

      const result = await proposalService.managerApprove(
        mockProposalId, mockTenantId, mockUserId, 'Looks good',
      );

      expect(result.status).toBe('Manager_Approved');
      expect(result.approvalHistory).toHaveLength(1);
      expect(result.approvalHistory[0].comment).toBe('Looks good');
    });

    it('should throw when proposal is not in Submitted status', async () => {
      RevisionProposal.findOne.mockResolvedValue({
        ...mockProposal,
        status: 'Draft',
      });

      await expect(
        proposalService.managerApprove(mockProposalId, mockTenantId, mockUserId),
      ).rejects.toThrow('Cannot approve');
    });
  });

  describe('financeApprove', () => {
    it('should finance-approve a manager-approved proposal', async () => {
      const maProposal = {
        ...mockProposal,
        status: 'Manager_Approved',
        save: jest.fn(),
        approvalHistory: [],
      };
      RevisionProposal.findOne.mockResolvedValue(maProposal);

      const result = await proposalService.financeApprove(
        mockProposalId, mockTenantId, mockUserId, 'Approved',
      );

      expect(result.status).toBe('Finance_Approved');
      expect(result.approvalHistory).toHaveLength(1);
    });

    it('should throw when proposal is not in Manager_Approved status', async () => {
      RevisionProposal.findOne.mockResolvedValue({
        ...mockProposal,
        status: 'Submitted',
      });

      await expect(
        proposalService.financeApprove(mockProposalId, mockTenantId, mockUserId),
      ).rejects.toThrow('Cannot finance-approve');
    });
  });

  describe('rejectProposal', () => {
    it('should reject a submitted proposal', async () => {
      const submittedProposal = {
        ...mockProposal,
        status: 'Submitted',
        save: jest.fn(),
        approvalHistory: [],
      };
      RevisionProposal.findOne.mockResolvedValue(submittedProposal);

      const result = await proposalService.rejectProposal(
        mockProposalId, mockTenantId, mockUserId, 'Over budget',
      );

      expect(result.status).toBe('Rejected');
      expect(result.approvalHistory[0].action).toBe('Rejected');
      expect(result.approvalHistory[0].comment).toBe('Over budget');
    });

    it('should reject a manager-approved proposal', async () => {
      const maProposal = {
        ...mockProposal,
        status: 'Manager_Approved',
        save: jest.fn(),
        approvalHistory: [],
      };
      RevisionProposal.findOne.mockResolvedValue(maProposal);

      const result = await proposalService.rejectProposal(
        mockProposalId, mockTenantId, mockUserId, 'Finance disagrees',
      );

      expect(result.status).toBe('Rejected');
    });

    it('should throw when no reason provided', async () => {
      await expect(
        proposalService.rejectProposal(mockProposalId, mockTenantId, mockUserId, ''),
      ).rejects.toThrow('Rejection reason is required');
    });

    it('should throw when proposal is in invalid status for rejection', async () => {
      RevisionProposal.findOne.mockResolvedValue({
        ...mockProposal,
        status: 'Finance_Approved',
      });

      await expect(
        proposalService.rejectProposal(mockProposalId, mockTenantId, mockUserId, 'reason'),
      ).rejects.toThrow('Cannot reject');
    });
  });

  describe('resubmitProposal', () => {
    it('should resubmit a rejected proposal with updated salary', async () => {
      const rejectedProposal = {
        ...mockProposal,
        status: 'Rejected',
        version: 1,
        save: jest.fn(),
        approvalHistory: [],
      };
      RevisionProposal.findOne.mockResolvedValue(rejectedProposal);

      const result = await proposalService.resubmitProposal(
        mockProposalId, mockTenantId,
        { proposedSalary: 55000, justification: 'Reconsidered' },
        mockUserId,
      );

      expect(result.status).toBe('Draft');
      expect(result.version).toBe(2);
      expect(result.proposedSalary).toBe(55000);
      expect(result.proposedIncreaseAmount).toBe(5000);
      expect(result.proposedIncreasePercentage).toBe(10);
    });

    it('should throw when proposal is not rejected', async () => {
      RevisionProposal.findOne.mockResolvedValue({
        ...mockProposal,
        status: 'Draft',
      });

      await expect(
        proposalService.resubmitProposal(mockProposalId, mockTenantId, {}, mockUserId),
      ).rejects.toThrow('Only rejected proposals can be resubmitted');
    });
  });

  // ─── updateProposal ────────────────────────────────────────────────────

  describe('updateProposal', () => {
    it('should update a draft proposal', async () => {
      const draftProposal = {
        ...mockProposal,
        status: 'Draft',
        save: jest.fn(),
      };
      RevisionProposal.findOne.mockResolvedValue(draftProposal);
      CompensationCycle.findById.mockResolvedValue(mockCycle);

      const result = await proposalService.updateProposal(
        mockProposalId, mockTenantId,
        { proposedSalary: 62000 },
        mockUserId,
      );

      expect(result.proposedSalary).toBe(62000);
      expect(result.save).toHaveBeenCalled();
    });

    it('should throw when trying to update non-draft proposal', async () => {
      RevisionProposal.findOne.mockResolvedValue({
        ...mockProposal,
        status: 'Submitted',
      });

      await expect(
        proposalService.updateProposal(mockProposalId, mockTenantId, { proposedSalary: 62000 }, mockUserId),
      ).rejects.toThrow('Only draft proposals can be edited');
    });
  });

  // ─── Bulk Operations ──────────────────────────────────────────────────

  describe('bulkCreateProposals', () => {
    it('should create multiple proposals', async () => {
      const proposals = [
        { employeeId: 'emp1', proposedSalary: 55000, performanceRating: '3-Proficient' },
        { employeeId: 'emp2', proposedSalary: 60000, performanceRating: '4-Exceeds' },
      ];

      CompensationCycle.findById.mockResolvedValue(mockCycle);
      Employee.findById.mockResolvedValue(mockEmployee);
      RevisionProposal.findOne.mockResolvedValue(null);
      RevisionProposal.create.mockResolvedValue(mockProposal);

      const result = await proposalService.bulkCreateProposals(
        mockTenantId, proposals, mockUserId,
      );

      expect(result.created).toBe(2);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle partial failures gracefully', async () => {
      const proposals = [
        { employeeId: 'emp1', proposedSalary: 55000, performanceRating: '3-Proficient' },
        { employeeId: 'emp2', proposedSalary: 60000, performanceRating: '4-Exceeds' },
      ];

      let callCount = 0;
      CompensationCycle.findById.mockImplementation(() => {
        callCount++;
        if (callCount === 2) return Promise.resolve(null);
        return Promise.resolve(mockCycle);
      });
      Employee.findById.mockResolvedValue(mockEmployee);
      RevisionProposal.findOne.mockResolvedValue(null);
      RevisionProposal.create.mockResolvedValue(mockProposal);

      const result = await proposalService.bulkCreateProposals(
        mockTenantId, proposals, mockUserId,
      );

      expect(result.created).toBe(1);
      expect(result.skipped).toBe(1);
    });

    it('should throw when empty array provided', async () => {
      await expect(
        proposalService.bulkCreateProposals(mockTenantId, [], mockUserId),
      ).rejects.toThrow('At least one proposal');
    });
  });

  describe('bulkSubmitProposals', () => {
    it('should submit all draft proposals for a cycle', async () => {
      const drafts = [
        { ...mockProposal, status: 'Draft', save: jest.fn(), approvalHistory: [] },
        { ...mockProposal, _id: 'prop456', status: 'Draft', save: jest.fn(), approvalHistory: [] },
      ];
      RevisionProposal.find.mockResolvedValue(drafts);

      const result = await proposalService.bulkSubmitProposals(
        mockTenantId, mockCycleId, mockUserId,
      );

      expect(result.submitted).toBe(2);
      expect(drafts[0].save).toHaveBeenCalled();
      expect(drafts[1].save).toHaveBeenCalled();
    });

    it('should throw when no draft proposals found', async () => {
      RevisionProposal.find.mockResolvedValue([]);

      await expect(
        proposalService.bulkSubmitProposals(mockTenantId, mockCycleId, mockUserId),
      ).rejects.toThrow('No draft proposals found');
    });
  });

  // ─── Analytics & Reporting ─────────────────────────────────────────────

  describe('getCycleSummary', () => {
    it('should return summary statistics', async () => {
      const proposals = [
        { ...mockProposal, proposedIncreaseAmount: 9000, proposedIncreasePercentage: 18, isOutsideMeritMatrix: false, employeeId: { department: 'Engineering' } },
        { ...mockProposal, _id: 'p2', proposedIncreaseAmount: 12000, proposedIncreasePercentage: 24, isOutsideMeritMatrix: true, employeeId: { department: 'Sales' } },
      ];
      RevisionProposal.find.mockResolvedValue(proposals);

      const result = await proposalService.getCycleSummary(mockTenantId, mockCycleId);

      expect(result.totalProposals).toBe(2);
      expect(result.totalIncreaseCost).toBe(21000);
      expect(result.averageIncreasePercent).toBe(21);
      expect(result.outsideMatrixCount).toBe(1);
      expect(result.byDepartment).toHaveProperty('Engineering');
      expect(result.byDepartment).toHaveProperty('Sales');
    });

    it('should return empty summary when no proposals', async () => {
      RevisionProposal.find.mockResolvedValue([]);

      const result = await proposalService.getCycleSummary(mockTenantId, mockCycleId);

      expect(result.totalProposals).toBe(0);
      expect(result.totalIncreaseCost).toBe(0);
    });
  });

  describe('getManagerPendingApprovals', () => {
    it('should return pending approvals for a manager', async () => {
      const pending = [{ ...mockProposal, status: 'Submitted' }];
      RevisionProposal.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        then: (resolve) => resolve(pending),
      });

      const result = await proposalService.getManagerPendingApprovals(mockTenantId, mockUserId);

      expect(result).toEqual(pending);
      expect(RevisionProposal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          managerId: mockUserId,
          status: { $in: ['Submitted', 'Manager_Approved'] },
        }),
      );
    });
  });
});
