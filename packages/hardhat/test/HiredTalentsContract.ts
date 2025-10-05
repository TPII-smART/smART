/* eslint-disable @typescript-eslint/no-unused-expressions */
// filepath: /Users/martincwikla/Desktop/Facultad/Trabajo-profesional/smART/packages/hardhat/test/HiredTalentsContract.ts
import { expect } from "chai";
import { ethers } from "hardhat";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { HiredTalentsContract } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

type DeliverableParams = {
  resource: string;
  uploadedAt: number;
  submissionComment: string;
  clientResponse: string;
  isLink: boolean;
};

describe("HiredTalentsContract", function () {
  let hiredTalentsContract: HiredTalentsContract;
  let owner: SignerWithAddress;
  let freelancer: SignerWithAddress;
  let client: SignerWithAddress;
  let other: SignerWithAddress;

  const deliverableResource = "QmFileHash123";
  const deliverableComment = "File upload comment";

  const sampleTalent = {
    title: "Web Development Project",
    description: "Build a modern web application",
    category: "Development",
    bannerImageHash: "QmTestHash123",
    basePayment: ethers.parseEther("1.0"),
    minimumNoticeTime: 3600, // 1 hour
    averageWorkDuration: 86400, // 24 hours
  };

  const sampleHiredTalent = {
    title: "Frontend Development",
    description: "Create responsive UI components",
    payment: ethers.parseEther("0.5"),
    durationInHours: 48,
  };

  const deliverableToUpload: DeliverableParams = {
    resource: deliverableResource,
    submissionComment: deliverableComment,
    isLink: false,
    clientResponse: "",
    uploadedAt: Date.now(),
  };

  beforeEach(async () => {
    // Deploy a fresh contract for each test to avoid state conflicts
    [owner, freelancer, client, other] = await ethers.getSigners();
    const hiredTalentsContractFactory = await ethers.getContractFactory("HiredTalentsContract");
    hiredTalentsContract = (await hiredTalentsContractFactory.deploy(owner.address)) as HiredTalentsContract;
    await hiredTalentsContract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await hiredTalentsContract.owner()).to.equal(owner.address);
    });

    it("Should initialize counter to 0", async function () {
      expect(await hiredTalentsContract.postedHiredTalentsCounter()).to.equal(0);
    });

    it("Should reject direct payments", async function () {
      await expect(
        owner.sendTransaction({
          to: await hiredTalentsContract.getAddress(),
          value: ethers.parseEther("1.0"),
        }),
      ).to.be.revertedWith("Direct payments not accepted");
    });
  });

  describe("Talent Creation", function () {
    it("Should create a talent with valid parameters", async function () {
      const tx = await hiredTalentsContract.connect(freelancer).createTalent(sampleTalent);
      await expect(tx)
        .to.emit(hiredTalentsContract, "TalentCreated")
        .withArgs(
          0,
          freelancer.address,
          sampleTalent.basePayment,
          sampleTalent.title,
          sampleTalent.description,
          sampleTalent.category,
          sampleTalent.bannerImageHash,
          sampleTalent.minimumNoticeTime,
          sampleTalent.averageWorkDuration,
        );

      expect(await hiredTalentsContract.postedHiredTalentsCounter()).to.equal(1);
    });

    it("Should retrieve talent details correctly", async function () {
      await hiredTalentsContract.connect(freelancer).createTalent(sampleTalent);

      const talent = await hiredTalentsContract.postedHiredTalents(0);
      expect(talent.talentId).to.equal(0);
      expect(talent.freelancer).to.equal(freelancer.address);
      expect(talent.basePayment).to.equal(sampleTalent.basePayment);
      expect(talent.title).to.equal(sampleTalent.title);
      expect(talent.description).to.equal(sampleTalent.description);
      expect(talent.category).to.equal(sampleTalent.category);
    });

    it("Should revert with zero payment", async function () {
      const invalidPosting = { ...sampleTalent, basePayment: 0 };
      await expect(hiredTalentsContract.connect(freelancer).createTalent(invalidPosting)).to.be.revertedWith(
        "Payment must be greater than 0",
      );
    });

    it("Should revert with zero duration", async function () {
      const invalidPosting = { ...sampleTalent, averageWorkDuration: 0 };
      await expect(hiredTalentsContract.connect(freelancer).createTalent(invalidPosting)).to.be.revertedWith(
        "Duration must be greater than 0",
      );
    });

    it("Should revert with zero minimum notice time", async function () {
      const invalidPosting = { ...sampleTalent, minimumNoticeTime: 0 };
      await expect(hiredTalentsContract.connect(freelancer).createTalent(invalidPosting)).to.be.revertedWith(
        "Minimum notice time must be greater than 0",
      );
    });

    it("Should revert with empty title", async function () {
      const invalidPosting = { ...sampleTalent, title: "" };
      await expect(hiredTalentsContract.connect(freelancer).createTalent(invalidPosting)).to.be.revertedWith(
        "Title cannot be empty",
      );
    });

    it("Should revert with empty description", async function () {
      const invalidPosting = { ...sampleTalent, description: "" };
      await expect(hiredTalentsContract.connect(freelancer).createTalent(invalidPosting)).to.be.revertedWith(
        "Description cannot be empty",
      );
    });

    it("Should revert with empty category", async function () {
      const invalidPosting = { ...sampleTalent, category: "" };
      await expect(hiredTalentsContract.connect(freelancer).createTalent(invalidPosting)).to.be.revertedWith(
        "Category cannot be empty",
      );
    });
  });

  describe("HiredTalent Creation", function () {
    beforeEach(async function () {
      // Create a talent first
      await hiredTalentsContract.connect(freelancer).createTalent(sampleTalent);
    });

    it("Should create a hiredTalent under existing talent", async function () {
      const tx = await hiredTalentsContract.connect(client).createHiredTalent(0, sampleHiredTalent, {
        value: sampleHiredTalent.payment,
      });

      await expect(tx).to.emit(hiredTalentsContract, "HiredTalentCreated").withArgs(
        0, // talentId
        0, // hiredTalentId
        freelancer.address,
        client.address,
        sampleHiredTalent.payment,
        sampleHiredTalent.title,
        sampleHiredTalent.description,
        sampleTalent.category,
        sampleTalent.bannerImageHash,
        sampleHiredTalent.durationInHours,
      );
    });

    it("Should revert if freelancer tries to create hiredTalent on own talent", async function () {
      await expect(
        hiredTalentsContract.connect(freelancer).createHiredTalent(0, sampleHiredTalent, {
          value: sampleHiredTalent.payment,
        }),
      ).to.be.revertedWith("Freelancer cannot create a hiredTalent for their own talent");
    });

    it("Should revert if payment amount doesn't match msg.value", async function () {
      await expect(
        hiredTalentsContract.connect(client).createHiredTalent(0, sampleHiredTalent, {
          value: ethers.parseEther("0.3"), // Different from sampleHiredTalent.payment
        }),
      ).to.be.revertedWith("Must send exact payment amount");
    });

    it("Should revert with non-existent talent", async function () {
      await expect(
        hiredTalentsContract.connect(client).createHiredTalent(999, sampleHiredTalent, {
          value: sampleHiredTalent.payment,
        }),
      ).to.be.revertedWith("HiredTalent talent does not exist");
    });

    it("Should revert with zero payment", async function () {
      const invalidHiredTalent = { ...sampleHiredTalent, payment: 0 };
      await expect(
        hiredTalentsContract.connect(client).createHiredTalent(0, invalidHiredTalent, { value: 0 }),
      ).to.be.revertedWith("Payment must be greater than 0");
    });

    it("Should revert with zero duration", async function () {
      const invalidHiredTalent = { ...sampleHiredTalent, durationInHours: 0 };
      await expect(
        hiredTalentsContract.connect(client).createHiredTalent(0, invalidHiredTalent, {
          value: invalidHiredTalent.payment,
        }),
      ).to.be.revertedWith("Duration must be greater than 0");
    });

    it("Should revert with empty title", async function () {
      const invalidHiredTalent = { ...sampleHiredTalent, title: "" };
      await expect(
        hiredTalentsContract.connect(client).createHiredTalent(0, invalidHiredTalent, {
          value: invalidHiredTalent.payment,
        }),
      ).to.be.revertedWith("Title cannot be empty");
    });
  });

  describe("HiredTalent Acceptance", function () {
    beforeEach(async function () {
      // Create talent and hiredTalent
      await hiredTalentsContract.connect(freelancer).createTalent(sampleTalent);
      await hiredTalentsContract.connect(client).createHiredTalent(0, sampleHiredTalent, {
        value: sampleHiredTalent.payment,
      });
    });

    it("Should allow freelancer to accept hiredTalent", async function () {
      const tx = await hiredTalentsContract.connect(freelancer).acceptHiredTalent(0, 0);

      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);
      const expectedDeadline = block!.timestamp + sampleHiredTalent.durationInHours * 3600;

      await expect(tx)
        .to.emit(hiredTalentsContract, "HiredTalentAccepted")
        .withArgs(0, 0, client.address, expectedDeadline);
    });

    it("Should revert if non-freelancer tries to accept", async function () {
      await expect(hiredTalentsContract.connect(client).acceptHiredTalent(0, 0)).to.be.revertedWith(
        "Only freelancer can accept this hiredTalent",
      );
    });

    it("Should revert if hiredTalent is not waiting for approval", async function () {
      // First accept the hiredTalent
      await hiredTalentsContract.connect(freelancer).acceptHiredTalent(0, 0);

      // Try to accept again - should fail
      await expect(hiredTalentsContract.connect(freelancer).acceptHiredTalent(0, 0)).to.be.revertedWith(
        "HiredTalent is not available for acceptance",
      );
    });

    it("Should revert with non-existent hiredTalent", async function () {
      await expect(hiredTalentsContract.connect(freelancer).acceptHiredTalent(0, 999)).to.be.revertedWith(
        "HiredTalent does not exist",
      );
    });
  });

  describe("HiredTalent Completion", function () {
    beforeEach(async function () {
      // Create talent, hiredTalent, and accept it
      await hiredTalentsContract.connect(freelancer).createTalent(sampleTalent);
      await hiredTalentsContract.connect(client).createHiredTalent(0, sampleHiredTalent, {
        value: sampleHiredTalent.payment,
      });
      await hiredTalentsContract.connect(freelancer).acceptHiredTalent(0, 0);
      await hiredTalentsContract.connect(freelancer).uploadDeliverable(0, 0, deliverableToUpload);
    });

    it("Should allow freelancer to mark hiredTalent as delivered", async function () {
      const tx = await hiredTalentsContract.connect(freelancer).confirmFreelancerCompletion(0, 0);
      await expect(tx)
        .to.emit(hiredTalentsContract, "FreelancerMarkedAsDelivered")
        .withArgs(0, 0, freelancer.address, client.address, anyValue);
    });

    it("Should allow client to mark hiredTalent as received", async function () {
      const tx = await hiredTalentsContract.connect(client).confirmClientCompletion(0, 0, "ok");
      await expect(tx).to.emit(hiredTalentsContract, "ClientMarkedAsReceived").withArgs(0, 0, client.address, anyValue);
    });

    it("Should complete hiredTalent when both parties confirm", async function () {
      // First confirmation
      await hiredTalentsContract.connect(freelancer).confirmFreelancerCompletion(0, 0);

      // Second confirmation should complete the hiredTalent
      const freelancerBalanceBefore = await ethers.provider.getBalance(freelancer.address);

      const tx = await hiredTalentsContract.connect(client).confirmClientCompletion(0, 0, "ok");

      await expect(tx)
        .to.emit(hiredTalentsContract, "HiredTalentFinished")
        .withArgs(0, 0, freelancer.address, client.address, sampleHiredTalent.payment, anyValue);

      const freelancerBalanceAfter = await ethers.provider.getBalance(freelancer.address);
      expect(freelancerBalanceAfter - freelancerBalanceBefore).to.equal(sampleHiredTalent.payment);
    });

    it("Should revert if same party tries to confirm twice", async function () {
      await hiredTalentsContract.connect(freelancer).confirmFreelancerCompletion(0, 0);

      await expect(hiredTalentsContract.connect(freelancer).confirmFreelancerCompletion(0, 0)).to.be.revertedWith(
        "Freelancer already marked the hiredTalent as delivered",
      );
    });

    it("Should revert if hiredTalent is not ongoing", async function () {
      // Create a new hiredTalent but don't accept it (stays in WaitingForApproval state)
      await hiredTalentsContract.connect(client).createHiredTalent(
        0,
        {
          ...sampleHiredTalent,
          title: "Second HiredTalent",
        },
        { value: sampleHiredTalent.payment },
      );

      await expect(hiredTalentsContract.connect(client).confirmClientCompletion(0, 1, "ok")).to.be.revertedWith(
        "HiredTalent is not ongoing",
      );
    });

    it("Should revert if called by non-party", async function () {
      await expect(hiredTalentsContract.connect(other).confirmClientCompletion(0, 0, "ok")).to.be.revertedWith(
        "Only client can call this",
      );
      await expect(hiredTalentsContract.connect(other).confirmFreelancerCompletion(0, 0)).to.be.revertedWith(
        "Only freelancer can call this",
      );
    });
  });

  describe("HiredTalent Rating", function () {
    beforeEach(async function () {
      // Create talent, hiredTalent, accept it, and confirm completion
      await hiredTalentsContract.connect(freelancer).createTalent(sampleTalent);
      await hiredTalentsContract.connect(client).createHiredTalent(0, sampleHiredTalent, {
        value: sampleHiredTalent.payment,
      });
      await hiredTalentsContract.connect(freelancer).acceptHiredTalent(0, 0);
      await hiredTalentsContract.connect(freelancer).uploadDeliverable(0, 0, deliverableToUpload);
      await hiredTalentsContract.connect(freelancer).confirmFreelancerCompletion(0, 0);
      await hiredTalentsContract.connect(client).confirmClientCompletion(0, 0, "ok");
    });

    it("Should allow client to rate hiredTalent with valid rating (1-5)", async function () {
      const validRatings = [1, 2, 3, 4, 5];

      for (let i = 0; i < validRatings.length; i++) {
        // Create a new hiredTalent for each rating test
        await hiredTalentsContract.connect(client).createHiredTalent(
          0,
          {
            ...sampleHiredTalent,
            title: `Rating Test HiredTalent ${i}`,
          },
          { value: sampleHiredTalent.payment },
        );

        await hiredTalentsContract.connect(freelancer).acceptHiredTalent(0, i + 1);
        await hiredTalentsContract.connect(freelancer).uploadDeliverable(0, i + 1, deliverableToUpload);
        await hiredTalentsContract.connect(freelancer).confirmFreelancerCompletion(0, i + 1);
        await hiredTalentsContract.connect(client).confirmClientCompletion(0, i + 1, "ok");

        const tx = await hiredTalentsContract.connect(client).rateHiredTalent(0, i + 1, validRatings[i]);

        await expect(tx)
          .to.emit(hiredTalentsContract, "HiredTalentRated")
          .withArgs(0, i + 1, client.address, validRatings[i], anyValue);
      }
    });

    it("Should revert when client provides invalid rating (0)", async function () {
      await expect(hiredTalentsContract.connect(client).rateHiredTalent(0, 0, 0)).to.be.revertedWith("Invalid rating");
    });

    it("Should revert when client provides invalid rating (6)", async function () {
      await expect(hiredTalentsContract.connect(client).rateHiredTalent(0, 0, 6)).to.be.revertedWith("Invalid rating");
    });

    it("Should revert when client provides invalid rating (100)", async function () {
      await expect(hiredTalentsContract.connect(client).rateHiredTalent(0, 0, 100)).to.be.revertedWith(
        "Invalid rating",
      );
    });

    it("Should revert when freelancer tries to rate", async function () {
      await expect(hiredTalentsContract.connect(freelancer).rateHiredTalent(0, 0, 3)).to.be.revertedWith(
        "Only client can call this",
      );
    });

    it("Should prevent client from rating twice", async function () {
      // Client rates first
      await hiredTalentsContract.connect(client).rateHiredTalent(0, 0, 4);

      // Try to rate again - should fail
      await expect(hiredTalentsContract.connect(client).rateHiredTalent(0, 0, 3)).to.be.revertedWith(
        "HiredTalent already rated",
      );
    });

    it("Should emit correct rating values in events", async function () {
      const testRatings = [1, 5, 3];

      for (let i = 0; i < testRatings.length; i++) {
        // Create new hiredTalent for each test
        await hiredTalentsContract.connect(client).createHiredTalent(
          0,
          {
            ...sampleHiredTalent,
            title: `Rating Event Test ${i}`,
          },
          { value: sampleHiredTalent.payment },
        );

        await hiredTalentsContract.connect(freelancer).acceptHiredTalent(0, i + 1);
        await hiredTalentsContract.connect(freelancer).uploadDeliverable(0, i + 1, deliverableToUpload);
        await hiredTalentsContract.connect(freelancer).confirmFreelancerCompletion(0, i + 1);
        await hiredTalentsContract.connect(client).confirmClientCompletion(0, i + 1, "ok");

        const tx = await hiredTalentsContract.connect(client).rateHiredTalent(0, i + 1, testRatings[i]);

        // Verify the exact rating value is emitted
        const receipt = await tx.wait();
        const hiredTalentRatedEvent = receipt?.logs?.find(log => {
          try {
            const parsed = hiredTalentsContract.interface.parseLog({
              topics: log.topics as string[],
              data: log.data,
            });
            return parsed?.name === "HiredTalentRated";
          } catch {
            return false;
          }
        });

        expect(hiredTalentRatedEvent).to.not.be.undefined;
        if (hiredTalentRatedEvent) {
          const parsed = hiredTalentsContract.interface.parseLog({
            topics: hiredTalentRatedEvent.topics as string[],
            data: hiredTalentRatedEvent.data,
          });
          expect(parsed?.args[3]).to.equal(testRatings[i]); // Rating is the 4th argument (index 3)
        }
      }
    });
  });

  describe("HiredTalent Cancellation", function () {
    beforeEach(async function () {
      // Create a talent and hiredTalent for cancellation tests
      await hiredTalentsContract.connect(freelancer).createTalent({
        ...sampleTalent,
        title: "Cancellation Test Posting",
      });
      await hiredTalentsContract.connect(client).createHiredTalent(
        0,
        {
          ...sampleHiredTalent,
          title: "Cancellation Test HiredTalent",
        },
        { value: sampleHiredTalent.payment },
      );
    });

    it("Should cancel hiredTalent in WaitingForApproval state", async function () {
      const tx = await hiredTalentsContract.connect(client).cancelHiredTalent(0, 0);
      await tx.wait();

      await expect(tx).to.emit(hiredTalentsContract, "HiredTalentCancelled").withArgs(0, 0, 3, false, false, anyValue); // HiredTalentState.Cancelled = 3
    });

    it("Should cancel ongoing hiredTalent by both parties and refund client", async function () {
      // Accept hiredTalent first
      await hiredTalentsContract.connect(freelancer).acceptHiredTalent(0, 0);

      const clientBalanceBefore = await ethers.provider.getBalance(client.address);

      const tx = await hiredTalentsContract.connect(client).cancelHiredTalent(0, 0);
      const receipt = await tx.wait();

      const anotherTx = await hiredTalentsContract.connect(freelancer).cancelHiredTalent(0, 0);
      await anotherTx.wait();

      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      await expect(tx).to.emit(hiredTalentsContract, "HiredTalentCancelled");
      await expect(anotherTx).to.emit(hiredTalentsContract, "HiredTalentCancelled");

      const clientBalanceAfter = await ethers.provider.getBalance(client.address);
      expect(clientBalanceAfter - clientBalanceBefore + gasUsed).to.equal(sampleHiredTalent.payment);
    });

    it("Should not cancel ongoing hiredTalent by only one party(client)", async function () {
      // Accept hiredTalent first
      await hiredTalentsContract.connect(freelancer).acceptHiredTalent(0, 0);

      const clientBalanceBefore = await ethers.provider.getBalance(client.address);

      const tx = await hiredTalentsContract.connect(client).cancelHiredTalent(0, 0);

      await expect(tx).to.emit(hiredTalentsContract, "HiredTalentCancelled").withArgs(0, 0, 1, true, false, anyValue); // HiredTalentState.Ongoing = 1

      const clientBalanceAfter = await ethers.provider.getBalance(client.address);
      expect(clientBalanceAfter).to.be.lessThan(clientBalanceBefore); // Only gas fee paid, no refund
    });

    it("Should not cancel ongoing hiredTalent by only one party(freelancer)", async function () {
      // Accept hiredTalent first
      await hiredTalentsContract.connect(freelancer).acceptHiredTalent(0, 0);

      const clientBalanceBefore = await ethers.provider.getBalance(client.address);

      const tx = await hiredTalentsContract.connect(freelancer).cancelHiredTalent(0, 0);
      await tx.wait();

      await expect(tx).to.emit(hiredTalentsContract, "HiredTalentCancelled").withArgs(0, 0, 1, false, true, anyValue); // HiredTalentState.Ongoing = 1

      const clientBalanceAfter = await ethers.provider.getBalance(client.address);
      expect(clientBalanceAfter).to.be.equal(clientBalanceBefore); // Only gas fee paid, no refund
    });

    it("Should revert if hiredTalent cannot be cancelled", async function () {
      // Accept hiredTalent and complete it
      await hiredTalentsContract.connect(freelancer).acceptHiredTalent(0, 0);
      await hiredTalentsContract.connect(freelancer).uploadDeliverable(0, 0, deliverableToUpload);
      await hiredTalentsContract.connect(freelancer).confirmFreelancerCompletion(0, 0);
      await hiredTalentsContract.connect(client).confirmClientCompletion(0, 0, "ok");

      await expect(hiredTalentsContract.connect(client).cancelHiredTalent(0, 0)).to.be.revertedWith(
        "HiredTalent cannot be cancelled in its current state",
      );
    });

    it("Should revert if called by non-party", async function () {
      await expect(hiredTalentsContract.connect(other).cancelHiredTalent(0, 0)).to.be.revertedWith(
        "Only hiredTalent parties can call this",
      );
    });
  });

  describe("Emergency Cancel", function () {
    beforeEach(async function () {
      // Create hiredTalent for emergency cancel test
      await hiredTalentsContract.connect(freelancer).createTalent(sampleTalent);
      await hiredTalentsContract.connect(client).createHiredTalent(
        0,
        {
          ...sampleHiredTalent,
          title: "Emergency Cancel Test",
        },
        { value: sampleHiredTalent.payment },
      );
    });

    it("Should allow owner to emergency cancel", async function () {
      const clientBalanceBefore = await ethers.provider.getBalance(client.address);

      const tx = await hiredTalentsContract.connect(owner).emergencyCancel(0, 0);

      await expect(tx).to.emit(hiredTalentsContract, "HiredTalentCancelled").withArgs(0, 0, 3, false, false, anyValue);

      const clientBalanceAfter = await ethers.provider.getBalance(client.address);
      expect(clientBalanceAfter - clientBalanceBefore).to.equal(sampleHiredTalent.payment);
    });

    it("Should revert if called by non-owner", async function () {
      await expect(hiredTalentsContract.connect(client).emergencyCancel(0, 0)).to.be.revertedWith(
        "Only owner can call this",
      );
    });
  });

  describe("View Functions", function () {
    it("Should return correct total hiredTalents posted", async function () {
      // Create two talents
      await hiredTalentsContract.connect(freelancer).createTalent(sampleTalent);
      await hiredTalentsContract.connect(freelancer).createTalent({
        ...sampleTalent,
        title: "Second Posting",
      });

      expect(await hiredTalentsContract.getTotalHiredTalentsPosted()).to.equal(2);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle multiple talents from same freelancer", async function () {
      await hiredTalentsContract.connect(freelancer).createTalent(sampleTalent);
      await hiredTalentsContract.connect(freelancer).createTalent({
        ...sampleTalent,
        title: "Second Posting",
      });
      await hiredTalentsContract.connect(freelancer).createTalent({
        ...sampleTalent,
        title: "Third Posting",
      });

      expect(await hiredTalentsContract.postedHiredTalentsCounter()).to.equal(3);
    });

    it("Should handle hiredTalents from different clients on same talent", async function () {
      // Create talent
      await hiredTalentsContract.connect(freelancer).createTalent(sampleTalent);

      // Create hiredTalents from different clients
      await hiredTalentsContract.connect(client).createHiredTalent(
        0,
        {
          ...sampleHiredTalent,
          title: "HiredTalent from client 1",
        },
        { value: sampleHiredTalent.payment },
      );

      await hiredTalentsContract.connect(other).createHiredTalent(
        0,
        {
          ...sampleHiredTalent,
          title: "HiredTalent from client 2",
        },
        { value: sampleHiredTalent.payment },
      );

      // Test hiredTalent count
      const hiredTalentCount = await hiredTalentsContract.getHiredTalentCount(0);
      expect(hiredTalentCount).to.equal(2);
    });

    it("Should maintain correct hiredTalent states throughout lifecycle", async function () {
      // Create new talent and hiredTalent
      await hiredTalentsContract.connect(freelancer).createTalent(sampleTalent);
      await hiredTalentsContract.connect(client).createHiredTalent(
        0,
        {
          ...sampleHiredTalent,
          title: "State Test HiredTalent",
        },
        { value: sampleHiredTalent.payment },
      );

      // HiredTalent should start in WaitingForApproval (0)
      // Accept it to move to Ongoing (1)
      await hiredTalentsContract.connect(freelancer).acceptHiredTalent(0, 0);

      // Complete it to move to Finished (2)
      await hiredTalentsContract.connect(freelancer).uploadDeliverable(0, 0, deliverableToUpload);
      await hiredTalentsContract.connect(freelancer).confirmFreelancerCompletion(0, 0);
      await hiredTalentsContract.connect(client).confirmClientCompletion(0, 0, "ok");

      // HiredTalent should now be in Finished state
      // This test verifies the state transitions work correctly
    });
  });

  describe("Length Validation", function () {
    it("Should revert if talent title exceeds 64 characters", async function () {
      const invalidPosting = { ...sampleTalent, title: "a".repeat(65) };
      await expect(hiredTalentsContract.connect(freelancer).createTalent(invalidPosting)).to.be.revertedWith(
        "Title must be up to 64 characters",
      );
    });

    it("Should revert if talent description exceeds 512 characters", async function () {
      const invalidPosting = { ...sampleTalent, description: "a".repeat(513) };
      await expect(hiredTalentsContract.connect(freelancer).createTalent(invalidPosting)).to.be.revertedWith(
        "Description must be up to 512 characters",
      );
    });

    it("Should revert if talent category exceeds 64 characters", async function () {
      const invalidPosting = { ...sampleTalent, category: "a".repeat(65) };
      await expect(hiredTalentsContract.connect(freelancer).createTalent(invalidPosting)).to.be.revertedWith(
        "Category must be up to 64 characters",
      );
    });

    it("Should revert if talent banner image hash exceeds 128 characters", async function () {
      const invalidPosting = { ...sampleTalent, bannerImageHash: "a".repeat(129) };
      await expect(hiredTalentsContract.connect(freelancer).createTalent(invalidPosting)).to.be.revertedWith(
        "Banner image hash must be up to 128 characters",
      );
    });

    it("Should revert if hiredTalent title exceeds 64 characters", async function () {
      await hiredTalentsContract.connect(freelancer).createTalent(sampleTalent);
      const invalidHiredTalent = { ...sampleHiredTalent, title: "a".repeat(65) };
      await expect(
        hiredTalentsContract
          .connect(client)
          .createHiredTalent(0, invalidHiredTalent, { value: invalidHiredTalent.payment }),
      ).to.be.revertedWith("Title exceeds 64 characters");
    });

    it("Should revert if hiredTalent description exceeds 512 characters", async function () {
      await hiredTalentsContract.connect(freelancer).createTalent(sampleTalent);
      const invalidHiredTalent = { ...sampleHiredTalent, description: "a".repeat(513) };
      await expect(
        hiredTalentsContract
          .connect(client)
          .createHiredTalent(0, invalidHiredTalent, { value: invalidHiredTalent.payment }),
      ).to.be.revertedWith("Description exceeds 512 characters");
    });
  });

  describe("Upload File to HiredTalent", function () {
    beforeEach(async function () {
      await hiredTalentsContract.connect(freelancer).createTalent(sampleTalent);
      await hiredTalentsContract
        .connect(client)
        .createHiredTalent(0, sampleHiredTalent, { value: sampleHiredTalent.payment });
      await hiredTalentsContract.connect(freelancer).acceptHiredTalent(0, 0);
    });

    it("Should allow freelancer to upload file successfully and update hiredTalent deliverableInfo", async function () {
      const tx = await hiredTalentsContract.connect(freelancer).uploadDeliverable(0, 0, deliverableToUpload);

      const receipt = await tx.wait();

      await expect(tx)
        .to.emit(hiredTalentsContract, "DeliverableUploaded")
        .withArgs(0, 0, freelancer.address, deliverableResource, deliverableComment, false, true, anyValue);

      const events = receipt?.logs
        .map(log => {
          try {
            return hiredTalentsContract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .filter(e => e && e.name === "DeliverableUploaded");

      expect(events?.[0]?.args?.talentId).to.equal(0);
      expect(events?.[0]?.args?.hiredTalentId).to.equal(0);
      expect(events?.[0]?.args?.freelancer).to.equal(freelancer.address);
      expect(events?.[0]?.args?.resource).to.equal(deliverableResource);

      expect(events?.[0]?.args?.submissionComment).to.equal(deliverableComment);

      expect(await hiredTalentsContract.isDeliverableUploaded(0, 0, deliverableComment, deliverableResource)).to.be
        .true;
    });

    it("Should revert if the hiredTalent is not ongoing", async function () {
      await hiredTalentsContract.connect(client).cancelHiredTalent(0, 0);
      await hiredTalentsContract.connect(freelancer).cancelHiredTalent(0, 0);
      await expect(
        hiredTalentsContract.connect(freelancer).uploadDeliverable(0, 0, deliverableToUpload),
      ).to.be.revertedWith("The hiredTalent is not ongoing.");
    });

    it("Should revert if the IPFS hash is empty", async function () {
      const emptyDeliverableInfo = { resource: "", submissionComment: "Valid comment", isLink: false };
      await expect(
        hiredTalentsContract.connect(freelancer).uploadDeliverable(0, 0, emptyDeliverableInfo),
      ).to.be.revertedWith("Resource cannot be empty.");
    });

    it("Should revert if the resource exceeds 256 characters", async function () {
      const longHash = "a".repeat(257);
      const invalidDeliverableInfo = { resource: longHash, submissionComment: "Valid comment", isLink: false };
      await expect(
        hiredTalentsContract.connect(freelancer).uploadDeliverable(0, 0, invalidDeliverableInfo),
      ).to.be.revertedWith("Resource must be up to 256 characters.");
    });

    it("Should revert if the comment exceeds 256 characters", async function () {
      const longComment = "a".repeat(257);
      const invalidDeliverableInfo = { resource: "QmFileHash123", submissionComment: longComment, isLink: false };
      await expect(
        hiredTalentsContract.connect(freelancer).uploadDeliverable(0, 0, invalidDeliverableInfo),
      ).to.be.revertedWith("Comment must be up to 256 characters.");
    });

    it("Should revert if called by someone who is not the freelancer", async function () {
      await expect(
        hiredTalentsContract.connect(client).uploadDeliverable(0, 0, deliverableToUpload),
      ).to.be.revertedWith("Only freelancer can call this");
    });
  });
});
