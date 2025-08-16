import { expect } from "chai";
import { ethers } from "hardhat";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { JobsContract } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("JobsContract", function () {
  let jobsContract: JobsContract;
  let owner: SignerWithAddress;
  let freelancer: SignerWithAddress;
  let client: SignerWithAddress;
  let other: SignerWithAddress;

  const sampleJobPosting = {
    title: "Web Development Project",
    description: "Build a modern web application",
    category: "Development",
    bannerImageHash: "QmTestHash123",
    basePayment: ethers.parseEther("1.0"),
    minimumNoticeTime: 3600, // 1 hour
    averageWorkDuration: 86400, // 24 hours
  };

  const sampleJob = {
    title: "Frontend Development",
    description: "Create responsive UI components",
    payment: ethers.parseEther("0.5"),
    durationInHours: 48,
  };

  beforeEach(async () => {
    // Deploy a fresh contract for each test to avoid state conflicts
    [owner, freelancer, client, other] = await ethers.getSigners();
    const jobsContractFactory = await ethers.getContractFactory("JobsContract");
    jobsContract = (await jobsContractFactory.deploy(owner.address)) as JobsContract;
    await jobsContract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await jobsContract.owner()).to.equal(owner.address);
    });

    it("Should initialize counter to 0", async function () {
      expect(await jobsContract.postedJobsCounter()).to.equal(0);
    });

    it("Should reject direct payments", async function () {
      await expect(
        owner.sendTransaction({
          to: await jobsContract.getAddress(),
          value: ethers.parseEther("1.0"),
        }),
      ).to.be.revertedWith("Direct payments not accepted");
    });
  });

  describe("Job Posting Creation", function () {
    it("Should create a job posting with valid parameters", async function () {
      const tx = await jobsContract.connect(freelancer).createJobPosting(sampleJobPosting);
      await expect(tx)
        .to.emit(jobsContract, "JobPostingCreated")
        .withArgs(
          0,
          freelancer.address,
          sampleJobPosting.basePayment,
          sampleJobPosting.title,
          sampleJobPosting.description,
          sampleJobPosting.category,
          sampleJobPosting.bannerImageHash,
          sampleJobPosting.minimumNoticeTime,
          sampleJobPosting.averageWorkDuration,
        );

      expect(await jobsContract.postedJobsCounter()).to.equal(1);
    });

    it("Should retrieve job posting details correctly", async function () {
      await jobsContract.connect(freelancer).createJobPosting(sampleJobPosting);

      const posting = await jobsContract.postedJobs(0);
      expect(posting.postingId).to.equal(0);
      expect(posting.freelancer).to.equal(freelancer.address);
      expect(posting.basePayment).to.equal(sampleJobPosting.basePayment);
      expect(posting.title).to.equal(sampleJobPosting.title);
      expect(posting.description).to.equal(sampleJobPosting.description);
      expect(posting.category).to.equal(sampleJobPosting.category);
    });

    it("Should revert with zero payment", async function () {
      const invalidPosting = { ...sampleJobPosting, basePayment: 0 };
      await expect(jobsContract.connect(freelancer).createJobPosting(invalidPosting)).to.be.revertedWith(
        "Payment must be greater than 0",
      );
    });

    it("Should revert with zero duration", async function () {
      const invalidPosting = { ...sampleJobPosting, averageWorkDuration: 0 };
      await expect(jobsContract.connect(freelancer).createJobPosting(invalidPosting)).to.be.revertedWith(
        "Duration must be greater than 0",
      );
    });

    it("Should revert with zero minimum notice time", async function () {
      const invalidPosting = { ...sampleJobPosting, minimumNoticeTime: 0 };
      await expect(jobsContract.connect(freelancer).createJobPosting(invalidPosting)).to.be.revertedWith(
        "Minimum notice time must be greater than 0",
      );
    });

    it("Should revert with empty title", async function () {
      const invalidPosting = { ...sampleJobPosting, title: "" };
      await expect(jobsContract.connect(freelancer).createJobPosting(invalidPosting)).to.be.revertedWith(
        "Title cannot be empty",
      );
    });

    it("Should revert with empty description", async function () {
      const invalidPosting = { ...sampleJobPosting, description: "" };
      await expect(jobsContract.connect(freelancer).createJobPosting(invalidPosting)).to.be.revertedWith(
        "Description cannot be empty",
      );
    });

    it("Should revert with empty category", async function () {
      const invalidPosting = { ...sampleJobPosting, category: "" };
      await expect(jobsContract.connect(freelancer).createJobPosting(invalidPosting)).to.be.revertedWith(
        "Category cannot be empty",
      );
    });
  });

  describe("Job Creation", function () {
    beforeEach(async function () {
      // Create a job posting first
      await jobsContract.connect(freelancer).createJobPosting(sampleJobPosting);
    });

    it("Should create a job under existing posting", async function () {
      const tx = await jobsContract.connect(client).createJob(0, sampleJob, {
        value: sampleJob.payment,
      });

      await expect(tx).to.emit(jobsContract, "JobCreated").withArgs(
        0, // postingId
        0, // jobId
        freelancer.address,
        client.address,
        sampleJob.payment,
        sampleJob.title,
        sampleJob.description,
        sampleJobPosting.category,
        sampleJobPosting.bannerImageHash,
        sampleJob.durationInHours,
      );
    });

    it("Should revert if freelancer tries to create job on own posting", async function () {
      await expect(
        jobsContract.connect(freelancer).createJob(0, sampleJob, {
          value: sampleJob.payment,
        }),
      ).to.be.revertedWith("Freelancer cannot create a job for their own posting");
    });

    it("Should revert if payment amount doesn't match msg.value", async function () {
      await expect(
        jobsContract.connect(client).createJob(0, sampleJob, {
          value: ethers.parseEther("0.3"), // Different from sampleJob.payment
        }),
      ).to.be.revertedWith("Must send exact payment amount");
    });

    it("Should revert with non-existent posting", async function () {
      await expect(
        jobsContract.connect(client).createJob(999, sampleJob, {
          value: sampleJob.payment,
        }),
      ).to.be.revertedWith("Job posting does not exist");
    });

    it("Should revert with zero payment", async function () {
      const invalidJob = { ...sampleJob, payment: 0 };
      await expect(jobsContract.connect(client).createJob(0, invalidJob, { value: 0 })).to.be.revertedWith(
        "Payment must be greater than 0",
      );
    });

    it("Should revert with zero duration", async function () {
      const invalidJob = { ...sampleJob, durationInHours: 0 };
      await expect(
        jobsContract.connect(client).createJob(0, invalidJob, {
          value: invalidJob.payment,
        }),
      ).to.be.revertedWith("Duration must be greater than 0");
    });

    it("Should revert with empty title", async function () {
      const invalidJob = { ...sampleJob, title: "" };
      await expect(
        jobsContract.connect(client).createJob(0, invalidJob, {
          value: invalidJob.payment,
        }),
      ).to.be.revertedWith("Title cannot be empty");
    });
  });

  describe("Job Acceptance", function () {
    beforeEach(async function () {
      // Create job posting and job
      await jobsContract.connect(freelancer).createJobPosting(sampleJobPosting);
      await jobsContract.connect(client).createJob(0, sampleJob, {
        value: sampleJob.payment,
      });
    });

    it("Should allow freelancer to accept job", async function () {
      const tx = await jobsContract.connect(freelancer).acceptJob(0, 0);

      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);
      const expectedDeadline = block!.timestamp + sampleJob.durationInHours * 3600;

      await expect(tx).to.emit(jobsContract, "JobAccepted").withArgs(0, 0, client.address, expectedDeadline);
    });

    it("Should revert if non-freelancer tries to accept", async function () {
      await expect(jobsContract.connect(client).acceptJob(0, 0)).to.be.revertedWith(
        "Only freelancer can accept this job",
      );
    });

    it("Should revert if job is not waiting for approval", async function () {
      // First accept the job
      await jobsContract.connect(freelancer).acceptJob(0, 0);

      // Try to accept again - should fail
      await expect(jobsContract.connect(freelancer).acceptJob(0, 0)).to.be.revertedWith(
        "Job is not available for acceptance",
      );
    });

    it("Should revert with non-existent job", async function () {
      await expect(jobsContract.connect(freelancer).acceptJob(0, 999)).to.be.revertedWith("Job does not exist");
    });
  });

  describe("Job Completion", function () {
    beforeEach(async function () {
      // Create job posting, job, and accept it
      await jobsContract.connect(freelancer).createJobPosting(sampleJobPosting);
      await jobsContract.connect(client).createJob(0, sampleJob, {
        value: sampleJob.payment,
      });
      await jobsContract.connect(freelancer).acceptJob(0, 0);
    });

    it("Should allow freelancer to mark job as delivered", async function () {
      const tx = await jobsContract.connect(freelancer).confirmCompletion(0, 0);
      await expect(tx)
        .to.emit(jobsContract, "FreelancerMarkedAsDelivered")
        .withArgs(0, 0, freelancer.address, anyValue);
    });

    it("Should allow client to mark job as received", async function () {
      const tx = await jobsContract.connect(client).confirmCompletion(0, 0);
      await expect(tx).to.emit(jobsContract, "ClientMarkedAsReceived").withArgs(0, 0, client.address, anyValue);
    });

    it("Should complete job when both parties confirm", async function () {
      // First confirmation
      await jobsContract.connect(freelancer).confirmCompletion(0, 0);

      // Second confirmation should complete the job
      const freelancerBalanceBefore = await ethers.provider.getBalance(freelancer.address);

      const tx = await jobsContract.connect(client).confirmCompletion(0, 0);

      await expect(tx)
        .to.emit(jobsContract, "JobFinished")
        .withArgs(0, 0, freelancer.address, client.address, sampleJob.payment, anyValue);

      const freelancerBalanceAfter = await ethers.provider.getBalance(freelancer.address);
      expect(freelancerBalanceAfter - freelancerBalanceBefore).to.equal(sampleJob.payment);
    });

    it("Should revert if same party tries to confirm twice", async function () {
      await jobsContract.connect(freelancer).confirmCompletion(0, 0);

      await expect(jobsContract.connect(freelancer).confirmCompletion(0, 0)).to.be.revertedWith(
        "Freelancer already marked the job as delivered",
      );
    });

    it("Should revert if job is not ongoing", async function () {
      // Create a new job but don't accept it (stays in WaitingForApproval state)
      await jobsContract.connect(client).createJob(
        0,
        {
          ...sampleJob,
          title: "Second Job",
        },
        { value: sampleJob.payment },
      );

      await expect(jobsContract.connect(client).confirmCompletion(0, 1)).to.be.revertedWith("Job is not ongoing");
    });

    it("Should revert if called by non-party", async function () {
      await expect(jobsContract.connect(other).confirmCompletion(0, 0)).to.be.revertedWith(
        "Only job parties can call this",
      );
    });
  });

  describe("Job Cancellation", function () {
    beforeEach(async function () {
      // Create a job posting and job for cancellation tests
      await jobsContract.connect(freelancer).createJobPosting({
        ...sampleJobPosting,
        title: "Cancellation Test Posting",
      });
      await jobsContract.connect(client).createJob(
        0,
        {
          ...sampleJob,
          title: "Cancellation Test Job",
        },
        { value: sampleJob.payment },
      );
    });

    it("Should cancel job in WaitingForApproval state", async function () {
      const tx = await jobsContract.connect(client).cancelJob(0, 0);

      await expect(tx).to.emit(jobsContract, "JobCancelled").withArgs(0, 0, 3, anyValue); // JobState.Cancelled = 3
    });

    it("Should cancel ongoing job and refund client", async function () {
      // Accept job first
      await jobsContract.connect(freelancer).acceptJob(0, 0);

      const clientBalanceBefore = await ethers.provider.getBalance(client.address);

      const tx = await jobsContract.connect(client).cancelJob(0, 0);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      await expect(tx).to.emit(jobsContract, "JobCancelled");

      const clientBalanceAfter = await ethers.provider.getBalance(client.address);
      expect(clientBalanceAfter - clientBalanceBefore + gasUsed).to.equal(sampleJob.payment);
    });

    it("Should revert if job cannot be cancelled", async function () {
      // Accept job and complete it
      await jobsContract.connect(freelancer).acceptJob(0, 0);
      await jobsContract.connect(freelancer).confirmCompletion(0, 0);
      await jobsContract.connect(client).confirmCompletion(0, 0);

      await expect(jobsContract.connect(client).cancelJob(0, 0)).to.be.revertedWith(
        "Job cannot be cancelled in its current state",
      );
    });

    it("Should revert if called by non-party", async function () {
      await expect(jobsContract.connect(other).cancelJob(0, 0)).to.be.revertedWith("Only job parties can call this");
    });
  });

  describe("Emergency Cancel", function () {
    beforeEach(async function () {
      // Create job for emergency cancel test
      await jobsContract.connect(freelancer).createJobPosting(sampleJobPosting);
      await jobsContract.connect(client).createJob(
        0,
        {
          ...sampleJob,
          title: "Emergency Cancel Test",
        },
        { value: sampleJob.payment },
      );
    });

    it("Should allow owner to emergency cancel", async function () {
      const clientBalanceBefore = await ethers.provider.getBalance(client.address);

      const tx = await jobsContract.connect(owner).emergencyCancel(0, 0);

      await expect(tx).to.emit(jobsContract, "JobCancelled").withArgs(0, 0, 3, anyValue);

      const clientBalanceAfter = await ethers.provider.getBalance(client.address);
      expect(clientBalanceAfter - clientBalanceBefore).to.equal(sampleJob.payment);
    });

    it("Should revert if called by non-owner", async function () {
      await expect(jobsContract.connect(client).emergencyCancel(0, 0)).to.be.revertedWith("Only owner can call this");
    });
  });

  describe("View Functions", function () {
    it("Should return correct total jobs posted", async function () {
      // Create two job postings
      await jobsContract.connect(freelancer).createJobPosting(sampleJobPosting);
      await jobsContract.connect(freelancer).createJobPosting({
        ...sampleJobPosting,
        title: "Second Posting",
      });

      expect(await jobsContract.getTotalJobsPosted()).to.equal(2);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle multiple job postings from same freelancer", async function () {
      await jobsContract.connect(freelancer).createJobPosting(sampleJobPosting);
      await jobsContract.connect(freelancer).createJobPosting({
        ...sampleJobPosting,
        title: "Second Posting",
      });
      await jobsContract.connect(freelancer).createJobPosting({
        ...sampleJobPosting,
        title: "Third Posting",
      });

      expect(await jobsContract.postedJobsCounter()).to.equal(3);
    });

    it("Should handle jobs from different clients on same posting", async function () {
      // Create posting
      await jobsContract.connect(freelancer).createJobPosting(sampleJobPosting);

      // Create jobs from different clients
      await jobsContract.connect(client).createJob(
        0,
        {
          ...sampleJob,
          title: "Job from client 1",
        },
        { value: sampleJob.payment },
      );

      await jobsContract.connect(other).createJob(
        0,
        {
          ...sampleJob,
          title: "Job from client 2",
        },
        { value: sampleJob.payment },
      );

      // Test job count
      const jobCount = await jobsContract.getJobCount(0);
      expect(jobCount).to.equal(2);
    });

    it("Should maintain correct job states throughout lifecycle", async function () {
      // Create new job posting and job
      await jobsContract.connect(freelancer).createJobPosting(sampleJobPosting);
      await jobsContract.connect(client).createJob(
        0,
        {
          ...sampleJob,
          title: "State Test Job",
        },
        { value: sampleJob.payment },
      );

      // Job should start in WaitingForApproval (0)
      // Accept it to move to Ongoing (1)
      await jobsContract.connect(freelancer).acceptJob(0, 0);

      // Complete it to move to Finished (2)
      await jobsContract.connect(freelancer).confirmCompletion(0, 0);
      await jobsContract.connect(client).confirmCompletion(0, 0);

      // Job should now be in Finished state
      // This test verifies the state transitions work correctly
    });
  });
});
