// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "./utils/StringUtils.sol";


contract ProfileConfigContract {
    struct Profile {
        string username;
        string profilePicture;
        string bannerPicture;
        string biography;
        string email;
        string xUrl;
        string instagramUrl;
        string linkedinUrl;
        string artstationUrl;
        string sketchfabUrl;
        string customUrl;
    }

    mapping(address => Profile) private profiles;

    event ProfileUpdated(
        address indexed user,
        Profile profile
    );

    modifier onlyProfileOwner(address user) {
        require(msg.sender == user, "Not profile owner");
        _;
    }


    function setProfile(
        Profile calldata profileData
    ) external {
        if (bytes(profileData.xUrl).length > 0) {
            require(
            StringUtils.isValidUrl(profileData.xUrl, "x.com") 
                || StringUtils.isValidUrl(profileData.xUrl, "twitter.com"),
            "Invalid X URL"
            );
        }
        
        if (bytes(profileData.instagramUrl).length > 0) {
            require(
            StringUtils.isValidUrl(profileData.instagramUrl, "instagram.com"),
            "Invalid Instagram URL"
            );
        }
        
        if (bytes(profileData.linkedinUrl).length > 0) {
            require(
            StringUtils.isValidUrl(profileData.linkedinUrl, "linkedin.com"),
            "Invalid LinkedIn URL"
            );
        }
       
        if (bytes(profileData.artstationUrl).length > 0) {
            require(
            StringUtils.isValidUrl(profileData.artstationUrl, "artstation.com"),
            "Invalid ArtStation URL"
            );
        }
        
        if (bytes(profileData.sketchfabUrl).length > 0) {
            require(
            StringUtils.isValidUrl(profileData.sketchfabUrl, "sketchfab.com"),
            "Invalid Sketchfab URL"
            );
        }
        
        if (bytes(profileData.customUrl).length > 0) {
            require(
            StringUtils.isValidUrl(profileData.customUrl, ""),
            "Invalid Custom URL"
            );
        }

        require(StringUtils.isMaxLength(profileData.username, 64), "Username exceeds max length of 64 characters");
        require(StringUtils.isMaxLength(profileData.profilePicture, 1024), "Profile picture URL exceeds max length of 1024 characters");
        require(StringUtils.isMaxLength(profileData.bannerPicture, 1024), "Banner picture URL exceeds max length of 1024 characters");
        require(StringUtils.isMaxLength(profileData.biography, 512), "Biography exceeds max length of 512 characters");
        require(StringUtils.isMaxLength(profileData.email, 128), "Email exceeds max length of 128 characters");
        if (bytes(profileData.email).length > 0) {
            require(StringUtils.contains(profileData.email, "@"), "Email must be an email address");
            require(StringUtils.contains(profileData.email, "."), "Email must be an email address");
        }
        require(StringUtils.isMaxLength(profileData.xUrl, 256), "X URL exceeds max length of 256 characters");
        require(StringUtils.isMaxLength(profileData.instagramUrl, 256), "Instagram URL exceeds max length of 256 characters");
        require(StringUtils.isMaxLength(profileData.linkedinUrl, 256), "LinkedIn URL exceeds max length of 256 characters");
        require(StringUtils.isMaxLength(profileData.artstationUrl, 256), "ArtStation URL exceeds max length of 256 characters");
        require(StringUtils.isMaxLength(profileData.sketchfabUrl, 256), "Sketchfab URL exceeds max length of 256 characters");
        require(StringUtils.isMaxLength(profileData.customUrl, 256), "Custom URL exceeds max length of 256 characters");

        Profile storage profile = profiles[msg.sender];
        {
            profile.username = StringUtils.updateIfDefined(profile.username, profileData.username);
            profile.profilePicture = StringUtils.updateIfDefined(profile.profilePicture, profileData.profilePicture);
            profile.bannerPicture = StringUtils.updateIfDefined(profile.bannerPicture, profileData.bannerPicture);
            profile.biography = StringUtils.updateIfDefined(profile.biography, profileData.biography);
            profile.email = StringUtils.updateIfDefined(profile.email, profileData.email);
            profile.xUrl = StringUtils.updateIfDefinedWithPrefix(profile.xUrl, profileData.xUrl, "https://");
            profile.instagramUrl = StringUtils.updateIfDefinedWithPrefix(profile.instagramUrl, profileData.instagramUrl, "https://");
            profile.linkedinUrl = StringUtils.updateIfDefinedWithPrefix(profile.linkedinUrl, profileData.linkedinUrl, "https://");
            profile.artstationUrl = StringUtils.updateIfDefinedWithPrefix(profile.artstationUrl, profileData.artstationUrl, "https://");
            profile.sketchfabUrl = StringUtils.updateIfDefinedWithPrefix(profile.sketchfabUrl, profileData.sketchfabUrl, "https://");
            profile.customUrl = StringUtils.updateIfDefinedWithPrefix(profile.customUrl, profileData.customUrl, "https://");
        }

        emit ProfileUpdated(
            msg.sender,
            profile
        );
    }

    function getProfile(address user)
        external
        view
        returns (
            Profile memory profileData
        )
    {
        Profile storage profile = profiles[user];
        {
            profileData.username = profile.username;
            profileData.profilePicture = profile.profilePicture;
            profileData.bannerPicture = profile.bannerPicture;
            profileData.biography = profile.biography;
            profileData.email = profile.email;
            profileData.xUrl = profile.xUrl;
            profileData.instagramUrl = profile.instagramUrl;
            profileData.linkedinUrl = profile.linkedinUrl;
            profileData.artstationUrl = profile.artstationUrl;
            profileData.sketchfabUrl = profile.sketchfabUrl;
            profileData.customUrl = profile.customUrl;
        }
    }
}