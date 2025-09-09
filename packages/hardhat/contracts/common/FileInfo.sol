// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

struct FileInfo {
    string resource;
    uint256 uploadedAt;
    string submissionComment;
    string clientResponse;
    bool isLink; // Whether the file is a link or an uploaded file
}

struct FileParams {
    string resource;
    string submissionComment;
    bool isLink;
}
