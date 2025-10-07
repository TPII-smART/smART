// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

struct DeliverableInfo {
    string resource;
    uint256 uploadedAt;
    string submissionComment;
    string clientResponse;
    uint256 responseTimestamp;
    bool isLink; // Whether the file is a link or an uploaded file
}

struct DeliverableParams {
    string resource;
    string submissionComment;
    bool isLink;
}
