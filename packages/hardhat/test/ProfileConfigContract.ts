import { expect } from "chai";
import { ethers } from "hardhat";
import { ProfileConfigContract } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("ProfileConfigContract", function () {
  let profileContract: ProfileConfigContract;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  const sampleProfile = {
    username: "testuser123",
    profilePicture: "https://example.com/profile.jpg",
    bannerPicture: "https://example.com/banner.jpg",
    biography: "I'm a freelance developer with 5+ years of experience in web development.",
    email: "test@example.com",
    xUrl: "https://x.com/testuser",
    instagramUrl: "https://instagram.com/testuser",
    linkedinUrl: "https://linkedin.com/in/testuser",
    artstationUrl: "https://artstation.com/testuser",
    sketchfabUrl: "https://sketchfab.com/testuser",
    customUrl: "https://testuser.dev",
  };

  const emptyProfile = {
    username: "",
    profilePicture: "",
    bannerPicture: "",
    biography: "",
    email: "",
    xUrl: "",
    instagramUrl: "",
    linkedinUrl: "",
    artstationUrl: "",
    sketchfabUrl: "",
    customUrl: "",
  };

  beforeEach(async () => {
    [user1, user2] = await ethers.getSigners();
    const profileContractFactory = await ethers.getContractFactory("ProfileConfigContract");
    profileContract = (await profileContractFactory.deploy()) as ProfileConfigContract;
    await profileContract.waitForDeployment();
  });

  describe("Profile Setting", function () {
    it("Should set a complete profile with valid parameters", async function () {
      const tx = await profileContract.connect(user1).setProfile(sampleProfile);

      await expect(tx)
        .to.emit(profileContract, "ProfileUpdated")
        .withArgs(user1.address, [
          sampleProfile.username,
          sampleProfile.profilePicture,
          sampleProfile.bannerPicture,
          sampleProfile.biography,
          sampleProfile.email,
          sampleProfile.xUrl,
          sampleProfile.instagramUrl,
          sampleProfile.linkedinUrl,
          sampleProfile.artstationUrl,
          sampleProfile.sketchfabUrl,
          sampleProfile.customUrl,
        ]);
    });

    it("Should retrieve profile correctly after setting", async function () {
      await profileContract.connect(user1).setProfile(sampleProfile);

      const profile = await profileContract.getProfile(user1.address);
      expect(profile.username).to.equal(sampleProfile.username);
      expect(profile.profilePicture).to.equal(sampleProfile.profilePicture);
      expect(profile.bannerPicture).to.equal(sampleProfile.bannerPicture);
      expect(profile.biography).to.equal(sampleProfile.biography);
      expect(profile.email).to.equal(sampleProfile.email);
      expect(profile.xUrl).to.equal(sampleProfile.xUrl);
      expect(profile.instagramUrl).to.equal(sampleProfile.instagramUrl);
      expect(profile.linkedinUrl).to.equal(sampleProfile.linkedinUrl);
      expect(profile.artstationUrl).to.equal(sampleProfile.artstationUrl);
      expect(profile.sketchfabUrl).to.equal(sampleProfile.sketchfabUrl);
      expect(profile.customUrl).to.equal(sampleProfile.customUrl);
    });

    it("Should return empty profile for users who haven't set one", async function () {
      const profile = await profileContract.getProfile(user1.address);
      expect(profile.username).to.equal("");
      expect(profile.profilePicture).to.equal("");
      expect(profile.bannerPicture).to.equal("");
      expect(profile.biography).to.equal("");
      expect(profile.email).to.equal("");
      expect(profile.xUrl).to.equal("");
      expect(profile.instagramUrl).to.equal("");
      expect(profile.linkedinUrl).to.equal("");
      expect(profile.artstationUrl).to.equal("");
      expect(profile.sketchfabUrl).to.equal("");
      expect(profile.customUrl).to.equal("");
    });

    it("Should allow setting empty profile", async function () {
      await expect(profileContract.connect(user1).setProfile(emptyProfile)).to.not.be.reverted;
    });

    it("Should update existing profile", async function () {
      // Set initial profile
      await profileContract.connect(user1).setProfile(sampleProfile);

      // Update with new data
      const updatedProfile = {
        ...sampleProfile,
        username: "newusername",
        biography: "Updated biography with new information",
      };

      await profileContract.connect(user1).setProfile(updatedProfile);

      const profile = await profileContract.getProfile(user1.address);
      expect(profile.username).to.equal("newusername");
      expect(profile.biography).to.equal("Updated biography with new information");
      expect(profile.email).to.equal(sampleProfile.email); // Should remain unchanged
    });
  });

  describe("Username Validation", function () {
    it("Should accept valid username", async function () {
      const profileWithUsername = { ...emptyProfile, username: "validuser123" };
      await expect(profileContract.connect(user1).setProfile(profileWithUsername)).to.not.be.reverted;
    });

    it("Should accept maximum length username (64 characters)", async function () {
      const maxLengthUsername = "a".repeat(64);
      const profileWithMaxUsername = { ...emptyProfile, username: maxLengthUsername };
      await expect(profileContract.connect(user1).setProfile(profileWithMaxUsername)).to.not.be.reverted;
    });

    it("Should revert with username exceeding 64 characters", async function () {
      const tooLongUsername = "a".repeat(65);
      const profileWithLongUsername = { ...emptyProfile, username: tooLongUsername };
      await expect(profileContract.connect(user1).setProfile(profileWithLongUsername)).to.be.revertedWith(
        "Username exceeds max length of 64 characters",
      );
    });

    it("Should accept empty username", async function () {
      const profileWithEmptyUsername = { ...emptyProfile, username: "" };
      await expect(profileContract.connect(user1).setProfile(profileWithEmptyUsername)).to.not.be.reverted;
    });
  });

  describe("Email Validation", function () {
    it("Should accept valid email", async function () {
      const profileWithEmail = { ...emptyProfile, email: "user@example.com" };
      await expect(profileContract.connect(user1).setProfile(profileWithEmail)).to.not.be.reverted;
    });

    it("Should accept complex valid email", async function () {
      const profileWithEmail = { ...emptyProfile, email: "user.name+tag@subdomain.example.com" };
      await expect(profileContract.connect(user1).setProfile(profileWithEmail)).to.not.be.reverted;
    });

    it("Should revert with email missing @", async function () {
      const profileWithInvalidEmail = { ...emptyProfile, email: "userexample.com" };
      await expect(profileContract.connect(user1).setProfile(profileWithInvalidEmail)).to.be.revertedWith(
        "Email must be an email address",
      );
    });

    it("Should revert with email missing domain", async function () {
      const profileWithInvalidEmail = { ...emptyProfile, email: "user@" };
      await expect(profileContract.connect(user1).setProfile(profileWithInvalidEmail)).to.be.revertedWith(
        "Email must be an email address",
      );
    });

    it("Should revert with email missing dot", async function () {
      const profileWithInvalidEmail = { ...emptyProfile, email: "user@example" };
      await expect(profileContract.connect(user1).setProfile(profileWithInvalidEmail)).to.be.revertedWith(
        "Email must be an email address",
      );
    });

    it("Should accept maximum length email (128 characters)", async function () {
      const maxLengthEmail = "a".repeat(116) + "@example.com"; // 128 chars total
      const profileWithMaxEmail = { ...emptyProfile, email: maxLengthEmail };
      await expect(profileContract.connect(user1).setProfile(profileWithMaxEmail)).to.not.be.reverted;
    });

    it("Should revert with email exceeding 128 characters", async function () {
      const tooLongEmail = "a".repeat(117) + "@example.com"; // 129 chars total
      const profileWithLongEmail = { ...emptyProfile, email: tooLongEmail };
      await expect(profileContract.connect(user1).setProfile(profileWithLongEmail)).to.be.revertedWith(
        "Email exceeds max length of 128 characters",
      );
    });

    it("Should accept empty email", async function () {
      const profileWithEmptyEmail = { ...emptyProfile, email: "" };
      await expect(profileContract.connect(user1).setProfile(profileWithEmptyEmail)).to.not.be.reverted;
    });
  });

  describe("URL Validation", function () {
    describe("X (Twitter) URL", function () {
      it("Should accept valid x.com URL", async function () {
        const profileWithXUrl = { ...emptyProfile, xUrl: "https://x.com/testuser" };
        await expect(profileContract.connect(user1).setProfile(profileWithXUrl)).to.not.be.reverted;
      });

      it("Should accept valid twitter.com URL", async function () {
        const profileWithTwitterUrl = { ...emptyProfile, xUrl: "https://twitter.com/testuser" };
        await expect(profileContract.connect(user1).setProfile(profileWithTwitterUrl)).to.not.be.reverted;
      });

      it("Should add https prefix if missing", async function () {
        const profileWithXUrl = { ...emptyProfile, xUrl: "x.com/testuser" };
        await profileContract.connect(user1).setProfile(profileWithXUrl);

        const profile = await profileContract.getProfile(user1.address);
        expect(profile.xUrl).to.equal("https://x.com/testuser");
      });

      it("Should revert with invalid X URL domain", async function () {
        const profileWithInvalidUrl = { ...emptyProfile, xUrl: "https://facebook.com/testuser" };
        await expect(profileContract.connect(user1).setProfile(profileWithInvalidUrl)).to.be.revertedWith(
          "Invalid X URL",
        );
      });

      it("Should revert with X URL exceeding 256 characters", async function () {
        const tooLongUrl = "https://x.com/" + "a".repeat(243); // Over 256 chars
        const profileWithLongUrl = { ...emptyProfile, xUrl: tooLongUrl };
        await expect(profileContract.connect(user1).setProfile(profileWithLongUrl)).to.be.revertedWith(
          "X URL exceeds max length of 256 characters",
        );
      });
    });

    describe("Instagram URL", function () {
      it("Should accept valid Instagram URL", async function () {
        const profileWithInstagramUrl = { ...emptyProfile, instagramUrl: "https://instagram.com/testuser" };
        await expect(profileContract.connect(user1).setProfile(profileWithInstagramUrl)).to.not.be.reverted;
      });

      it("Should add https prefix if missing", async function () {
        const profileWithInstagramUrl = { ...emptyProfile, instagramUrl: "instagram.com/testuser" };
        await profileContract.connect(user1).setProfile(profileWithInstagramUrl);

        const profile = await profileContract.getProfile(user1.address);
        expect(profile.instagramUrl).to.equal("https://instagram.com/testuser");
      });

      it("Should revert with invalid Instagram URL domain", async function () {
        const profileWithInvalidUrl = { ...emptyProfile, instagramUrl: "https://facebook.com/testuser" };
        await expect(profileContract.connect(user1).setProfile(profileWithInvalidUrl)).to.be.revertedWith(
          "Invalid Instagram URL",
        );
      });
    });

    describe("LinkedIn URL", function () {
      it("Should accept valid LinkedIn URL", async function () {
        const profileWithLinkedInUrl = { ...emptyProfile, linkedinUrl: "https://linkedin.com/in/testuser" };
        await expect(profileContract.connect(user1).setProfile(profileWithLinkedInUrl)).to.not.be.reverted;
      });

      it("Should add https prefix if missing", async function () {
        const profileWithLinkedInUrl = { ...emptyProfile, linkedinUrl: "linkedin.com/in/testuser" };
        await profileContract.connect(user1).setProfile(profileWithLinkedInUrl);

        const profile = await profileContract.getProfile(user1.address);
        expect(profile.linkedinUrl).to.equal("https://linkedin.com/in/testuser");
      });

      it("Should revert with invalid LinkedIn URL domain", async function () {
        const profileWithInvalidUrl = { ...emptyProfile, linkedinUrl: "https://facebook.com/testuser" };
        await expect(profileContract.connect(user1).setProfile(profileWithInvalidUrl)).to.be.revertedWith(
          "Invalid LinkedIn URL",
        );
      });
    });

    describe("ArtStation URL", function () {
      it("Should accept valid ArtStation URL", async function () {
        const profileWithArtStationUrl = { ...emptyProfile, artstationUrl: "https://artstation.com/testuser" };
        await expect(profileContract.connect(user1).setProfile(profileWithArtStationUrl)).to.not.be.reverted;
      });

      it("Should add https prefix if missing", async function () {
        const profileWithArtStationUrl = { ...emptyProfile, artstationUrl: "artstation.com/testuser" };
        await profileContract.connect(user1).setProfile(profileWithArtStationUrl);

        const profile = await profileContract.getProfile(user1.address);
        expect(profile.artstationUrl).to.equal("https://artstation.com/testuser");
      });

      it("Should revert with invalid ArtStation URL domain", async function () {
        const profileWithInvalidUrl = { ...emptyProfile, artstationUrl: "https://deviantart.com/testuser" };
        await expect(profileContract.connect(user1).setProfile(profileWithInvalidUrl)).to.be.revertedWith(
          "Invalid ArtStation URL",
        );
      });
    });

    describe("Sketchfab URL", function () {
      it("Should accept valid Sketchfab URL", async function () {
        const profileWithSketchfabUrl = { ...emptyProfile, sketchfabUrl: "https://sketchfab.com/testuser" };
        await expect(profileContract.connect(user1).setProfile(profileWithSketchfabUrl)).to.not.be.reverted;
      });

      it("Should add https prefix if missing", async function () {
        const profileWithSketchfabUrl = { ...emptyProfile, sketchfabUrl: "sketchfab.com/testuser" };
        await profileContract.connect(user1).setProfile(profileWithSketchfabUrl);

        const profile = await profileContract.getProfile(user1.address);
        expect(profile.sketchfabUrl).to.equal("https://sketchfab.com/testuser");
      });

      it("Should revert with invalid Sketchfab URL domain", async function () {
        const profileWithInvalidUrl = { ...emptyProfile, sketchfabUrl: "https://artstation.com/testuser" };
        await expect(profileContract.connect(user1).setProfile(profileWithInvalidUrl)).to.be.revertedWith(
          "Invalid Sketchfab URL",
        );
      });
    });

    describe("Custom URL", function () {
      it("Should accept valid custom URL", async function () {
        const profileWithCustomUrl = { ...emptyProfile, customUrl: "https://myportfolio.dev" };
        await expect(profileContract.connect(user1).setProfile(profileWithCustomUrl)).to.not.be.reverted;
      });

      it("Should add https prefix if missing", async function () {
        const profileWithCustomUrl = { ...emptyProfile, customUrl: "myportfolio.dev" };
        await profileContract.connect(user1).setProfile(profileWithCustomUrl);

        const profile = await profileContract.getProfile(user1.address);
        expect(profile.customUrl).to.equal("https://myportfolio.dev");
      });

      it("Should accept various domains for custom URL", async function () {
        const profileWithCustomUrl = { ...emptyProfile, customUrl: "https://github.io/user" };
        await expect(profileContract.connect(user1).setProfile(profileWithCustomUrl)).to.not.be.reverted;
      });
    });

    describe("URL Length Limits", function () {
      it("Should accept maximum length URLs (256 characters)", async function () {
        const maxLengthUrl = "https://" + "a".repeat(244) + ".com"; // 256 chars total
        const profileWithMaxUrl = { ...emptyProfile, customUrl: maxLengthUrl };
        await expect(profileContract.connect(user1).setProfile(profileWithMaxUrl)).to.not.be.reverted;
      });

      it("Should revert with URLs exceeding 256 characters", async function () {
        const tooLongUrl = "https://" + "a".repeat(245) + ".com"; // 257 chars total
        const profileWithLongUrl = { ...emptyProfile, customUrl: tooLongUrl };
        await expect(profileContract.connect(user1).setProfile(profileWithLongUrl)).to.be.revertedWith(
          "Custom URL exceeds max length of 256 characters",
        );
      });
    });
  });

  describe("Image URL Validation", function () {
    it("Should accept valid profile picture URL", async function () {
      const profileWithPicture = { ...emptyProfile, profilePicture: "https://example.com/profile.jpg" };
      await expect(profileContract.connect(user1).setProfile(profileWithPicture)).to.not.be.reverted;
    });

    it("Should accept valid banner picture URL", async function () {
      const profileWithBanner = { ...emptyProfile, bannerPicture: "https://example.com/banner.jpg" };
      await expect(profileContract.connect(user1).setProfile(profileWithBanner)).to.not.be.reverted;
    });

    it("Should accept maximum length profile picture URL (1024 characters)", async function () {
      const maxLengthUrl = "https://example.com/" + "a".repeat(1000) + ".jpg"; // 1024 chars total
      const profileWithMaxPicture = { ...emptyProfile, profilePicture: maxLengthUrl };
      await expect(profileContract.connect(user1).setProfile(profileWithMaxPicture)).to.not.be.reverted;
    });

    it("Should revert with profile picture URL exceeding 1024 characters", async function () {
      const tooLongUrl = "https://example.com/" + "a".repeat(1001) + ".jpg"; // 1025 chars total
      const profileWithLongPicture = { ...emptyProfile, profilePicture: tooLongUrl };
      await expect(profileContract.connect(user1).setProfile(profileWithLongPicture)).to.be.revertedWith(
        "Profile picture URL exceeds max length of 1024 characters",
      );
    });

    it("Should revert with banner picture URL exceeding 1024 characters", async function () {
      const tooLongUrl = "https://example.com/" + "a".repeat(1001) + ".jpg"; // 1025 chars total
      const profileWithLongBanner = { ...emptyProfile, bannerPicture: tooLongUrl };
      await expect(profileContract.connect(user1).setProfile(profileWithLongBanner)).to.be.revertedWith(
        "Banner picture URL exceeds max length of 1024 characters",
      );
    });
  });

  describe("Biography Validation", function () {
    it("Should accept valid biography", async function () {
      const profileWithBio = { ...emptyProfile, biography: "I'm a developer with experience in blockchain." };
      await expect(profileContract.connect(user1).setProfile(profileWithBio)).to.not.be.reverted;
    });

    it("Should accept maximum length biography (512 characters)", async function () {
      const maxLengthBio = "a".repeat(512);
      const profileWithMaxBio = { ...emptyProfile, biography: maxLengthBio };
      await expect(profileContract.connect(user1).setProfile(profileWithMaxBio)).to.not.be.reverted;
    });

    it("Should revert with biography exceeding 512 characters", async function () {
      const tooLongBio = "a".repeat(513);
      const profileWithLongBio = { ...emptyProfile, biography: tooLongBio };
      await expect(profileContract.connect(user1).setProfile(profileWithLongBio)).to.be.revertedWith(
        "Biography exceeds max length of 512 characters",
      );
    });

    it("Should accept empty biography", async function () {
      const profileWithEmptyBio = { ...emptyProfile, biography: "" };
      await expect(profileContract.connect(user1).setProfile(profileWithEmptyBio)).to.not.be.reverted;
    });

    it("Should accept biography with special characters", async function () {
      const profileWithSpecialBio = {
        ...emptyProfile,
        biography: "Hello! I'm a developer 👨‍💻 working on Web3 & blockchain projects. Contact me @ email.com",
      };
      await expect(profileContract.connect(user1).setProfile(profileWithSpecialBio)).to.not.be.reverted;
    });
  });

  describe("Multiple Users", function () {
    it("Should handle profiles from different users independently", async function () {
      // Set profile for user1
      await profileContract.connect(user1).setProfile(sampleProfile);

      // Set different profile for user2
      const user2Profile = {
        ...sampleProfile,
        username: "user2",
        email: "user2@example.com",
        biography: "Different biography for user2",
      };
      await profileContract.connect(user2).setProfile(user2Profile);

      // Check both profiles are stored correctly
      const profile1 = await profileContract.getProfile(user1.address);
      const profile2 = await profileContract.getProfile(user2.address);

      expect(profile1.username).to.equal(sampleProfile.username);
      expect(profile2.username).to.equal("user2");
      expect(profile1.email).to.equal(sampleProfile.email);
      expect(profile2.email).to.equal("user2@example.com");
    });

    it("Should allow same data across different users", async function () {
      // Both users can have the same username/email
      await profileContract.connect(user1).setProfile(sampleProfile);
      await profileContract.connect(user2).setProfile(sampleProfile);

      const profile1 = await profileContract.getProfile(user1.address);
      const profile2 = await profileContract.getProfile(user2.address);

      expect(profile1.username).to.equal(profile2.username);
      expect(profile1.email).to.equal(profile2.email);
    });
  });

  describe("Profile Updates", function () {
    beforeEach(async function () {
      await profileContract.connect(user1).setProfile(sampleProfile);
    });

    it("Should update only specified fields", async function () {
      // Update only username and biography
      const partialUpdate = {
        ...emptyProfile,
        username: "newusername",
        biography: "New biography",
      };

      await profileContract.connect(user1).setProfile(partialUpdate);

      const profile = await profileContract.getProfile(user1.address);
      expect(profile.username).to.equal("newusername");
      expect(profile.biography).to.equal("New biography");
      // Other fields should remain unchanged
      expect(profile.email).to.equal(sampleProfile.email);
      expect(profile.xUrl).to.equal(sampleProfile.xUrl);
    });

    it("Should handle multiple sequential updates", async function () {
      // First update
      const update1 = { ...emptyProfile, username: "update1" };
      await profileContract.connect(user1).setProfile(update1);

      // Second update
      const update2 = { ...emptyProfile, biography: "Updated bio" };
      await profileContract.connect(user1).setProfile(update2);

      // Third update
      const update3 = { ...emptyProfile, email: "new@example.com" };
      await profileContract.connect(user1).setProfile(update3);

      const profile = await profileContract.getProfile(user1.address);
      expect(profile.username).to.equal("update1");
      expect(profile.biography).to.equal("Updated bio");
      expect(profile.email).to.equal("new@example.com");
      // Original fields should remain
      expect(profile.xUrl).to.equal(sampleProfile.xUrl);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle profile with only URLs", async function () {
      const urlOnlyProfile = {
        ...emptyProfile,
        xUrl: "x.com/test",
        instagramUrl: "instagram.com/test",
        linkedinUrl: "linkedin.com/in/test",
      };

      await profileContract.connect(user1).setProfile(urlOnlyProfile);

      const profile = await profileContract.getProfile(user1.address);
      expect(profile.xUrl).to.equal("https://x.com/test");
      expect(profile.instagramUrl).to.equal("https://instagram.com/test");
      expect(profile.linkedinUrl).to.equal("https://linkedin.com/in/test");
      expect(profile.username).to.equal("");
      expect(profile.email).to.equal("");
    });

    it("Should handle profile with mixed valid and empty fields", async function () {
      const mixedProfile = {
        username: "validuser",
        profilePicture: "",
        bannerPicture: "https://example.com/banner.jpg",
        biography: "",
        email: "valid@email.com",
        xUrl: "",
        instagramUrl: "instagram.com/user",
        linkedinUrl: "",
        artstationUrl: "",
        sketchfabUrl: "",
        customUrl: "mysite.dev",
      };

      await profileContract.connect(user1).setProfile(mixedProfile);

      const profile = await profileContract.getProfile(user1.address);
      expect(profile.username).to.equal("validuser");
      expect(profile.profilePicture).to.equal("");
      expect(profile.bannerPicture).to.equal("https://example.com/banner.jpg");
      expect(profile.email).to.equal("valid@email.com");
      expect(profile.instagramUrl).to.equal("https://instagram.com/user");
      expect(profile.customUrl).to.equal("https://mysite.dev");
    });

    it("Should handle boundary length values", async function () {
      const boundaryProfile = {
        username: "a".repeat(64), // Exactly 64 chars
        profilePicture: "https://example.com/" + "a".repeat(1000) + ".jpg", // Exactly 1024 chars
        bannerPicture: "https://example.com/" + "a".repeat(1000) + ".jpg", // Exactly 1024 chars
        biography: "a".repeat(512), // Exactly 512 chars
        email: "a".repeat(115) + "@example.com", // Exactly 128 chars
        xUrl: "https://x.com/" + "a".repeat(241), // Exactly 256 chars
        instagramUrl: "",
        linkedinUrl: "",
        artstationUrl: "",
        sketchfabUrl: "",
        customUrl: "",
      };

      await expect(profileContract.connect(user1).setProfile(boundaryProfile)).to.not.be.reverted;
    });
  });

  describe("Event Emission", function () {
    it("Should emit ProfileUpdated event with correct parameters", async function () {
      const tx = await profileContract.connect(user1).setProfile(sampleProfile);

      await expect(tx)
        .to.emit(profileContract, "ProfileUpdated")
        .withArgs(user1.address, [
          sampleProfile.username,
          sampleProfile.profilePicture,
          sampleProfile.bannerPicture,
          sampleProfile.biography,
          sampleProfile.email,
          sampleProfile.xUrl,
          sampleProfile.instagramUrl,
          sampleProfile.linkedinUrl,
          sampleProfile.artstationUrl,
          sampleProfile.sketchfabUrl,
          sampleProfile.customUrl,
        ]);
    });

    it("Should emit event on profile update", async function () {
      // Set initial profile
      await profileContract.connect(user1).setProfile(sampleProfile);

      // Update profile
      const updatedProfile = { ...sampleProfile, username: "newuser" };
      const tx = await profileContract.connect(user1).setProfile(updatedProfile);

      await expect(tx)
        .to.emit(profileContract, "ProfileUpdated")
        .withArgs(user1.address, [
          "newuser",
          sampleProfile.profilePicture,
          sampleProfile.bannerPicture,
          sampleProfile.biography,
          sampleProfile.email,
          sampleProfile.xUrl,
          sampleProfile.instagramUrl,
          sampleProfile.linkedinUrl,
          sampleProfile.artstationUrl,
          sampleProfile.sketchfabUrl,
          sampleProfile.customUrl,
        ]);
    });
  });
});
