// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

enum DeliverableState {
    Pending, // 0 - Awaiting client review
    Approved, // 1 - Approved by client
    Rejected, // 2 - Rejected by client, needs resubmission
    Disputed // 3 - Under dispute resolution
}

struct DeliverableInfo {
    string resource;
    uint256 uploadedAt;
    string submissionComment;
    string clientResponse;
    uint256 responseTimestamp;
    DeliverableState state;
    bool isLink; // Whether the file is a link or an uploaded file
}

struct DeliverableParams {
    string resource;
    string submissionComment;
    bool isLink;
}
