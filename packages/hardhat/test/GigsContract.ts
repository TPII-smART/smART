import { expect } from "chai";
import { ethers } from "hardhat";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { GigsContract } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("GigsContract", function () {
  let gigsContract: GigsContract;
  let owner: SignerWithAddress;
  let client: SignerWithAddress;
  let freelancer1: SignerWithAddress;
  let freelancer2: SignerWithAddress;
  let other: SignerWithAddress;

  const sampleGig = {
    title: "Logo Design Project",
    description: "Design a modern logo for our startup",
    category: "Design",
    maxDurationInHours: 168, // 1 week
    gigBannerImageHash: "QmTestGigHash123",
    basePayment: ethers.parseEther("2.0"),
  };

  const sampleApplication = {
    proposedPayment: ethers.parseEther("1.5"),
    proposedDurationInHours: 120, // 5 days
    proposal:
      "I have 5+ years experience in logo design and can deliver a modern, professional logo that represents your brand perfectly.",
  };

  beforeEach(async () => {
    // Deploy a fresh contract for each test to avoid state conflicts
    [owner, client, freelancer1, freelancer2, other] = await ethers.getSigners();
    const gigsContractFactory = await ethers.getContractFactory("GigsContract");
    gigsContract = (await gigsContractFactory.deploy(owner.address)) as GigsContract;
    await gigsContract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await gigsContract.owner()).to.equal(owner.address);
    });

    it("Should initialize counter to 0", async function () {
      expect(await gigsContract.postedGigsCounter()).to.equal(0);
    });

    it("Should reject direct payments", async function () {
      await expect(
        owner.sendTransaction({
          to: await gigsContract.getAddress(),
          value: ethers.parseEther("1.0"),
        }),
      ).to.be.revertedWith("Direct payments not accepted");
    });
  });

  describe("Gig Creation", function () {
    it("Should create a gig with valid parameters", async function () {
      const tx = await gigsContract.connect(client).createGig(sampleGig);
      await expect(tx)
        .to.emit(gigsContract, "GigCreated")
        .withArgs(
          0,
          client.address,
          sampleGig.basePayment,
          sampleGig.title,
          sampleGig.description,
          sampleGig.category,
          sampleGig.maxDurationInHours,
          sampleGig.gigBannerImageHash,
        );

      expect(await gigsContract.postedGigsCounter()).to.equal(1);
    });

    it("Should retrieve gig details correctly", async function () {
      await gigsContract.connect(client).createGig(sampleGig);

      const gig = await gigsContract.postedGigs(0);
      expect(gig.gigId).to.equal(0);
      expect(gig.client).to.equal(client.address);
      expect(gig.acceptedFreelancer).to.equal(ethers.ZeroAddress);
      expect(gig.basePayment).to.equal(sampleGig.basePayment);
      expect(gig.finalPayment).to.equal(0);
      expect(gig.title).to.equal(sampleGig.title);
      expect(gig.description).to.equal(sampleGig.description);
      expect(gig.category).to.equal(sampleGig.category);
      expect(gig.maxDurationInHours).to.equal(sampleGig.maxDurationInHours);
      expect(gig.state).to.equal(0); // GigState.Open
    });

    it("Should revert with zero duration", async function () {
      const invalidGig = { ...sampleGig, maxDurationInHours: 0 };
      await expect(gigsContract.connect(client).createGig(invalidGig)).to.be.revertedWith(
        "Duration must be greater than 0",
      );
    });

    it("Should revert with empty title", async function () {
      const invalidGig = { ...sampleGig, title: "" };
      await expect(gigsContract.connect(client).createGig(invalidGig)).to.be.revertedWith("Title cannot be empty");
    });

    it("Should revert with empty description", async function () {
      const invalidGig = { ...sampleGig, description: "" };
      await expect(gigsContract.connect(client).createGig(invalidGig)).to.be.revertedWith(
        "Description cannot be empty",
      );
    });

    it("Should revert with empty category", async function () {
      const invalidGig = { ...sampleGig, category: "" };
      await expect(gigsContract.connect(client).createGig(invalidGig)).to.be.revertedWith("Category cannot be empty");
    });

    it("Should revert with zero base payment", async function () {
      const invalidGig = { ...sampleGig, basePayment: 0 };
      await expect(gigsContract.connect(client).createGig(invalidGig)).to.be.revertedWith(
        "Base payment must be greater than 0",
      );
    });
  });

  describe("Application Submission", function () {
    beforeEach(async function () {
      // Create a gig first
      await gigsContract.connect(client).createGig(sampleGig);
    });

    it("Should allow freelancer to apply to gig", async function () {
      const tx = await gigsContract.connect(freelancer1).applyToGig(0, sampleApplication);

      await expect(tx)
        .to.emit(gigsContract, "ApplicationSubmitted")
        .withArgs(
          0,
          0,
          freelancer1.address,
          sampleApplication.proposedPayment,
          sampleApplication.proposedDurationInHours,
          sampleApplication.proposal,
        );
    });

    it("Should revert if client tries to apply to own gig", async function () {
      await expect(gigsContract.connect(client).applyToGig(0, sampleApplication)).to.be.revertedWith(
        "Client cannot apply to their own gig",
      );
    });

    it("Should revert if freelancer applies twice", async function () {
      await gigsContract.connect(freelancer1).applyToGig(0, sampleApplication);

      await expect(gigsContract.connect(freelancer1).applyToGig(0, sampleApplication)).to.be.revertedWith(
        "Already applied to this gig",
      );
    });

    it("Should revert with non-existent gig", async function () {
      await expect(gigsContract.connect(freelancer1).applyToGig(999, sampleApplication)).to.be.revertedWith(
        "Gig does not exist",
      );
    });

    it("Should revert with zero proposed payment", async function () {
      const invalidApplication = { ...sampleApplication, proposedPayment: 0 };
      await expect(gigsContract.connect(freelancer1).applyToGig(0, invalidApplication)).to.be.revertedWith(
        "Proposed payment must be greater than 0",
      );
    });

    it("Should revert with zero duration", async function () {
      const invalidApplication = { ...sampleApplication, proposedDurationInHours: 0 };
      await expect(gigsContract.connect(freelancer1).applyToGig(0, invalidApplication)).to.be.revertedWith(
        "Duration must be greater than 0",
      );
    });

    it("Should revert with empty proposal", async function () {
      const invalidApplication = { ...sampleApplication, proposal: "" };
      await expect(gigsContract.connect(freelancer1).applyToGig(0, invalidApplication)).to.be.revertedWith(
        "Proposal comment cannot be empty",
      );
    });

    it("Should allow multiple freelancers to apply", async function () {
      await gigsContract.connect(freelancer1).applyToGig(0, sampleApplication);

      const secondApplication = {
        ...sampleApplication,
        proposedPayment: ethers.parseEther("1.8"),
        proposal: "I'm a different freelancer with different skills",
      };

      await expect(gigsContract.connect(freelancer2).applyToGig(0, secondApplication))
        .to.emit(gigsContract, "ApplicationSubmitted")
        .withArgs(
          0,
          1,
          freelancer2.address,
          secondApplication.proposedPayment,
          secondApplication.proposedDurationInHours,
          secondApplication.proposal,
        );
    });

    it("Should not allow applications to non-open gigs", async function () {
      // First apply and accept to make gig InProgress
      await gigsContract.connect(freelancer1).applyToGig(0, sampleApplication);
      await gigsContract.connect(client).acceptApplication(0, 0, { value: sampleApplication.proposedPayment });

      await expect(gigsContract.connect(freelancer2).applyToGig(0, sampleApplication)).to.be.revertedWith(
        "Gig is not accepting applications",
      );
    });
  });

  describe("Application Acceptance", function () {
    beforeEach(async function () {
      // Create gig and application
      await gigsContract.connect(client).createGig(sampleGig);
      await gigsContract.connect(freelancer1).applyToGig(0, sampleApplication);
    });

    it("Should allow client to accept application", async function () {
      const tx = await gigsContract.connect(client).acceptApplication(0, 0, {
        value: sampleApplication.proposedPayment,
      });

      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);
      const expectedDeadline = block!.timestamp + sampleApplication.proposedDurationInHours * 3600;

      await expect(tx)
        .to.emit(gigsContract, "ApplicationAccepted")
        .withArgs(
          0,
          0,
          freelancer1.address,
          sampleApplication.proposedPayment,
          sampleApplication.proposedDurationInHours,
          expectedDeadline,
        );
    });

    it("Should revert if non-client tries to accept", async function () {
      await expect(
        gigsContract.connect(freelancer1).acceptApplication(0, 0, {
          value: sampleApplication.proposedPayment,
        }),
      ).to.be.revertedWith("Only client can call this");
    });

    it("Should revert if payment amount doesn't match proposed payment", async function () {
      await expect(
        gigsContract.connect(client).acceptApplication(0, 0, {
          value: ethers.parseEther("1.0"), // Different from proposed payment
        }),
      ).to.be.revertedWith("Must pay the agreed price");
    });

    it("Should revert with non-existent application", async function () {
      await expect(
        gigsContract.connect(client).acceptApplication(0, 999, {
          value: sampleApplication.proposedPayment,
        }),
      ).to.be.revertedWith("Application does not exist");
    });

    it("Should reject other pending applications when one is accepted", async function () {
      // Add second application
      const secondApplication = {
        ...sampleApplication,
        proposedPayment: ethers.parseEther("1.8"),
      };
      await gigsContract.connect(freelancer2).applyToGig(0, secondApplication);

      // Accept first application
      await gigsContract.connect(client).acceptApplication(0, 0, {
        value: sampleApplication.proposedPayment,
      });

      // Check that gig state changed to InProgress
      const gig = await gigsContract.postedGigs(0);
      expect(gig.state).to.equal(1); // GigState.InProgress
      expect(gig.acceptedFreelancer).to.equal(freelancer1.address);
      expect(gig.finalPayment).to.equal(sampleApplication.proposedPayment);
    });

    it("Should revert if application is not pending", async function () {
      // Accept the application first
      await gigsContract.connect(client).acceptApplication(0, 0, {
        value: sampleApplication.proposedPayment,
      });

      // Try to accept again - should fail
      await expect(
        gigsContract.connect(client).acceptApplication(0, 0, {
          value: sampleApplication.proposedPayment,
        }),
      ).to.be.revertedWith("Gig is not accepting applications");
    });
  });

  describe("Application Rejection", function () {
    beforeEach(async function () {
      // Create gig and application
      await gigsContract.connect(client).createGig(sampleGig);
      await gigsContract.connect(freelancer1).applyToGig(0, sampleApplication);
    });

    it("Should allow client to reject application", async function () {
      const rejectionComment = "We decided to go with a different approach";
      const tx = await gigsContract.connect(client).rejectApplication(0, 0, rejectionComment);

      await expect(tx)
        .to.emit(gigsContract, "ApplicationRejected")
        .withArgs(0, 0, freelancer1.address, rejectionComment);
    });

    it("Should revert if non-client tries to reject", async function () {
      await expect(gigsContract.connect(freelancer1).rejectApplication(0, 0, "test")).to.be.revertedWith(
        "Only client can call this",
      );
    });

    it("Should revert if application is not pending", async function () {
      // Accept the application first
      await gigsContract.connect(client).acceptApplication(0, 0, {
        value: sampleApplication.proposedPayment,
      });

      // Try to reject - should fail
      await expect(gigsContract.connect(client).rejectApplication(0, 0, "test")).to.be.revertedWith(
        "Gig is not accepting applications",
      );
    });
  });

  describe("Gig Completion", function () {
    beforeEach(async function () {
      // Create gig, application, and accept it
      await gigsContract.connect(client).createGig(sampleGig);
      await gigsContract.connect(freelancer1).applyToGig(0, sampleApplication);
      await gigsContract.connect(client).acceptApplication(0, 0, {
        value: sampleApplication.proposedPayment,
      });
    });

    it("Should allow freelancer to mark gig as delivered", async function () {
      const tx = await gigsContract.connect(freelancer1).confirmCompletion(0, 0);
      await expect(tx).to.emit(gigsContract, "FreelancerMarkedAsDelivered").withArgs(0, freelancer1.address, anyValue);
    });

    it("Should allow client to mark gig as received", async function () {
      const tx = await gigsContract.connect(client).confirmCompletion(0, 1);
      await expect(tx).to.emit(gigsContract, "ClientMarkedAsReceived").withArgs(0, client.address, anyValue);
    });

    it("Should complete gig when both parties confirm", async function () {
      // First confirmation
      await gigsContract.connect(freelancer1).confirmCompletion(0, 0);

      // Second confirmation should complete the gig
      const freelancerBalanceBefore = await ethers.provider.getBalance(freelancer1.address);

      const tx = await gigsContract.connect(client).confirmCompletion(0, 1);

      await expect(tx)
        .to.emit(gigsContract, "GigCompleted")
        .withArgs(0, freelancer1.address, client.address, sampleApplication.proposedPayment, anyValue);

      const freelancerBalanceAfter = await ethers.provider.getBalance(freelancer1.address);
      expect(freelancerBalanceAfter - freelancerBalanceBefore).to.equal(sampleApplication.proposedPayment);
    });

    it("Should revert if same party tries to confirm twice", async function () {
      await gigsContract.connect(freelancer1).confirmCompletion(0, 0);

      await expect(gigsContract.connect(freelancer1).confirmCompletion(0, 0)).to.be.revertedWith(
        "Freelancer already marked as delivered",
      );
    });

    it("Should revert if gig is not in progress", async function () {
      // Create a new gig but don't accept any application
      await gigsContract.connect(client).createGig({
        ...sampleGig,
        title: "Second Gig",
      });

      await expect(gigsContract.connect(client).confirmCompletion(1, 1)).to.be.revertedWith("Gig is not in progress");
    });

    it("Should revert if called by non-party", async function () {
      await expect(gigsContract.connect(other).confirmCompletion(0, 0)).to.be.revertedWith(
        "Only gig parties can call this",
      );
    });
  });

  describe("Gig Rating", function () {
    beforeEach(async function () {
      // Create gig, application, and accept it
      await gigsContract.connect(client).createGig(sampleGig);
      await gigsContract.connect(freelancer1).applyToGig(0, sampleApplication);
      await gigsContract.connect(client).acceptApplication(0, 0, {
        value: sampleApplication.proposedPayment,
      });
    });

    it("Should allow client to rate gig with valid rating (1-5)", async function () {
      const validRatings = [1, 2, 3, 4, 5];

      for (let i = 0; i < validRatings.length; i++) {
        // Create a new gig for each rating test
        await gigsContract.connect(client).createGig({
          ...sampleGig,
          title: `Rating Test Gig ${i}`,
        });

        await gigsContract.connect(freelancer1).applyToGig(i + 1, sampleApplication);
        await gigsContract.connect(client).acceptApplication(i + 1, 0, {
          value: sampleApplication.proposedPayment,
        });

        const tx = await gigsContract.connect(client).confirmCompletion(i + 1, validRatings[i]);

        await expect(tx)
          .to.emit(gigsContract, "GigRated")
          .withArgs(i + 1, client.address, validRatings[i], anyValue);
      }
    });

    it("Should revert when client provides invalid rating (0)", async function () {
      await expect(gigsContract.connect(client).confirmCompletion(0, 0)).to.be.revertedWith("Invalid rating");
    });

    it("Should revert when client provides invalid rating (6)", async function () {
      await expect(gigsContract.connect(client).confirmCompletion(0, 6)).to.be.revertedWith("Invalid rating");
    });

    it("Should revert when client provides invalid rating (100)", async function () {
      await expect(gigsContract.connect(client).confirmCompletion(0, 100)).to.be.revertedWith("Invalid rating");
    });

    it("Should revert when freelancer tries to provide non-zero rating", async function () {
      await expect(gigsContract.connect(freelancer1).confirmCompletion(0, 3)).to.be.revertedWith(
        "Rating must be 0 for freelancer",
      );
    });

    it("Should allow freelancer to confirm with zero rating", async function () {
      const tx = await gigsContract.connect(freelancer1).confirmCompletion(0, 0);

      await expect(tx).to.emit(gigsContract, "FreelancerMarkedAsDelivered").withArgs(0, freelancer1.address, anyValue);

      // Should not emit GigRated event for freelancer
      await expect(tx).to.not.emit(gigsContract, "GigRated");
    });

    it("Should complete gig with rating when both parties confirm", async function () {
      const rating = 4;

      // Freelancer confirms first
      await gigsContract.connect(freelancer1).confirmCompletion(0, 0);

      // Client confirms with rating
      const tx = await gigsContract.connect(client).confirmCompletion(0, rating);

      await expect(tx).to.emit(gigsContract, "GigRated").withArgs(0, client.address, rating, anyValue);

      await expect(tx)
        .to.emit(gigsContract, "GigCompleted")
        .withArgs(0, freelancer1.address, client.address, sampleApplication.proposedPayment, anyValue);
    });

    it("Should complete gig with rating when client confirms first", async function () {
      const rating = 3;

      // Client confirms first with rating
      const tx1 = await gigsContract.connect(client).confirmCompletion(0, rating);

      await expect(tx1).to.emit(gigsContract, "GigRated").withArgs(0, client.address, rating, anyValue);

      // Gig should not be completed yet
      await expect(tx1).to.not.emit(gigsContract, "GigCompleted");

      // Freelancer confirms to complete the gig
      const tx2 = await gigsContract.connect(freelancer1).confirmCompletion(0, 0);

      await expect(tx2)
        .to.emit(gigsContract, "GigCompleted")
        .withArgs(0, freelancer1.address, client.address, sampleApplication.proposedPayment, anyValue);
    });

    it("Should prevent client from rating twice", async function () {
      // Client rates first
      await gigsContract.connect(client).confirmCompletion(0, 4);

      // Try to rate again - should fail
      await expect(gigsContract.connect(client).confirmCompletion(0, 3)).to.be.revertedWith(
        "Client already confirmed reception",
      );
    });

    it("Should emit correct rating values in events", async function () {
      const testRatings = [1, 5, 3];

      for (let i = 0; i < testRatings.length; i++) {
        // Create new gig for each test
        await gigsContract.connect(client).createGig({
          ...sampleGig,
          title: `Rating Event Test ${i}`,
        });

        await gigsContract.connect(freelancer1).applyToGig(i + 1, sampleApplication);
        await gigsContract.connect(client).acceptApplication(i + 1, 0, {
          value: sampleApplication.proposedPayment,
        });

        const tx = await gigsContract.connect(client).confirmCompletion(i + 1, testRatings[i]);

        // Verify the exact rating value is emitted
        const receipt = await tx.wait();
        const gigRatedEvent = receipt?.logs?.find(log => {
          try {
            const parsed = gigsContract.interface.parseLog({
              topics: log.topics as string[],
              data: log.data,
            });
            return parsed?.name === "GigRated";
          } catch {
            return false;
          }
        });

        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        expect(gigRatedEvent).to.not.be.undefined;
        if (gigRatedEvent) {
          const parsed = gigsContract.interface.parseLog({
            topics: gigRatedEvent.topics as string[],
            data: gigRatedEvent.data,
          });
          expect(parsed?.args[2]).to.equal(testRatings[i]); // Rating is the 3rd argument (index 2)
        }
      }
    });

    it("Should store rating in gig struct", async function () {
      const rating = 5;

      // Complete gig with rating
      await gigsContract.connect(freelancer1).confirmCompletion(0, 0);
      await gigsContract.connect(client).confirmCompletion(0, rating);

      // Check that rating is stored in the gig
      const gig = await gigsContract.postedGigs(0);
      expect(gig.rating).to.equal(rating);
    });

    it("Should not allow rating on non-InProgress gigs", async function () {
      // Create a new gig but don't accept any application (stays in Open state)
      await gigsContract.connect(client).createGig({
        ...sampleGig,
        title: "Open Gig for Rating Test",
      });

      await expect(gigsContract.connect(client).confirmCompletion(1, 4)).to.be.revertedWith("Gig is not in progress");
    });

    it("Should not allow rating on completed gigs", async function () {
      // Complete the gig first
      await gigsContract.connect(freelancer1).confirmCompletion(0, 0);
      await gigsContract.connect(client).confirmCompletion(0, 4);

      // Try to rate again - should fail because gig is completed
      await expect(gigsContract.connect(client).confirmCompletion(0, 5)).to.be.revertedWith("Gig is not in progress");
    });

    it("Should handle edge case ratings (1 and 5)", async function () {
      // Test minimum valid rating (1)
      await gigsContract.connect(client).createGig({
        ...sampleGig,
        title: "Minimum Rating Test",
      });
      await gigsContract.connect(freelancer1).applyToGig(1, sampleApplication);
      await gigsContract.connect(client).acceptApplication(1, 0, {
        value: sampleApplication.proposedPayment,
      });

      const tx1 = await gigsContract.connect(client).confirmCompletion(1, 1);
      await expect(tx1).to.emit(gigsContract, "GigRated").withArgs(1, client.address, 1, anyValue);

      // Test maximum valid rating (5)
      await gigsContract.connect(client).createGig({
        ...sampleGig,
        title: "Maximum Rating Test",
      });
      await gigsContract.connect(freelancer1).applyToGig(2, sampleApplication);
      await gigsContract.connect(client).acceptApplication(2, 0, {
        value: sampleApplication.proposedPayment,
      });

      const tx2 = await gigsContract.connect(client).confirmCompletion(2, 5);
      await expect(tx2).to.emit(gigsContract, "GigRated").withArgs(2, client.address, 5, anyValue);
    });

    it("Should maintain rating consistency throughout completion flow", async function () {
      const rating = 4;

      // Freelancer confirms delivery first
      const tx1 = await gigsContract.connect(freelancer1).confirmCompletion(0, 0);

      // Verify freelancer confirmation doesn't emit rating event
      await expect(tx1).to.not.emit(gigsContract, "GigRated");

      // Client confirms reception with rating
      const tx2 = await gigsContract.connect(client).confirmCompletion(0, rating);

      // Verify rating event is emitted
      await expect(tx2).to.emit(gigsContract, "GigRated").withArgs(0, client.address, rating, anyValue);

      // Verify completion event is emitted with correct details
      await expect(tx2)
        .to.emit(gigsContract, "GigCompleted")
        .withArgs(0, freelancer1.address, client.address, sampleApplication.proposedPayment, anyValue);

      // Verify final gig state
      const gig = await gigsContract.postedGigs(0);
      expect(gig.rating).to.equal(rating);
      expect(gig.state).to.equal(2); // GigState.Completed
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      expect(gig.clientReceived).to.be.true;
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      expect(gig.freelancerDelivered).to.be.true;
    });
  });

  describe("Gig Cancellation", function () {
    beforeEach(async function () {
      // Create a gig for cancellation tests
      await gigsContract.connect(client).createGig({
        ...sampleGig,
        title: "Cancellation Test Gig",
      });
    });

    it("Should cancel gig in Open state", async function () {
      const tx = await gigsContract.connect(client).cancelGig(0);

      await expect(tx).to.emit(gigsContract, "GigCancelled").withArgs(0, 3, anyValue); // GigState.Cancelled = 3
    });

    it("Should cancel in-progress gig and refund client", async function () {
      // Apply and accept to make gig InProgress
      await gigsContract.connect(freelancer1).applyToGig(0, sampleApplication);
      await gigsContract.connect(client).acceptApplication(0, 0, { value: sampleApplication.proposedPayment });

      const clientBalanceBefore = await ethers.provider.getBalance(client.address);

      const tx = await gigsContract.connect(client).cancelGig(0);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      await expect(tx).to.emit(gigsContract, "GigCancelled");

      const clientBalanceAfter = await ethers.provider.getBalance(client.address);
      expect(clientBalanceAfter - clientBalanceBefore + gasUsed).to.equal(sampleApplication.proposedPayment);
    });

    it("Should revert if gig cannot be cancelled", async function () {
      // Apply, accept and complete the gig
      await gigsContract.connect(freelancer1).applyToGig(0, sampleApplication);
      await gigsContract.connect(client).acceptApplication(0, 0, { value: sampleApplication.proposedPayment });
      await gigsContract.connect(freelancer1).confirmCompletion(0, 0);
      await gigsContract.connect(client).confirmCompletion(0, 1);

      await expect(gigsContract.connect(client).cancelGig(0)).to.be.revertedWith(
        "Gig cannot be cancelled in its current state",
      );
    });

    it("Should revert if called by non-party", async function () {
      await expect(gigsContract.connect(other).cancelGig(0)).to.be.revertedWith("Only gig parties can call this");
    });

    it("Should allow accepted freelancer to cancel", async function () {
      // Apply and accept to make gig InProgress
      await gigsContract.connect(freelancer1).applyToGig(0, sampleApplication);
      await gigsContract.connect(client).acceptApplication(0, 0, { value: sampleApplication.proposedPayment });

      const tx = await gigsContract.connect(freelancer1).cancelGig(0);
      await expect(tx).to.emit(gigsContract, "GigCancelled");
    });
  });

  describe("Emergency Cancel", function () {
    beforeEach(async function () {
      // Create gig for emergency cancel test
      await gigsContract.connect(client).createGig(sampleGig);
    });

    it("Should allow owner to emergency cancel", async function () {
      const clientBalanceBefore = await ethers.provider.getBalance(client.address);

      const tx = await gigsContract.connect(owner).emergencyCancel(0);

      await expect(tx).to.emit(gigsContract, "GigCancelled").withArgs(0, 3, anyValue);

      // Note: Emergency cancel only refunds if gig is InProgress, but this gig is Open
      const clientBalanceAfter = await ethers.provider.getBalance(client.address);
      expect(clientBalanceAfter).to.equal(clientBalanceBefore);
    });

    it("Should revert if called by non-owner", async function () {
      await expect(gigsContract.connect(client).emergencyCancel(0)).to.be.revertedWith("Only owner can call this");
    });
  });

  describe("View Functions", function () {
    it("Should return correct total gigs posted", async function () {
      // Create two gigs
      await gigsContract.connect(client).createGig(sampleGig);
      await gigsContract.connect(client).createGig({
        ...sampleGig,
        title: "Second Gig",
      });

      expect(await gigsContract.getTotalGigsPosted()).to.equal(2);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle multiple gigs from same client", async function () {
      await gigsContract.connect(client).createGig(sampleGig);
      await gigsContract.connect(client).createGig({
        ...sampleGig,
        title: "Second Gig",
      });
      await gigsContract.connect(client).createGig({
        ...sampleGig,
        title: "Third Gig",
      });

      expect(await gigsContract.postedGigsCounter()).to.equal(3);
    });

    it("Should handle gigs from different clients", async function () {
      // Create gigs from different clients
      await gigsContract.connect(client).createGig({
        ...sampleGig,
        title: "Gig from client 1",
      });

      await gigsContract.connect(other).createGig({
        ...sampleGig,
        title: "Gig from client 2",
      });

      expect(await gigsContract.postedGigsCounter()).to.equal(2);
    });

    it("Should maintain correct gig states throughout lifecycle", async function () {
      // Create new gig
      await gigsContract.connect(client).createGig(sampleGig);

      // Gig should start in Open (0)
      let gig = await gigsContract.postedGigs(0);
      expect(gig.state).to.equal(0);

      // Apply and accept to move to InProgress (1)
      await gigsContract.connect(freelancer1).applyToGig(0, sampleApplication);
      await gigsContract.connect(client).acceptApplication(0, 0, { value: sampleApplication.proposedPayment });

      gig = await gigsContract.postedGigs(0);
      expect(gig.state).to.equal(1);

      // Complete it to move to Completed (2)
      await gigsContract.connect(freelancer1).confirmCompletion(0, 0);
      await gigsContract.connect(client).confirmCompletion(0, 1);

      gig = await gigsContract.postedGigs(0);
      expect(gig.state).to.equal(2);
    });

    it("Should handle complex application scenarios", async function () {
      // Create gig
      await gigsContract.connect(client).createGig(sampleGig);

      // Multiple freelancers apply
      await gigsContract.connect(freelancer1).applyToGig(0, sampleApplication);

      const app2 = { ...sampleApplication, proposedPayment: ethers.parseEther("1.8") };
      await gigsContract.connect(freelancer2).applyToGig(0, app2);

      // Client rejects first application
      await gigsContract.connect(client).rejectApplication(0, 0, "Not what we're looking for");

      // Client accepts second application
      await gigsContract.connect(client).acceptApplication(0, 1, { value: app2.proposedPayment });

      // Verify correct freelancer is accepted
      const gig = await gigsContract.postedGigs(0);
      expect(gig.acceptedFreelancer).to.equal(freelancer2.address);
      expect(gig.finalPayment).to.equal(app2.proposedPayment);
    });
  });

  describe("Length Validation", function () {
    it("Should revert if gig title exceeds 64 characters", async function () {
      const invalidGig = { ...sampleGig, title: "a".repeat(65) };
      await expect(gigsContract.connect(client).createGig(invalidGig)).to.be.revertedWith(
        "Title must be up to 64 characters",
      );
    });

    it("Should revert if gig description exceeds 512 characters", async function () {
      const invalidGig = { ...sampleGig, description: "a".repeat(513) };
      await expect(gigsContract.connect(client).createGig(invalidGig)).to.be.revertedWith(
        "Description must be up to 512 characters",
      );
    });

    it("Should revert if gig category exceeds 64 characters", async function () {
      const invalidGig = { ...sampleGig, category: "a".repeat(65) };
      await expect(gigsContract.connect(client).createGig(invalidGig)).to.be.revertedWith(
        "Category must be up to 64 characters",
      );
    });

    it("Should revert if gig banner image hash exceeds 128 characters", async function () {
      const invalidGig = { ...sampleGig, gigBannerImageHash: "a".repeat(129) };
      await expect(gigsContract.connect(client).createGig(invalidGig)).to.be.revertedWith(
        "Banner image hash must be up to 128 characters",
      );
    });

    it("Should revert if application proposal exceeds 512 characters", async function () {
      await gigsContract.connect(client).createGig(sampleGig);
      const invalidApplication = { ...sampleApplication, proposal: "a".repeat(513) };
      await expect(gigsContract.connect(freelancer1).applyToGig(0, invalidApplication)).to.be.revertedWith(
        "Proposal comment must be up to 512 characters",
      );
    });

    it("Should revert if rejection comment exceeds 512 characters", async function () {
      await gigsContract.connect(client).createGig(sampleGig);
      await gigsContract.connect(freelancer1).applyToGig(0, sampleApplication);
      const longComment = "a".repeat(513);
      await expect(gigsContract.connect(client).rejectApplication(0, 0, longComment)).to.be.revertedWith(
        "Rejection comment must be up to 512 characters",
      );
    });
  });
});
